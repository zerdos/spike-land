import { describe, expect, it } from "vitest";
import {
  amplifyTests,
  inferInputType,
  resolveExpectations,
  splitArgs,
} from "../../../src/mcp-tools/code-eval/core-logic/amplifier.js";
import { ADD_TESTS, FIB_CODE, FIB_TESTS } from "../__test-utils__/index.js";

describe("inferInputType", () => {
  it("detects number type", () => {
    expect(inferInputType("solution(5)")).toBe("number");
    expect(inferInputType("solution(-3)")).toBe("number");
    expect(inferInputType("solution(3.14)")).toBe("number");
  });

  it("detects string type", () => {
    expect(inferInputType('solution("hello")')).toBe("string");
    expect(inferInputType("solution('world')")).toBe("string");
  });

  it("detects array type", () => {
    expect(inferInputType("solution([1, 2, 3])")).toBe("array");
    expect(inferInputType("solution([])")).toBe("array");
  });

  it("detects boolean type", () => {
    expect(inferInputType("solution(true)")).toBe("boolean");
    expect(inferInputType("solution(false)")).toBe("boolean");
  });

  it("detects object type", () => {
    expect(inferInputType("solution({a: 1})")).toBe("object");
  });

  it("returns unknown for unrecognized patterns", () => {
    expect(inferInputType("solution(foo)")).toBe("unknown");
  });
});

describe("splitArgs", () => {
  it("splits simple arguments", () => {
    expect(splitArgs("1, 2, 3")).toEqual(["1", "2", "3"]);
  });

  it("respects nested brackets", () => {
    expect(splitArgs("[1, 2], 3")).toEqual(["[1, 2]", "3"]);
  });

  it("respects quoted strings", () => {
    expect(splitArgs('"hello, world", 3')).toEqual(['"hello, world"', "3"]);
  });

  it("handles single argument", () => {
    expect(splitArgs("5")).toEqual(["5"]);
  });

  it("handles empty string", () => {
    expect(splitArgs("")).toEqual([]);
  });

  it("handles nested objects", () => {
    expect(splitArgs("{a: 1, b: 2}, 3")).toEqual(["{a: 1, b: 2}", "3"]);
  });
});

describe("amplifyTests", () => {
  it("returns empty for empty input", () => {
    expect(amplifyTests([], 10)).toEqual([]);
  });

  it("generates amplified tests for numeric inputs", () => {
    const amplified = amplifyTests(FIB_TESTS, 5);
    expect(amplified.length).toBeGreaterThan(0);
    expect(amplified.every((t) => t.input.startsWith("solution("))).toBe(true);
  });

  it("generates amplified tests for multi-arg functions", () => {
    const amplified = amplifyTests(ADD_TESTS, 5);
    expect(amplified.length).toBeGreaterThan(0);
    // All should be `solution(X, Y)` format
    expect(amplified.every((t) => t.input.includes(","))).toBe(true);
  });

  it("deduplicates against existing tests", () => {
    const amplified = amplifyTests(ADD_TESTS, 5);
    const existingInputs = new Set(ADD_TESTS.map((t) => t.input));
    for (const test of amplified) {
      expect(existingInputs.has(test.input)).toBe(false);
    }
  });

  it("marks expectations as needing reference", () => {
    const amplified = amplifyTests(FIB_TESTS, 3);
    expect(amplified.every((t) => t.expected === "__NEEDS_REFERENCE__")).toBe(true);
  });

  it("respects amplification factor cap", () => {
    const amplified = amplifyTests(FIB_TESTS.slice(0, 1), 3);
    expect(amplified.length).toBeLessThanOrEqual(3);
  });
});

describe("resolveExpectations", () => {
  it("resolves expectations using reference code", async () => {
    const amplified = amplifyTests(FIB_TESTS, 3);
    const resolved = await resolveExpectations(amplified, FIB_CODE, async (code, expr) => {
      // Use actual sandbox import
      const { runInSandbox, wrapCodeWithSolutionBinding } = await import(
        "../../../src/mcp-tools/code-eval/core-logic/sandbox.js"
      );
      const wrapped = wrapCodeWithSolutionBinding(code);
      const result = await runInSandbox(wrapped, expr, { timeoutMs: 5000 });
      return { value: result.value, error: result.error };
    });

    expect(resolved.length).toBeGreaterThan(0);
    expect(resolved.every((t) => t.expected !== "__NEEDS_REFERENCE__")).toBe(true);
  });

  it("discards tests where reference errors", async () => {
    const badTests = [
      { name: "bad", input: "solution(undefined)", expected: "__NEEDS_REFERENCE__" },
    ];

    const resolved = await resolveExpectations(
      badTests,
      "function solution(n) { if (n === undefined) throw new Error('bad'); return n; }",
      async (_code, _expr) => {
        return { value: "", error: "bad" };
      },
    );

    expect(resolved.length).toBe(0);
  });
});
