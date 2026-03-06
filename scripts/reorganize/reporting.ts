import path from "node:path";
import type { MovePlan } from "./types.js";

export function reportDryRun(plans: MovePlan[]) {
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
}

export function reportDiff(plans: MovePlan[]) {
  console.log("\n--- Diff: old path → new path ---\n");
  for (const p of plans) {
    console.log(`  ${p.fileNode.relPath}`);
    console.log(`    → ${p.targetRelPath}`);
  }
  console.log(`\nTotal: ${plans.length} files`);
}
