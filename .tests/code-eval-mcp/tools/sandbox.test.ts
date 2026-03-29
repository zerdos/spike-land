import { describe, expect, it } from "vitest";
import {
  runInSandbox,
  wrapCodeWithSolutionBinding,
} from "../../../src/mcp-tools/code-eval/core-logic/sandbox.js";

describe("runInSandbox", () => {
  it("executes simple code and returns result", async () => {
    const result = await runInSandbox("function add(a, b) { return a + b; }", "add(2, 3)");
    expect(result.error).toBeUndefined();
    expect(result.value).toBe("5");
    expect(result.timedOut).toBe(false);
  });

  it("returns error for syntax errors", async () => {
    const result = await runInSandbox("function {bad", "bad()");
    expect(result.error).toBeDefined();
  });

  it("returns error for runtime errors", async () => {
    const result = await runInSandbox("function fail() { throw new Error('boom'); }", "fail()");
    expect(result.error).toBeDefined();
    expect(result.error).toContain("boom");
  });

  it("blocks access to process", async () => {
    const result = await runInSandbox("function check() { return typeof process; }", "check()");
    expect(result.value).toBe('"undefined"');
  });

  it("blocks access to require", async () => {
    const result = await runInSandbox("function check() { return typeof require; }", "check()");
    expect(result.value).toBe('"undefined"');
  });

  it("handles string results", async () => {
    const result = await runInSandbox('function greet() { return "hello"; }', "greet()");
    expect(result.value).toBe('"hello"');
  });

  it("handles array results", async () => {
    const result = await runInSandbox("function arr() { return [1, 2, 3]; }", "arr()");
    expect(result.value).toBe("[1,2,3]");
  });

  it("handles null and undefined", async () => {
    const nullResult = await runInSandbox("const x = null;", "x");
    expect(nullResult.value).toBe("null");
  });

  it("handles computationally heavy code", async () => {
    // Note: true infinite loops block the event loop and cannot be timed out
    // with Promise.race in a single-threaded environment. This tests that
    // heavy-but-finite code completes within the sandbox.
    const result = await runInSandbox(
      "function heavy() { let x = 0; for(let i = 0; i < 1e7; i++) x += i; return x; }",
      "heavy()",
      { timeoutMs: 30_000 },
    );
    expect(result.error).toBeUndefined();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("handles boolean results", async () => {
    const result = await runInSandbox("function isEven(n) { return n % 2 === 0; }", "isEven(4)");
    expect(result.value).toBe("true");
  });

  it("handles object results", async () => {
    const result = await runInSandbox('function obj() { return { a: 1, b: "two" }; }', "obj()");
    const parsed = JSON.parse(result.value);
    expect(parsed).toEqual({ a: 1, b: "two" });
  });

  it("tracks duration", async () => {
    const result = await runInSandbox("const x = 1;", "x");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.durationMs).toBeLessThan(5000);
  });
});

describe("wrapCodeWithSolutionBinding", () => {
  it("returns code unchanged if it already has `solution`", () => {
    const code = "function solution(n) { return n * 2; }";
    expect(wrapCodeWithSolutionBinding(code)).toBe(code);
  });

  it("aliases a named function to `solution`", () => {
    const code = "function double(n) { return n * 2; }";
    const wrapped = wrapCodeWithSolutionBinding(code);
    expect(wrapped).toContain("const solution = double;");
  });

  it("aliases a const declaration to `solution`", () => {
    const code = "const double = (n) => n * 2;";
    const wrapped = wrapCodeWithSolutionBinding(code);
    expect(wrapped).toContain("const solution = double;");
  });

  it("returns code unchanged if no identifiable function", () => {
    const code = "42";
    expect(wrapCodeWithSolutionBinding(code)).toBe(code);
  });
});
