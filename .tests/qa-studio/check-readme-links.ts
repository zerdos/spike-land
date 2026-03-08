#!/usr/bin/env npx tsx
/**
 * QA Studio: README/CLAUDE.md Link Checker
 *
 * Scans all markdown files in the monorepo for broken links:
 * - Relative file links (./foo.md, ../bar.ts)
 * - Anchor links (#section)
 * - HTTP/HTTPS links (checked with HEAD requests)
 */

import { readFile, access } from "node:fs/promises";
import { resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

const FILES_TO_CHECK = [
  // Root
  "README.md",
  "CLAUDE.md",
  "AGENTS.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  // Docs
  "docs/README.md",
  "docs/api/README.md",
  "docs/archive/README.md",
  "docs/best-practices/README.md",
  "docs/migrations/README.md",
  // Private
  ".github-private/README.md",
  // Package CLAUDE.md files
  "src/cli/docker-dev/CLAUDE.md",
  "src/cli/spike-cli/CLAUDE.md",
  "src/core/browser-automation/CLAUDE.md",
  "src/core/chess/CLAUDE.md",
  "src/core/react-engine/CLAUDE.md",
  "src/core/server-base/CLAUDE.md",
  "src/core/shared-utils/CLAUDE.md",
  "src/core/statecharts/CLAUDE.md",
  "src/edge-api/auth/CLAUDE.md",
  "src/edge-api/backend/CLAUDE.md",
  "src/edge-api/main/CLAUDE.md",
  "src/edge-api/spike-land/CLAUDE.md",
  "src/edge-api/transpile/CLAUDE.md",
  "src/frontend/monaco-editor/CLAUDE.md",
  "src/frontend/platform-frontend/CLAUDE.md",
  "src/mcp-tools/bazdmeg/CLAUDE.md",
  "src/mcp-tools/code-review/CLAUDE.md",
  "src/mcp-tools/esbuild-wasm/CLAUDE.md",
  "src/mcp-tools/hackernews/CLAUDE.md",
  "src/mcp-tools/openclaw/CLAUDE.md",
  "src/media/educational-videos/CLAUDE.md",
  "src/monaco-editor/CLAUDE.md",
  "src/utilities/whatsapp/CLAUDE.md",
  // READMEs in packages
  "src/monaco-editor/README.md",
];

interface LinkResult {
  file: string;
  line: number;
  text: string;
  target: string;
  status: "ok" | "broken" | "skipped" | "warning";
  reason: string;
}

// Parse markdown links: [text](target)
function extractLinks(content: string): Array<{ text: string; target: string; line: number; inCodeBlock: boolean }> {
  const links: Array<{ text: string; target: string; line: number; inCodeBlock: boolean }> = [];
  const lines = content.split("\n");
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Match [text](url) but not ![image](url)
    const re = /(?<![!])\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = re.exec(line)) !== null) {
      links.push({
        text: match[1]!,
        target: match[2]!.split(" ")[0]!, // strip title
        line: i + 1,
        inCodeBlock,
      });
    }
  }
  return links;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// Dedup cache for HTTP checks
const httpCache = new Map<string, { ok: boolean; status: number }>();

async function checkHttpLink(url: string): Promise<{ ok: boolean; status: number }> {
  if (httpCache.has(url)) return httpCache.get(url)!;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "qa-studio-link-checker/1.0" },
      redirect: "follow",
    });
    clearTimeout(timeout);
    const result = { ok: res.ok, status: res.status };
    httpCache.set(url, result);
    return result;
  } catch (err) {
    // Retry with GET (some servers reject HEAD)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: { "User-Agent": "qa-studio-link-checker/1.0" },
        redirect: "follow",
      });
      clearTimeout(timeout);
      const result = { ok: res.ok, status: res.status };
      httpCache.set(url, result);
      return result;
    } catch {
      const result = { ok: false, status: 0 };
      httpCache.set(url, result);
      return result;
    }
  }
}

async function checkFile(relPath: string): Promise<LinkResult[]> {
  const absPath = resolve(ROOT, relPath);
  const dir = dirname(absPath);
  const results: LinkResult[] = [];

  let content: string;
  try {
    content = await readFile(absPath, "utf-8");
  } catch {
    results.push({
      file: relPath,
      line: 0,
      text: "",
      target: relPath,
      status: "broken",
      reason: "File itself does not exist",
    });
    return results;
  }

  const links = extractLinks(content);

  for (const link of links) {
    if (link.inCodeBlock) continue;

    const { target, text, line } = link;

    // Skip anchors-only, mailto, tel
    if (target.startsWith("#") || target.startsWith("mailto:") || target.startsWith("tel:")) {
      continue;
    }

    // HTTP/HTTPS links
    if (target.startsWith("http://") || target.startsWith("https://")) {
      const check = await checkHttpLink(target);
      results.push({
        file: relPath,
        line,
        text,
        target,
        status: check.ok ? "ok" : check.status === 0 ? "warning" : "broken",
        reason: check.ok ? "OK" : check.status === 0 ? `Timeout/unreachable` : `HTTP ${check.status}`,
      });
      continue;
    }

    // Relative file links
    const targetPath = target.split("#")[0]!; // strip anchor
    if (!targetPath) continue; // anchor-only after split

    const resolved = resolve(dir, targetPath);
    const exists = await fileExists(resolved);

    // If doesn't exist, check if it's a directory with index
    if (!exists) {
      const asDir = resolve(resolved, "index.md");
      const asDirHtml = resolve(resolved, "index.html");
      const withExt = extname(resolved) ? null : resolve(dir, targetPath + ".md");

      const dirExists = await fileExists(asDir) || await fileExists(asDirHtml);
      const extExists = withExt ? await fileExists(withExt) : false;

      if (dirExists || extExists) {
        results.push({
          file: relPath,
          line,
          text,
          target,
          status: "ok",
          reason: dirExists ? "Directory index exists" : "Found with .md extension",
        });
      } else {
        results.push({
          file: relPath,
          line,
          text,
          target,
          status: "broken",
          reason: `File not found: ${resolved.replace(ROOT + "/", "")}`,
        });
      }
    } else {
      results.push({
        file: relPath,
        line,
        text,
        target,
        status: "ok",
        reason: "OK",
      });
    }
  }

  return results;
}

// --- Main ---
async function main() {
  console.log("QA Studio Link Checker");
  console.log("=".repeat(60));
  console.log(`Checking ${FILES_TO_CHECK.length} markdown files...\n`);

  const allResults: LinkResult[] = [];
  let filesChecked = 0;
  let filesSkipped = 0;

  // Process files with concurrency limit of 5
  for (const file of FILES_TO_CHECK) {
    const results = await checkFile(file);
    allResults.push(...results);
    if (results.length === 1 && results[0]!.reason === "File itself does not exist") {
      filesSkipped++;
    } else {
      filesChecked++;
    }
  }

  // Separate results
  const broken = allResults.filter((r) => r.status === "broken");
  const warnings = allResults.filter((r) => r.status === "warning");
  const ok = allResults.filter((r) => r.status === "ok");

  // Report
  console.log(`\nFiles checked: ${filesChecked}, skipped (not found): ${filesSkipped}`);
  console.log(`Links: ${ok.length} OK, ${broken.length} broken, ${warnings.length} warnings\n`);

  if (broken.length > 0) {
    console.log("BROKEN LINKS");
    console.log("-".repeat(60));
    for (const r of broken) {
      if (r.line === 0) {
        console.log(`  ${r.file} — ${r.reason}`);
      } else {
        console.log(`  ${r.file}:${r.line} — [${r.text}](${r.target})`);
        console.log(`    Reason: ${r.reason}`);
      }
    }
  }

  if (warnings.length > 0) {
    console.log("\nWARNINGS (timeout/unreachable)");
    console.log("-".repeat(60));
    for (const r of warnings) {
      console.log(`  ${r.file}:${r.line} — [${r.text}](${r.target})`);
      console.log(`    Reason: ${r.reason}`);
    }
  }

  if (broken.length === 0 && warnings.length === 0) {
    console.log("All links OK!");
  }

  // Exit with error code if broken links found
  process.exit(broken.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(2);
});
