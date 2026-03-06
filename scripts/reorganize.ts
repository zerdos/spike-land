#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import { Project } from "ts-morph";
import chokidar from "chokidar";

import { fallbackCategory, excludeGlobs, getDependencyGroupName, deduplicateDepGroup } from "./reorganize-config.js";
import type { MovePlan, FileNode } from "./reorganize/types.js";
import { readPackagesYaml } from "./reorganize/utils.js";
import { discoverFiles } from "./reorganize/discovery.js";
import { propagateDeps, computePackageCategories, resolveAppName } from "./reorganize/grouping.js";
import { flattenFilename } from "./reorganize/flatten.js";
import {
  rewriteImports,
  updateTsConfigPaths,
  updatePackagesConfigs,
  updatePackageJsonWorkspaces,
  generateManifests,
} from "./reorganize/execution.js";

export function computeMovePlans(
  nodes: FileNode[],
  packageCategories: Map<string, string>,
  MAX_BUCKET_SIZE: number = 20,
): MovePlan[] {
  // Pass 1: Initial grouping to count bucket sizes
  const bucketCounts = new Map<string, number>();
  for (const n of nodes) {
    const depGroupRaw = getDependencyGroupName(n.externalDeps); // Use direct deps
    const category = packageCategories.get(n.packageName) || fallbackCategory;
    const depGroupName = deduplicateDepGroup(depGroupRaw, category);
    const appName = resolveAppName(n.packageName);
    const bucket = path.join(category, appName, depGroupName);
    bucketCounts.set(bucket, (bucketCounts.get(bucket) || 0) + 1);
  }

  const plans: MovePlan[] = [];
  const targetCounts = new Map<string, number>();

  for (const n of nodes) {
    const depGroupRaw = getDependencyGroupName(n.externalDeps); // Use direct deps
    const category = packageCategories.get(n.packageName) || fallbackCategory;

    // Deduplicate: avoid cli/cli/cli stutter
    let depGroupName = deduplicateDepGroup(depGroupRaw, category);

    const appName = resolveAppName(n.packageName);
    let targetDir = path.join(category, appName, depGroupName);

    // Issue 3: Split oversized buckets
    if ((bucketCounts.get(targetDir) || 0) > MAX_BUCKET_SIZE) {
       const subDir = path.dirname(n.relPath).split(path.sep).slice(1).join(path.sep);
       if (subDir) {
          targetDir = path.join(targetDir, subDir);
       }
    }

    let fileName = flattenFilename(n.relPath, n.packageName);
    
    // Issue 3 (Co-locate tests): Put tests in __tests__ subfolder
    if (fileName.endsWith(".test.ts") || fileName.endsWith(".test.tsx")) {
       targetDir = path.join(targetDir, "__tests__");
    }

    const targetPathKey = path.join(targetDir, fileName);
    let disambigName = fileName;
    let count = targetCounts.get(targetPathKey) || 0;
    if (count > 0) {
      const ext = path.extname(fileName);
      const base = path.basename(fileName, ext);
      disambigName = `${base}-${n.packageName}${ext}`;
    }
    targetCounts.set(targetPathKey, count + 1);

    plans.push({
      fileNode: n,
      targetDir: targetDir,
      targetFileName: disambigName,
      targetRelPath: path.join(targetDir, disambigName),
    });
  }
  return plans;
}

async function runReorganization(values: any) {
  const MAX_BUCKET_SIZE = 20;
  const outputDir = path.resolve(process.cwd(), values.output as string);
  const srcDir = path.resolve(process.cwd(), "src");

  const packagesYaml = await readPackagesYaml();
  
  const project = new Project({
    tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
  });
  
  // Incremental mode: only changed files
  let filesToProcess: string[] = [];
  if (values.incremental) {
     try {
       const stdout = execSync("git diff --name-only HEAD", { encoding: "utf-8" });
       filesToProcess = stdout.split("\n")
         .filter(f => f.startsWith("src/") && (f.endsWith(".ts") || f.endsWith(".tsx")))
         .map(f => path.resolve(process.cwd(), f));
     } catch (e) {}
  }

  const allFiles = await glob("**/*.{ts,tsx}", {
    cwd: srcDir,
    ignore: excludeGlobs,
    absolute: true,
  });
  
  const files = filesToProcess.length > 0 ? filesToProcess : allFiles;
  project.addSourceFilesAtPaths(allFiles); 

  const nodes = await discoverFiles(project);
  propagateDeps(nodes);

  // Package-level category assignment
  const packageCategories = computePackageCategories(nodes, packagesYaml);

  const plans = computeMovePlans(nodes, packageCategories, MAX_BUCKET_SIZE);

  // Lint mode: check for category violations
  if (values.lint) {
     let violations = 0;
     for (const n of nodes) {
        const category = packageCategories.get(n.packageName);
        if (category === "core") {
           const hasFrontend = [...n.externalDeps].some(d => d === "react" || d === "react-dom");
           if (hasFrontend) {
              console.warn(`Lint violation: 'core' package '${n.packageName}' file '${n.relPath}' imports frontend dependencies.`);
              violations++;
           }
        }
     }
     if (violations > 0) {
        console.error(`Found ${violations} lint violations.`);
        process.exit(1);
     }
     console.log("Lint passed.");
     return;
  }

  console.log(`Discovered ${nodes.length} files. Grouping...`);

  // --diff mode: show old path → new path
  if (values.diff) {
    console.log("\n--- Diff: old path → new path ---\n");
    for (const p of plans) {
      console.log(`  ${p.fileNode.relPath}`);
      console.log(`    → ${p.targetRelPath}`);
    }
    console.log(`\nTotal: ${plans.length} files`);
    return;
  }

  if (!values.apply) {
    const stats = new Map<string, number>();
    for (const p of plans) {
      stats.set(p.targetDir, (stats.get(p.targetDir) || 0) + 1);
    }

    const catStats = new Map<string, number>();
    for (const p of plans) {
      const cat = p.targetDir.split(path.sep)[0];
      catStats.set(cat, (catStats.get(cat) || 0) + 1);
    }
    console.log(`\nCategory breakdown:`);
    for (const [cat, count] of [...catStats.entries()].sort((a, b) => b[1] - a[1])) {
      const pct = ((count / plans.length) * 100).toFixed(1);
      console.log(`  ${cat}: ${count} files (${pct}%)`);
    }

    console.log(`\nDry run summary (Top 15 dirs):`);
    const sorted = [...stats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
    for (const [dir, count] of sorted) {
      console.log(`  ${dir}: ${count} files`);
    }
    console.log(`\nRun with --apply to execute, --diff for path mapping.`);
    return;
  }

  console.log(`\nApplying changes to ${values.output}...`);
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  const pathMapping = new Map<string, string>();
  for (const p of plans) {
    const absNewPath = path.resolve(outputDir, p.targetRelPath);
    pathMapping.set(p.fileNode.absPath, absNewPath);
  }

  // Issue 10: Reversible mapping file
  const reversibleMapping: Record<string, string> = {};
  for (const [oldAbs, newAbs] of pathMapping.entries()) {
    reversibleMapping[path.relative(process.cwd(), oldAbs)] = path.relative(outputDir, newAbs);
  }
  await fs.writeFile(path.join(outputDir, ".mapping.json"), JSON.stringify(reversibleMapping, null, 2));

  for (const p of plans) {
    const absNewPath = path.resolve(outputDir, p.targetRelPath);
    await fs.mkdir(path.dirname(absNewPath), { recursive: true });
    
    const newContent = rewriteImports(project, p.fileNode.absPath, absNewPath, pathMapping);
    await fs.writeFile(absNewPath, newContent, "utf-8");
  }

  const dirSet = new Set<string>();
  for (const p of plans) {
    let d = path.dirname(p.targetRelPath);
    while (d !== "." && d !== "/") {
      dirSet.add(d);
      d = path.dirname(d);
    }
  }
  
  const BARREL_THRESHOLD = 3; 
  const sortedDirs = Array.from(dirSet).sort((a, b) => b.length - a.length);
  const barrelProject = new Project({ useInMemoryFileSystem: true });

  for (const d of sortedDirs) {
    if (d.includes("__tests__") || d.endsWith(".test") || path.basename(d) === "__tests__") continue;

    const base = path.basename(d);
    if (base === "lazy-imports" || base === "core-logic" || base === "node-sys") continue;

    const absD = path.resolve(outputDir, d);
    const entries = await fs.readdir(absD, { withFileTypes: true });

    const exportableCount = entries.filter(e => {
      if (e.name === "index.ts" || e.name === "index.tsx") return false;
      if (e.name.startsWith("_")) return false;
      if (e.name.endsWith(".test.ts") || e.name.endsWith(".test.tsx") || e.name.includes(".spec.")) return false;
      if (e.isDirectory()) return true;
      return e.name.endsWith(".ts") || e.name.endsWith(".tsx");
    }).length;

    if (exportableCount < BARREL_THRESHOLD) continue;

    let barrelContent = "";
    for (const entry of entries) {
      if (entry.name === "index.ts" || entry.name === "index.tsx") continue;
      if (entry.name.startsWith("_")) continue;
      if (entry.name === "utils.ts" || entry.name === "utils.tsx") continue;
      if (entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.tsx") || entry.name.includes(".spec.")) continue;
      
      const filePath = path.join(absD, entry.name);
      
      if (entry.isDirectory()) {
         const children = await fs.readdir(filePath).catch(() => []);
         if (children.some(f => f === "index.ts" || f === "index.tsx")) {
           barrelContent += `export * from "./${entry.name}";\n`;
         }
      } else {
         if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) continue;
         const fileContent = await fs.readFile(filePath, "utf-8");
         const sf = barrelProject.createSourceFile(filePath, fileContent, { overwrite: true });
         const exports = sf.getExportDeclarations();
         const exportedDecs = sf.getExportedDeclarations();
         if (exports.length > 0 || exportedDecs.size > 0) {
           const baseName = path.basename(entry.name, path.extname(entry.name));
           barrelContent += `export * from "./${baseName}";\n`;
         }
      }
    }
    if (barrelContent) {
       await fs.writeFile(path.join(absD, "index.ts"), barrelContent, "utf-8");
    }
  }

  await updateTsConfigPaths(pathMapping);
  await updatePackagesConfigs(pathMapping);
  await updatePackageJsonWorkspaces(outputDir);
  await generateManifests(plans, outputDir);

  if (values.verify) {
    console.log("\nVerifying...");
    try {
      execSync("npx tsc --noEmit", { stdio: "inherit" });
      execSync("npx eslint " + values.output, { stdio: "inherit" });
      execSync("npx vitest run " + values.output, { stdio: "inherit" });
      console.log("Verification passed!");
    } catch (e) {
      console.error("Verification failed:", e);
    }
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      apply: { type: "boolean" },
      verify: { type: "boolean" },
      diff: { type: "boolean" },
      watch: { type: "boolean" },
      lint: { type: "boolean" },
      incremental: { type: "boolean" },
      output: { type: "string", default: "src-reorganized" },
    },
  });

  if (values.apply) {
    try {
      execSync("git diff --quiet", { stdio: "ignore" });
    } catch {
      console.error("Git working directory not clean. Commit or stash before --apply");
      process.exit(1);
    }
  }

  await runReorganization(values);

  if (values.watch) {
    const srcDir = path.resolve(process.cwd(), "src");
    console.log(`Watching ${srcDir} for changes...`);
    chokidar.watch(srcDir, { persistent: true, ignoreInitial: true })
      .on("all", async (event, path) => {
         console.log(`Change detected: ${event} ${path}. Re-running...`);
         await runReorganization(values).catch(console.error);
      });
  }
}

main().catch(console.error);
