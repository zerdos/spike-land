import path from "node:path";
import type { MovePlan, LintResult } from "./types.js";

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

// ── Lint reporting ───────────────────────────────────────────────────────────

export function reportLint(result: LintResult, json: boolean): void {
  if (json) {
    const output = {
      passed: result.passed,
      stats: result.stats,
      violations: result.violations.map((v) => ({
        rule: v.rule,
        severity: v.severity,
        package: v.package,
        file: v.file,
        message: v.message,
      })),
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // Human-readable output
  const { stats, violations, passed } = result;

  if (violations.length === 0) {
    console.log(
      `Lint passed. ${stats.files} files, ${stats.packages} packages, ${stats.rules} rules. (${stats.duration}ms)`,
    );
    return;
  }

  // Group by rule
  const byRule = new Map<string, typeof violations>();
  for (const v of violations) {
    if (!byRule.has(v.rule)) byRule.set(v.rule, []);
    byRule.get(v.rule)!.push(v);
  }

  console.log("");
  for (const [rule, vs] of byRule) {
    const icon = vs[0].severity === "error" ? "✗" : "⚠";
    console.log(`${icon} ${rule} (${vs.length})`);
    // Show up to 5 per rule, then summary
    const show = vs.slice(0, 5);
    for (const v of show) {
      console.log(`    ${v.package}: ${v.message}`);
      console.log(`    ${v.file}`);
    }
    if (vs.length > 5) {
      console.log(`    ... and ${vs.length - 5} more`);
    }
    console.log("");
  }

  const summary = passed
    ? `Lint passed with ${stats.warnings} warning(s).`
    : `Lint FAILED: ${stats.errors} error(s), ${stats.warnings} warning(s).`;
  console.log(`${summary} (${stats.files} files, ${stats.packages} packages, ${stats.duration}ms)`);
}
