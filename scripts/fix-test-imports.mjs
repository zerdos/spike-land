#!/usr/bin/env node
/**
 * Fix broken imports in .tests/ after migration.
 * Finds imports pointing to src/ where the target was actually moved to .tests/
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TESTS_ROOT = path.join(ROOT, ".tests");

const IMPORT_RE = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)["'](\.[^"']+)["']/g;

// Extensions to try when resolving
const RESOLVE_EXTS = [".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js"];

function resolveFile(basePath) {
  // Try exact path
  if (fs.existsSync(basePath)) return basePath;
  // Try extensions
  for (const ext of RESOLVE_EXTS) {
    if (fs.existsSync(basePath + ext)) return basePath + ext;
  }
  // Try stripping .js/.jsx and replacing with .ts/.tsx
  if (basePath.endsWith(".js")) {
    const stripped = basePath.slice(0, -3);
    if (fs.existsSync(stripped + ".ts")) return stripped + ".ts";
    if (fs.existsSync(stripped + ".tsx")) return stripped + ".tsx";
    if (fs.existsSync(stripped)) return stripped; // directory
  }
  if (basePath.endsWith(".jsx")) {
    const stripped = basePath.slice(0, -4);
    if (fs.existsSync(stripped + ".tsx")) return stripped + ".tsx";
  }
  return null;
}

function processFile(filePath) {
  if (!/\.(ts|tsx)$/.test(filePath)) return;

  let content = fs.readFileSync(filePath, "utf-8");
  const fileDir = path.dirname(filePath);
  let changed = false;

  content = content.replace(IMPORT_RE, (match, importPath) => {
    const resolved = path.resolve(fileDir, importPath);

    // Check if the import target exists
    if (resolveFile(resolved)) return match; // Target exists, no fix needed

    // Target doesn't exist — it was probably moved to .tests/
    // Try to find it in .tests/ by converting src/ path to .tests/ path
    // The broken pattern: ../../src/{pkg}/... should be ../{relative-within-pkg}
    const relToRoot = path.relative(ROOT, resolved);
    if (relToRoot.startsWith("src/")) {
      const withinSrc = relToRoot.slice(4); // e.g., "mcp-image-studio/__test-utils__/mock-deps.js"
      const testsPath = path.join(TESTS_ROOT, withinSrc);
      const resolvedInTests = resolveFile(testsPath);

      if (resolvedInTests) {
        // Compute new relative import from current file to the .tests location
        // Strip extension from the resolved path if the original import had .js
        let targetForImport = resolvedInTests;
        // If original import had .js extension, keep .js in the new import
        if (importPath.endsWith(".js")) {
          targetForImport = resolvedInTests.replace(/\.ts$/, ".js").replace(/\.tsx$/, ".jsx");
        } else {
          // Strip extension
          targetForImport = resolvedInTests.replace(/\.(ts|tsx|js|jsx)$/, "");
        }

        let newImport = path.relative(fileDir, targetForImport);
        if (!newImport.startsWith(".")) newImport = "./" + newImport;
        changed = true;
        return match.replace(importPath, newImport);
      }
    }

    // Still broken — log it
    console.log(`  UNRESOLVED: ${path.relative(ROOT, filePath)} → ${importPath}`);
    return match;
  });

  if (changed) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

function walkDir(dir) {
  let fixed = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fixed += walkDir(full);
    } else if (entry.isFile()) {
      if (processFile(full)) fixed++;
    }
  }
  return fixed;
}

console.log("Scanning .tests/ for broken imports...\n");
const fixed = walkDir(TESTS_ROOT);
console.log(`\nFixed ${fixed} files`);
