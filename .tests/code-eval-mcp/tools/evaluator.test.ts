import { describe, expect, it } from "vitest";
import {
  evaluateCode,
  runSingleTest,
} from "../../../src/mcp-tools/code-eval/core-logic/evaluator.js";
import {
  ADD_TESTS,
  BUGGY_ADD_CODE,
  SIMPLE_ADD_CODE,
  THROWING_CODE,
} from "../__test-utils__/index.js";

describe("runSingleTest", () => {
  it("passes for correct code", async () => {
    const result = await runSingleTest(
      SIMPLE_ADD_CODE,
      ADD_TESTS[0] as (typeof ADD_TESTS)[number],
      5000,
    );
    expect(result.passed).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.actual).toBe("5");
  });

  it("fails for incorrect code", async () => {
    const result = await runSingleTest(
      BUGGY_ADD_CODE,
      ADD_TESTS[0] as (typeof ADD_TESTS)[number],
      5000,
    );
    expect(result.passed).toBe(false);
    expect(result.actual).toBe("2");
  });

  it("reports error for throwing code", async () => {
    const result = await runSingleTest(
      THROWING_CODE,
      { name: "test", input: "solution()", expected: "null" },
      5000,
    );
    expect(result.passed).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain("boom");
  });

  it("handles JSON normalization (formatting differences)", async () => {
    const result = await runSingleTest(
      "function solution() { return [1, 2, 3]; }",
      { name: "test", input: "solution()", expected: "[1, 2, 3]" },
      5000,
    );
    // JSON.stringify produces "[1,2,3]" but expected is "[1, 2, 3]"
    // The normalizer should handle this
    expect(result.passed).toBe(true);
  });
});

describe("evaluateCode", () => {
  it("evaluates correct code against all tests", async () => {
    const result = await evaluateCode(SIMPLE_ADD_CODE, ADD_TESTS, 5000);
    expect(result.totalTests).toBe(3);
    expect(result.passed).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.passRate).toBe(1);
  });

  it("reports mixed results for buggy code", async () => {
    const result = await evaluateCode(BUGGY_ADD_CODE, ADD_TESTS, 5000);
    expect(result.totalTests).toBe(3);
    // Only 0+0=0 passes (buggy code returns first arg)
    expect(result.passed).toBeLessThan(3);
    expect(result.failed).toBeGreaterThan(0);
    expect(result.passRate).toBeLessThan(1);
  });

  it("handles empty test suite", async () => {
    const result = await evaluateCode(SIMPLE_ADD_CODE, [], 5000);
    expect(result.totalTests).toBe(0);
    expect(result.passRate).toBe(0);
  });

  it("tracks total duration", async () => {
    const result = await evaluateCode(SIMPLE_ADD_CODE, ADD_TESTS, 5000);
    expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
  });

  it("counts errors separately from failures", async () => {
    const result = await evaluateCode(
      THROWING_CODE,
      [{ name: "test", input: "solution()", expected: "null" }],
      5000,
    );
    expect(result.errors).toBe(1);
    expect(result.failed).toBe(1);
  });
});
