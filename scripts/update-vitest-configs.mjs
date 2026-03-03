#!/usr/bin/env node
/**
 * Update vitest configs to point test includes and setupFiles to .tests/ directory.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src");
const TESTS = path.join(ROOT, ".tests");

// Map of package → vitest config updates needed
const configs = {};

// Scan .tests/ to determine which packages have test files
const testPkgs = fs.readdirSync(TESTS).filter((d) => {
  return fs.statSync(path.join(TESTS, d)).isDirectory();
});

for (const pkg of testPkgs) {
  const configPath = path.join(SRC, pkg, "vitest.config.ts");
  if (!fs.existsSync(configPath)) {
    console.log(`SKIP ${pkg}: no vitest.config.ts`);
    continue;
  }

  let content = fs.readFileSync(configPath, "utf-8");
  const original = content;

  // Check if setup files were moved
  const setupFiles = ["test-setup.ts", "setupTests.ts", "vitest.setup.ts"];
  for (const sf of setupFiles) {
    if (fs.existsSync(path.join(TESTS, pkg, sf))) {
      // Rewrite setupFiles path
      const oldRef = `./${sf}`;
      const newRef = `../../.tests/${pkg}/${sf}`;
      content = content.replace(
        new RegExp(`["']\\.\\/` + sf.replace(".", "\\.") + `["']`, "g"),
        `"${newRef}"`,
      );
    }
  }

  // Rewrite include patterns to point to .tests/
  // Handle various patterns:
  // - ["**/*.test.ts"] → ["../../.tests/{pkg}/**/*.test.ts"]
  // - ["**/*.{test,spec}.{ts,tsx}"] → ["../../.tests/{pkg}/**/*.{test,spec}.{ts,tsx}"]
  // - ["src/**/*.test.ts"] → ["../../.tests/{pkg}/**/*.test.ts"]
  // - ["__tests__/**/*.{test,spec}.ts", "src/**/*.{test,spec}.ts"]
  // - ["tests/**/*.test.ts"] (react-ts-worker)
  // - ["*.test.ts", "**/*.test.ts"] (image-studio-worker)

  // Find the include array and replace it
  const includeMatch = content.match(/include:\s*\[([\s\S]*?)\]/);
  if (includeMatch) {
    const includeStr = includeMatch[0];
    // Check if this is in the test block (not coverage)
    // Find position of include in content
    const includeIdx = content.indexOf(includeStr);

    // Find the test: { block it belongs to
    const testBlockStart = content.lastIndexOf("test:", includeIdx);
    const coverageBlockStart = content.lastIndexOf("coverage:", includeIdx);

    // Only replace if this include is directly under test: (not under coverage:)
    // Simple heuristic: if coverage: appears after test: and before include, skip
    if (coverageBlockStart === -1 || coverageBlockStart < testBlockStart) {
      // This is the test include
      // Determine appropriate glob pattern based on what exists
      const hasSpec = fs.readdirSync(path.join(TESTS, pkg), { recursive: true })
        .some((f) => typeof f === "string" && f.match(/\.spec\.(ts|tsx)$/));
      const hasTsx = fs.readdirSync(path.join(TESTS, pkg), { recursive: true })
        .some((f) => typeof f === "string" && f.match(/\.(test|spec)\.tsx$/));

      let pattern;
      if (hasSpec && hasTsx) {
        pattern = `"../../.tests/${pkg}/**/*.{test,spec}.{ts,tsx}"`;
      } else if (hasSpec) {
        pattern = `"../../.tests/${pkg}/**/*.{test,spec}.ts"`;
      } else if (hasTsx) {
        pattern = `"../../.tests/${pkg}/**/*.{test,spec}.{ts,tsx}"`;
      } else {
        pattern = `"../../.tests/${pkg}/**/*.test.ts"`;
      }

      content = content.replace(includeStr, `include: [${pattern}]`);
    }
  }

  // For configs that DON'T have an explicit include in test block, we need to add one
  // since the base config's include won't find files in .tests/
  if (!content.includes("include:") || (content.match(/include:/g) || []).length === 0) {
    // Need to add include to test block
    const testMatch = content.match(/test:\s*\{/);
    if (testMatch) {
      const insertPos = content.indexOf(testMatch[0]) + testMatch[0].length;
      content =
        content.slice(0, insertPos) +
        `\n    include: ["../../.tests/${pkg}/**/*.test.ts"],` +
        content.slice(insertPos);
    }
  }

  // If include only exists in coverage block, add a test include
  if (content.includes("include:")) {
    // Check: is there an include between "test:" and "coverage:" ?
    const testIdx = content.indexOf("test:");
    const coverageIdx = content.indexOf("coverage:");
    if (testIdx >= 0 && coverageIdx >= 0) {
      const testSection = content.slice(testIdx, coverageIdx);
      if (!testSection.includes("include:")) {
        // Add include right after test: {
        const testObjMatch = content.match(/test:\s*\{/);
        if (testObjMatch) {
          const insertPos = content.indexOf(testObjMatch[0]) + testObjMatch[0].length;
          const hasSpec = fs.readdirSync(path.join(TESTS, pkg), { recursive: true })
            .some((f) => typeof f === "string" && f.match(/\.spec\.(ts|tsx)$/));
          const pat = hasSpec
            ? `"../../.tests/${pkg}/**/*.{test,spec}.ts"`
            : `"../../.tests/${pkg}/**/*.test.ts"`;
          content =
            content.slice(0, insertPos) +
            `\n    include: [${pat}],` +
            content.slice(insertPos);
        }
      }
    }
  }

  if (content !== original) {
    fs.writeFileSync(configPath, content);
    console.log(`Updated: ${pkg}/vitest.config.ts`);
  } else {
    console.log(`No changes: ${pkg}/vitest.config.ts`);
  }
}

// Update vitest.base.ts
const basePath = path.join(ROOT, "vitest.base.ts");
let baseContent = fs.readFileSync(basePath, "utf-8");
// Change include from source-relative to .tests-relative
baseContent = baseContent.replace(
  /include:\s*\["src\/\*\*\/\*\.test\.ts",\s*"\*\*\/\*\.test\.ts"\]/,
  'include: ["../../.tests/**/*.{test,spec}.{ts,tsx}"]',
);
// Update coverage exclude
baseContent = baseContent.replace(
  /exclude:\s*\["src\/\*\*\/\*\.test\.ts",\s*"\*\*\/\*\.test\.ts",\s*"vitest\.config\.ts"\]/,
  'exclude: ["../../.tests/**", "vitest.config.ts"]',
);
fs.writeFileSync(basePath, baseContent);
console.log("\nUpdated vitest.base.ts");

console.log("\nDone!");
