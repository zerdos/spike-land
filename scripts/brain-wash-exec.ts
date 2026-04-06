import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const workspaces = [
  "packages/image-studio-worker",
  "packages/mcp-auth",
  "packages/mcp-server-base",
  "packages/shared",
  "packages/spike-edge",
  "packages/spike-land-mcp",
  "packages/spike-web",
];

const ROOT_DIR = process.cwd();

async function run() {
  const unusedFilesSet = new Set<string>();

  for (const ws of workspaces) {
    try {
      console.log(`Running knip on ${ws}...`);
      execSync(`yarn dlx knip --directory ${ws} --reporter json`, {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      });
    } catch (error: any) {
      if (error.stdout) {
        try {
          const lines = error.stdout.split("\n");
          let jsonStr = "";
          for (const line of lines) {
            if (line.startsWith("{")) {
              jsonStr = line;
              break;
            }
          }

          if (jsonStr) {
            const data = JSON.parse(jsonStr);
            const issues = data.issues || [];
            for (const issue of issues) {
              if (issue.files && issue.files.length > 0) {
                for (const f of issue.files) {
                  const absPath = path.resolve(ROOT_DIR, ws, f.name);
                  unusedFilesSet.add(absPath);
                }
              }
            }
          }
        } catch (e) {
          console.error(`Error parsing JSON for ${ws}:`, e);
        }
      }
    }
  }

  // Filter out test files and dynamic files
  const toDelete = Array.from(unusedFilesSet).filter((file) => {
    if (file.includes(".test.")) return false;
    if (file.endsWith(".worker.ts")) return false;
    if (file.endsWith(".contribution.ts")) return false;
    if (file.endsWith("sentry.ts")) return false; // Known dynamic usage
    if (file.includes("monaco-editor")) return false; // Explicitly skip monaco editor
    return true;
  });

  if (toDelete.length > 0) {
    console.log(`\nFound ${toDelete.length} strictly unused files to delete:`);
    for (const f of toDelete) {
      console.log(path.relative(ROOT_DIR, f));
      await fs.rm(f, { force: true });
    }
    console.log("Deletion complete.");
  } else {
    console.log("No strictly unused files found.");
  }
}

run().catch(console.error);
