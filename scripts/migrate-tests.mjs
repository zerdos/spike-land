#!/usr/bin/env node
/**
 * Migrate all test files from src/ to .tests/ directory.
 *
 * - Moves *.test.ts, *.test.tsx, *.spec.ts, *.spec.tsx
 * - Moves __tests__/ directories
 * - Moves __test-utils__/ directories
 * - Moves test setup files (test-setup.ts, setupTests.ts, vitest.setup.ts)
 * - Rewrites relative imports to point back to source in src/
 * - Keeps __mocks__/ in src/ (referenced by vitest alias configs)
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src");
const TESTS_ROOT = path.join(ROOT, ".tests");

// Packages to process
const packages = fs.readdirSync(SRC).filter((d) => {
  const p = path.join(SRC, d);
  return fs.statSync(p).isDirectory() && !d.startsWith(".") && d !== "node_modules";
});

console.log(`Found ${packages.length} packages: ${packages.join(", ")}`);

// Collect all files to move
const filesToMove = []; // { src: absolute, dest: absolute, pkg, relPath }

function collectTestFiles(dir, pkg, relDir = "") {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".wrangler") continue;

    const srcPath = path.join(dir, entry.name);
    const rel = relDir ? `${relDir}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      // __mocks__ stays in src/
      if (entry.name === "__mocks__") continue;

      // __test-utils__ and __tests__ get moved entirely
      if (entry.name === "__test-utils__" || entry.name === "__tests__" || entry.name === "tests") {
        collectAllInDir(srcPath, pkg, rel);
      } else {
        collectTestFiles(srcPath, pkg, rel);
      }
    } else if (entry.isFile()) {
      const isTest = /\.(test|spec)\.(ts|tsx)$/.test(entry.name);
      const isSetup =
        entry.name === "test-setup.ts" ||
        entry.name === "setupTests.ts" ||
        entry.name === "vitest.setup.ts";

      if (isTest || isSetup) {
        const destPath = path.join(TESTS_ROOT, pkg, rel);
        filesToMove.push({ src: srcPath, dest: destPath, pkg, relPath: rel });
      }
    }
  }
}

function collectAllInDir(dir, pkg, relDir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "node_modules") continue;
    const srcPath = path.join(dir, entry.name);
    const rel = `${relDir}/${entry.name}`;

    if (entry.isDirectory()) {
      collectAllInDir(srcPath, pkg, rel);
    } else if (entry.isFile()) {
      const destPath = path.join(TESTS_ROOT, pkg, rel);
      filesToMove.push({ src: srcPath, dest: destPath, pkg, relPath: rel });
    }
  }
}

for (const pkg of packages) {
  collectTestFiles(path.join(SRC, pkg), pkg);
}

console.log(`\nCollected ${filesToMove.length} files to move\n`);

// Group by package for summary
const byPkg = {};
for (const f of filesToMove) {
  byPkg[f.pkg] = (byPkg[f.pkg] || 0) + 1;
}
for (const [pkg, count] of Object.entries(byPkg).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${pkg}: ${count} files`);
}

// Build set of files being moved (for detecting test-to-test imports)
const movedSourcePaths = new Set(filesToMove.map((f) => f.src));

// Regex to match relative imports/requires
// Matches: from "./foo", from "../bar", import("./baz"), require("../qux")
const IMPORT_RE = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)["'](\.[^"']+)["']/g;

function rewriteImports(content, file) {
  const { src: originalPath, pkg } = file;
  const newPath = file.dest;
  const originalDir = path.dirname(originalPath);
  const newDir = path.dirname(newPath);
  const pkgSrcDir = path.join(SRC, pkg);

  return content.replace(IMPORT_RE, (match, importPath) => {
    // Resolve the import relative to original location
    const resolvedAbs = path.resolve(originalDir, importPath);

    // Check if target was also moved
    // Try common extensions
    const extensions = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js"];
    let targetMoved = false;
    let resolvedWithExt = resolvedAbs;

    for (const ext of extensions) {
      const candidate = resolvedAbs + ext;
      if (movedSourcePaths.has(candidate)) {
        targetMoved = true;
        resolvedWithExt = candidate;
        break;
      }
    }

    if (targetMoved) {
      // Both source and target moved — compute relative path within .tests/
      const targetInTests = path.join(
        TESTS_ROOT,
        pkg,
        path.relative(pkgSrcDir, resolvedWithExt),
      );
      // Strip the extension we added for lookup
      const targetBase = targetInTests.replace(/\.(ts|tsx|js|jsx)$/, "").replace(/\/index$/, "");
      let newImport = path.relative(newDir, targetBase);
      if (!newImport.startsWith(".")) newImport = "./" + newImport;
      return match.replace(importPath, newImport);
    }

    // Target stays in src/ — compute relative path from new location to original source
    let newImport = path.relative(newDir, resolvedAbs);
    if (!newImport.startsWith(".")) newImport = "./" + newImport;
    return match.replace(importPath, newImport);
  });
}

// Execute moves
let moved = 0;
let rewritten = 0;

for (const file of filesToMove) {
  // Create destination directory
  fs.mkdirSync(path.dirname(file.dest), { recursive: true });

  // Read content
  let content = fs.readFileSync(file.src, "utf-8");

  // Rewrite relative imports for .ts/.tsx files
  if (/\.(ts|tsx)$/.test(file.src)) {
    const original = content;
    content = rewriteImports(content, file);
    if (content !== original) rewritten++;
  }

  // Write to new location
  fs.writeFileSync(file.dest, content);

  // Remove original
  fs.unlinkSync(file.src);
  moved++;
}

console.log(`\nMoved ${moved} files, rewrote imports in ${rewritten} files`);

// Clean up empty directories
function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      removeEmptyDirs(full);
    }
  }
  // Re-read after recursive cleanup
  if (fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
    console.log(`  Removed empty dir: ${path.relative(ROOT, dir)}`);
  }
}

for (const pkg of packages) {
  removeEmptyDirs(path.join(SRC, pkg, "__tests__"));
  removeEmptyDirs(path.join(SRC, pkg, "__test-utils__"));
  removeEmptyDirs(path.join(SRC, pkg, "tests"));
}

// Verify no test files remain in src/
console.log("\nVerifying no test files remain in src/...");
const remaining = execSync(
  `find "${SRC}" -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" | grep -v node_modules | grep -v .wrangler || true`,
  { encoding: "utf-8" },
).trim();

if (remaining) {
  console.log("WARNING: Test files still in src/:");
  console.log(remaining);
} else {
  console.log("All test files successfully moved to .tests/");
}

// Also check for setup files
const remainingSetup = execSync(
  `find "${SRC}" \\( -name "test-setup.ts" -o -name "setupTests.ts" -o -name "vitest.setup.ts" \\) | grep -v node_modules || true`,
  { encoding: "utf-8" },
).trim();

if (remainingSetup) {
  console.log("\nWARNING: Setup files still in src/:");
  console.log(remainingSetup);
}

console.log("\nDone! Now update vitest configs to point to .tests/");
