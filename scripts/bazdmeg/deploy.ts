import { execFileSync, execSync, execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { promisify } from "node:util";
import type { DeployState, Phase3Plan, Phase3Result, VersionInfo } from "./types.js";

const execFileAsync = promisify(execFile);

const DATA_DIR = join(process.cwd(), ".bazdmeg");
const DEPLOY_STATE_FILE = join(DATA_DIR, "deploy-state.json");
const R2_BUCKET = "spike-app-assets";
const VERSION_URL = "https://spike.land/api/version";

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".map": "application/json",
};

function loadDeployState(): DeployState {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(DEPLOY_STATE_FILE)) {
    return { lastSha: "", workerHashes: {}, lastDeployedAt: "" };
  }
  return JSON.parse(readFileSync(DEPLOY_STATE_FILE, "utf-8")) as DeployState;
}

function saveDeployState(state: DeployState): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DEPLOY_STATE_FILE, JSON.stringify(state, null, 2));
}

function _md5File(filePath: string): string {
  const content = readFileSync(filePath);
  return createHash("md5").update(content).digest("hex");
}

function getAllFiles(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...getAllFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function getContentType(filePath: string): string {
  return CONTENT_TYPES[extname(filePath)] ?? "application/octet-stream";
}

function fetchDeployedVersion(): VersionInfo | null {
  try {
    const output = execSync(`curl -sf --max-time 10 "${VERSION_URL}"`, {
      encoding: "utf-8",
    });
    return JSON.parse(output) as VersionInfo;
  } catch {
    return null;
  }
}

function getGitTreeHash(path: string): string {
  try {
    return execSync(`git ls-tree -r HEAD -- "${path}" | git hash-object --stdin`, {
      encoding: "utf-8",
      cwd: process.cwd(),
    }).trim();
  } catch {
    return "";
  }
}

function getHeadSha(): string {
  return execSync("git rev-parse HEAD", {
    encoding: "utf-8",
    cwd: process.cwd(),
  }).trim();
}

function getCommitTime(): string {
  return execSync("git log -1 --format=%cI HEAD", {
    encoding: "utf-8",
    cwd: process.cwd(),
  }).trim();
}

function injectBuildMeta(distDir: string, sha: string, time: string): void {
  const indexPath = join(distDir, "index.html");
  if (!existsSync(indexPath)) return;
  let html = readFileSync(indexPath, "utf-8");
  html = html.replace(
    "</head>",
    `<meta name="build-sha" content="${sha}" /><meta name="build-time" content="${time}" /></head>`,
  );
  writeFileSync(indexPath, html);
}

async function uploadFileAsync(filePath: string, key: string, retries = 5): Promise<void> {
  const contentType = getContentType(filePath);
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await execFileAsync(
        "yarn",
        [
          "wrangler",
          "r2",
          "object",
          "put",
          `${R2_BUCKET}/${key}`,
          "--file",
          filePath,
          "--content-type",
          contentType,
          "--remote",
        ],
        { cwd: process.cwd() },
      );
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 2000;
      console.warn(`    Retrying ${key} (${attempt}/${retries}) in ${Math.round(delay)}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export async function deploySPA(): Promise<{ uploaded: number; skipped: number }> {
  const distDir = join(process.cwd(), "packages/spike-web/dist");
  const sha = getHeadSha();
  const commitTime = getCommitTime();

  // Build spike-app
  console.log("  Building spike-app...");
  execSync("npm run build", {
    cwd: join(process.cwd(), "packages/spike-web"),
    stdio: "inherit",
  });

  // Inject build metadata
  injectBuildMeta(distDir, sha, commitTime);

  // Check if deploy is needed by comparing git SHA
  const deployed = fetchDeployedVersion();
  if (deployed?.sha === sha) {
    console.log(`  SPA already at SHA ${sha.slice(0, 8)} — skipping upload.`);
    return { uploaded: 0, skipped: 0 };
  }

  // Upload all files in parallel with limit
  const localFiles = getAllFiles(distDir);
  const CONCURRENCY = 1; // Rate limit protection
  let uploaded = 0;
  const total = localFiles.length;

  console.log(`  Uploading ${total} files to R2 (concurrency=${CONCURRENCY})...`);

  for (let i = 0; i < localFiles.length; i += CONCURRENCY) {
    const chunk = localFiles.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (filePath) => {
        const key = relative(distDir, filePath);
        try {
          await uploadFileAsync(filePath, key);
          uploaded++;
          if (uploaded % 50 === 0 || uploaded === total) {
            console.log(`    Progress: ${uploaded}/${total} files...`);
          }
        } catch (err) {
          console.error(`  Failed to upload ${key} after all retries.`);
          throw err;
        }
      }),
    );
    // Intentional break between chunks to stay under rate limits
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // Update deploy state
  const state = loadDeployState();
  state.lastSha = sha;
  state.lastDeployedAt = new Date().toISOString();
  saveDeployState(state);

  return { uploaded, skipped: 0 };
}

const WORKER_PACKAGES = [
  "spike-edge",
  "spike-land-mcp",
  "mcp-auth",
  "spike-land-backend",
  "transpile",
  "spike-chat",
];

export function getPhase3Plan(): Phase3Plan {
  const state = loadDeployState();
  const currentSha = getHeadSha();
  const spaDistExists = existsSync(join(process.cwd(), "packages/spike-web/dist/index.html"));
  const workersPending = WORKER_PACKAGES.filter((pkg) => {
    const pkgDir = join(process.cwd(), "packages", pkg);
    if (!existsSync(pkgDir)) return false;
    const treeHash = getGitTreeHash(join("packages", pkg));
    return treeHash !== state.workerHashes[pkg];
  });

  return {
    currentSha,
    lastDeployedSha: state.lastSha,
    spaDistExists,
    spaNeedsDeploy: state.lastSha !== currentSha || !spaDistExists,
    workersPending,
  };
}

export function deployWorkers(): string[] {
  const state = loadDeployState();
  const deployed: string[] = [];

  for (const pkg of WORKER_PACKAGES) {
    const pkgDir = join(process.cwd(), "packages", pkg);
    if (!existsSync(pkgDir)) continue;

    const treeHash = getGitTreeHash(join("packages", pkg));
    const lastHash = state.workerHashes[pkg];

    if (treeHash === lastHash) {
      console.log(`  ${pkg}: skip (unchanged)`);
      continue;
    }

    console.log(`  ${pkg}: deploying...`);
    try {
      execSync("npm run deploy", {
        cwd: pkgDir,
        stdio: "inherit",
        timeout: 120_000,
      });
      state.workerHashes[pkg] = treeHash;
      deployed.push(pkg);
    } catch {
      console.error(`  ${pkg}: deploy failed`);
    }
  }

  saveDeployState(state);
  return deployed;
}

interface SmokeResult {
  endpoint: string;
  passed: boolean;
  status: number | null;
  error?: string;
}

function smokeTest(): SmokeResult[] {
  const endpoints: Array<{ url: string; expect: (status: number) => boolean }> = [
    { url: "https://spike.land", expect: (s) => s === 200 },
    { url: "https://spike.land/api/version", expect: (s) => s === 200 },
    { url: "https://auth-mcp.spike.land/", expect: (s) => s >= 200 && s < 400 },
    { url: "https://mcp.spike.land/", expect: (s) => s >= 200 && s < 500 },
  ];

  const results: SmokeResult[] = [];

  for (const { url, expect } of endpoints) {
    try {
      const output = execSync(`curl -sf -o /dev/null -w "%{http_code}" --max-time 15 "${url}"`, {
        encoding: "utf-8",
      });
      const status = parseInt(output.trim(), 10);
      const passed = expect(status);
      results.push({ endpoint: url, passed, status });
      console.log(`  ${passed ? "PASS" : "FAIL"} ${url} → ${status}`);
    } catch {
      results.push({ endpoint: url, passed: false, status: null, error: "unreachable" });
      console.log(`  FAIL ${url} → unreachable`);
    }
  }

  return results;
}

export async function runPhase3(): Promise<Phase3Result> {
  const start = Date.now();

  console.log("  SPA deploy:");
  const { uploaded, skipped } = await deploySPA();
  console.log(`  SPA: ${uploaded} upload, ${skipped} skip (hash match)`);

  console.log("  Worker deploy:");
  const workersDeployed = deployWorkers();

  console.log("  Smoke tests:");
  smokeTest();

  return {
    spaUploaded: uploaded,
    spaSkipped: skipped,
    workersDeployed,
    durationMs: Date.now() - start,
  };
}
