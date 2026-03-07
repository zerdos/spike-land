import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT_DIR = path.resolve(__dirname, "..");
const CACHE_DIR = path.join(ROOT_DIR, ".deploy-cache");
const CACHE_FILE = path.join(CACHE_DIR, "mcp.hash");

function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

function main() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  console.log("Building spike-land-mcp...");
  execSync("yarn tsx esbuild.config.ts spike-land-mcp", { stdio: "inherit", cwd: ROOT_DIR });

  const buildOutput = path.join(ROOT_DIR, "dist/spike-land-mcp/index.js");
  if (!fs.existsSync(buildOutput)) {
    console.error(`Build output not found at ${buildOutput}`);
    process.exit(1);
  }

  const newHash = hashFile(buildOutput);
  console.log(`Generated bundle hash: ${newHash}`);

  let oldHash = "";
  if (fs.existsSync(CACHE_FILE)) {
    oldHash = fs.readFileSync(CACHE_FILE, "utf-8").trim();
  }

  if (newHash === oldHash && process.env.FORCE_DEPLOY !== "1") {
    console.log("Hash matches previously deployed version. Skipping upload.");
    return;
  }

  console.log("Hash changed (or no cache found). Uploading to Cloudflare...");
  try {
    // Pass the pre-bundled file and use --no-bundle
    execSync(
      `npx wrangler deploy ../../dist/spike-land-mcp/index.js --name spike-land-mcp -c wrangler.toml --no-bundle`,
      { stdio: "inherit", cwd: path.join(ROOT_DIR, "packages/spike-land-mcp") },
    );

    // Save hash on success
    fs.writeFileSync(CACHE_FILE, newHash);
    console.log("Deployment successful!");
  } catch (error) {
    console.error("Deployment failed.");
    process.exit(1);
  }
}

main();
