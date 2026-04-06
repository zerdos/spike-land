#!/usr/bin/env node

import { resolve } from "node:path";
import {
  runSelfImproveLoop,
  createDefaultSelfImproveTargets,
} from "../src/mcp-tools/pageindex/core-logic/self-improve-runner.js";

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function parseIterations(): number {
  const raw = getArg("--iterations");
  if (!raw) return 42;
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`--iterations must be a positive integer, received ${raw}`);
  }
  return value;
}

async function main(): Promise<void> {
  const iterations = parseIterations();
  const persistPath = resolve(getArg("--output") ?? `.pageindex-self-improve-${iterations}.json`);
  const reportPath = resolve(
    getArg("--report") ?? `.pageindex-self-improve-${iterations}.report.json`,
  );

  const report = await runSelfImproveLoop({
    iterations,
    targets: createDefaultSelfImproveTargets(),
    persistPath,
    reportPath,
  });

  const first = report.iterations[0];
  const last = report.iterations[report.iterations.length - 1];

  console.log(
    JSON.stringify(
      {
        loop: "pageindex-self-improve",
        iterations: report.iterationsCompleted,
        initial_score: report.initialScore,
        final_score: report.finalScore,
        score_gain: Math.round((report.finalScore - report.initialScore) * 1000) / 1000,
        first_iteration: {
          iteration: first.iteration,
          persona: first.persona,
          score: first.score,
          used_prior_context: first.usedPriorContext,
        },
        last_iteration: {
          iteration: last.iteration,
          persona: last.persona,
          score: last.score,
          used_prior_context: last.usedPriorContext,
        },
        stats: report.stats,
        persisted_to: persistPath,
        report_path: reportPath,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
