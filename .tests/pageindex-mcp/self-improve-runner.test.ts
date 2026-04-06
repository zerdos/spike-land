import { describe, expect, it } from "vitest";
import { InsightStore } from "../../src/mcp-tools/pageindex/core-logic/self-improve.js";
import {
  computeLoopScore,
  runSelfImproveLoop,
} from "../../src/mcp-tools/pageindex/core-logic/self-improve-runner.js";

describe("runSelfImproveLoop", () => {
  it("improves the loop score monotonically", async () => {
    const report = await runSelfImproveLoop({ iterations: 12 });

    expect(report.iterationsCompleted).toBe(12);
    expect(report.finalScore).toBeGreaterThan(report.initialScore);
    expect(report.stats.total).toBeGreaterThan(0);

    for (let index = 1; index < report.iterations.length; index++) {
      expect(report.iterations[index].score).toBeGreaterThan(report.iterations[index - 1].score);
    }
  });

  it("matches the reported final score to the provided store state", async () => {
    const store = new InsightStore();
    const report = await runSelfImproveLoop({ iterations: 6, store });

    expect(computeLoopScore(store)).toBe(report.finalScore);
    expect(store.getAll()).toHaveLength(6);
  });
});
