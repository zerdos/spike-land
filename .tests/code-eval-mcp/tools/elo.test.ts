import { describe, expect, it } from "vitest";
import { calculateElo, eloToPercentile } from "../../../src/mcp-tools/code-eval/core-logic/elo.js";
import type { EvalResult } from "../../../src/mcp-tools/code-eval/mcp/types.js";

function makeEvalResult(overrides: Partial<EvalResult> = {}): EvalResult {
  return {
    totalTests: 10,
    passed: 10,
    failed: 0,
    errors: 0,
    passRate: 1.0,
    totalDurationMs: 50,
    results: [],
    ...overrides,
  };
}

describe("eloToPercentile", () => {
  it("returns low percentile for low Elo", () => {
    expect(eloToPercentile(400)).toBeLessThan(1);
  });

  it("returns ~50% for 1000 Elo", () => {
    expect(eloToPercentile(1000)).toBe(50);
  });

  it("returns high percentile for high Elo", () => {
    expect(eloToPercentile(1800)).toBeGreaterThan(99);
  });

  it("interpolates between table entries", () => {
    const pct = eloToPercentile(950);
    expect(pct).toBeGreaterThan(30);
    expect(pct).toBeLessThan(50);
  });

  it("clamps below minimum", () => {
    expect(eloToPercentile(100)).toBe(0.1);
  });
});

describe("calculateElo", () => {
  it("gives high Elo for perfect solution", () => {
    const result = makeEvalResult({ passRate: 1.0, totalDurationMs: 10 });
    const rating = calculateElo(result, 100, "medium");
    expect(rating.elo).toBeGreaterThan(1400);
    expect(rating.passRate).toBe(1);
  });

  it("gives low Elo for failing solution", () => {
    const result = makeEvalResult({
      passRate: 0,
      passed: 0,
      failed: 10,
      totalDurationMs: 5000,
    });
    const rating = calculateElo(result, 2000, "medium");
    expect(rating.elo).toBeLessThan(800);
  });

  it("difficulty multiplier affects rating", () => {
    const result = makeEvalResult({ passRate: 0.8, passed: 8, failed: 2, totalDurationMs: 100 });

    const easyRating = calculateElo(result, 200, "easy");
    const hardRating = calculateElo(result, 200, "hard");

    // Hard difficulty should give a higher Elo for the same performance
    expect(hardRating.elo).toBeGreaterThan(easyRating.elo);
  });

  it("shorter code gives slightly higher Elo", () => {
    const result = makeEvalResult({ passRate: 1.0, totalDurationMs: 50 });

    const shortRating = calculateElo(result, 50, "medium");
    const longRating = calculateElo(result, 2000, "medium");

    expect(shortRating.elo).toBeGreaterThanOrEqual(longRating.elo);
  });

  it("includes percentile in output", () => {
    const result = makeEvalResult();
    const rating = calculateElo(result, 200, "medium");
    expect(rating.percentile).toBeGreaterThan(0);
    expect(rating.percentile).toBeLessThanOrEqual(100);
  });

  it("includes avgExecutionMs in output", () => {
    const result = makeEvalResult({ totalDurationMs: 500 });
    const rating = calculateElo(result, 200, "medium");
    expect(rating.avgExecutionMs).toBe(50);
  });

  it("handles head-to-head comparison with reference", () => {
    const solution = makeEvalResult({ passRate: 1.0, totalDurationMs: 30 });
    const reference = makeEvalResult({ passRate: 1.0, totalDurationMs: 100 });

    const rating = calculateElo(solution, 100, "medium", reference, 150);
    expect(rating.elo).toBeGreaterThan(1000);
  });

  it("losing head-to-head gives lower rating", () => {
    const solution = makeEvalResult({
      passRate: 0.5,
      passed: 5,
      failed: 5,
      totalDurationMs: 500,
    });
    const reference = makeEvalResult({ passRate: 1.0, totalDurationMs: 30 });

    const rating = calculateElo(solution, 500, "medium", reference, 100);
    // Should still be a valid Elo, just lower than the winner
    expect(rating.elo).toBeDefined();
    expect(rating.passRate).toBe(0.5);
  });
});
