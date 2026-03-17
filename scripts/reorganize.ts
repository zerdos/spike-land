#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import { Project } from "ts-morph";
import chokidar from "chokidar";

import { excludeGlobs } from "./reorganize-config.js";
import { readPackagesYaml } from "./reorganize/utils.js";
import { discoverFiles } from "./reorganize/discovery.js";
import { propagateDeps, computePackageCategories } from "./reorganize/grouping.js";
import { computeMovePlans } from "./reorganize/planning.js";
import { runLint, listRules } from "./reorganize/linting.js";
import { reportDryRun, reportDiff, reportLint } from "./reorganize/reporting.js";
import {
  rewriteImports,
  updateTsConfigPaths,
  updatePackagesConfigs,
  updatePackageJsonWorkspaces,
  generateManifests,
  generateBarrels,
  copyAssets,
} from "./reorganize/execution.js";
import type { CliOptions } from "./reorganize/types.js";

async function runReorganization(opts: CliOptions) {
  const MAX_BUCKET_SIZE = 20;
  const outputDir = path.resolve(process.cwd(), opts.output);
  const srcDir = path.resolve(process.cwd(), opts.src);

  const packagesYaml = await readPackagesYaml();

  const project = new Project({
    tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
  });

  // Incremental mode: identify changed files (used to filter lint scope)
  let changedFiles: Set<string> | null = null;
  if (opts.incremental) {
    try {
      const stdout = execSync("git diff --name-only HEAD --cached", { encoding: "utf-8" });
      const srcRel = opts.src;
      changedFiles = new Set(
        stdout
          .split("\n")
          .filter((f) => f.startsWith(srcRel + "/") && (f.endsWith(".ts") || f.endsWith(".tsx")))
          .map((f) => path.resolve(process.cwd(), f)),
      );
      if (changedFiles.size === 0) {
        // Also check unstaged changes
        const unstaged = execSync("git diff --name-only HEAD", { encoding: "utf-8" });
        for (const f of unstaged.split("\n")) {
          if (f.startsWith(srcRel + "/") && (f.endsWith(".ts") || f.endsWith(".tsx"))) {
            changedFiles.add(path.resolve(process.cwd(), f));
          }
        }
      }
    } catch {
      changedFiles = null; // fallback to full scan
    }
  }

  const allFiles = await glob("**/*.{ts,tsx}", {
    cwd: srcDir,
    ignore: excludeGlobs,
    absolute: true,
  });

  project.addSourceFilesAtPaths(allFiles);

  const { nodes, aliasMap, categoryDirs } = await discoverFiles(project, srcDir);
  propagateDeps(nodes);

  const packageCategories = computePackageCategories(nodes, packagesYaml);

  // ── Lint mode ────────────────────────────────────────────────────────────
  if (opts.lint) {
    // In incremental mode, only lint files that changed (but still need full graph for context)
    const lintNodes =
      opts.incremental && changedFiles && changedFiles.size > 0
        ? nodes.filter((n) => changedFiles!.has(n.absPath))
        : nodes;

    const result = runLint({
      nodes: lintNodes,
      packageCategories,
      categoryDirs,
    });

    reportLint(result, opts.json);

    if (!result.passed) {
      process.exit(1);
    }
    return;
  }

  // ── Migration mode ───────────────────────────────────────────────────────
  const plans = computeMovePlans(nodes, packageCategories, MAX_BUCKET_SIZE, categoryDirs);

  console.log(`Discovered ${nodes.length} files. Grouping...`);

  if (opts.diff) {
    reportDiff(plans);
    return;
  }

  if (!opts.apply) {
    reportDryRun(plans);
    return;
  }

  console.log(`\nApplying changes to ${opts.output}...`);
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  const pathMapping = new Map<string, string>();
  for (const p of plans) {
    const absNewPath = path.resolve(outputDir, p.targetRelPath);
    pathMapping.set(p.fileNode.absPath, absNewPath);
  }

  // Reversible mapping file
  const reversibleMapping: Record<string, string> = {};
  for (const [oldAbs, newAbs] of pathMapping.entries()) {
    reversibleMapping[path.relative(process.cwd(), oldAbs)] = path.relative(outputDir, newAbs);
  }
  await fs.writeFile(
    path.join(outputDir, ".mapping.json"),
    JSON.stringify(reversibleMapping, null, 2),
  );

  for (const p of plans) {
    const absNewPath = path.resolve(outputDir, p.targetRelPath);
    await fs.mkdir(path.dirname(absNewPath), { recursive: true });

    const newContent = rewriteImports(
      project,
      p.fileNode.absPath,
      absNewPath,
      pathMapping,
      aliasMap,
      p.fileNode.packageName,
    );
    await fs.writeFile(absNewPath, newContent, "utf-8");
  }

  await copyAssets(srcDir, outputDir, pathMapping);
  await generateBarrels(outputDir, plans);
  await updateTsConfigPaths(pathMapping, srcDir);
  await updatePackagesConfigs(pathMapping, srcDir);
  await updatePackageJsonWorkspaces(outputDir);
  await generateManifests(plans, outputDir);

  if (opts.verify) {
    console.log("\nVerifying...");
    try {
      execSync("npx tsc --noEmit", { stdio: "inherit" });
      execSync("npx eslint " + opts.output, { stdio: "inherit" });
      execSync("npx vitest run " + opts.output, { stdio: "inherit" });
      console.log("Verification passed!");
    } catch (e) {
      console.error("Verification failed:", e);
    }
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      apply: { type: "boolean", default: false },
      verify: { type: "boolean", default: false },
      diff: { type: "boolean", default: false },
      watch: { type: "boolean", default: false },
      lint: { type: "boolean", default: false },
      incremental: { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      rules: { type: "boolean", default: false },
      src: { type: "string", default: "src" },
      output: { type: "string", default: "src-reorganized" },
    },
  });

  // --rules: list available lint rules and exit
  if (values.rules) {
    const rules = listRules();
    console.log("\nAvailable lint rules:\n");
    for (const r of rules) {
      console.log(`  ${r.name}`);
      console.log(`    ${r.description}\n`);
    }
    return;
  }

  const opts: CliOptions = {
    apply: values.apply ?? false,
    verify: values.verify ?? false,
    diff: values.diff ?? false,
    watch: values.watch ?? false,
    lint: values.lint ?? false,
    incremental: values.incremental ?? false,
    json: values.json ?? false,
    src: values.src ?? "src",
    output: values.output ?? "src-reorganized",
  };

  await runReorganization(opts);

  if (opts.watch) {
    const watchDir = path.resolve(process.cwd(), opts.src);
    console.log(`Watching ${watchDir} for changes...`);
    chokidar
      .watch(watchDir, { persistent: true, ignoreInitial: true })
      .on("all", async (event, filePath) => {
        console.log(`Change detected: ${event} ${filePath}. Re-running...`);
        await runReorganization(opts).catch(console.error);
      });
  }
}

main().catch(console.error);
