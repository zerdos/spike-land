/**
 * Test utilities for code-eval-mcp.
 */

export {
  createMockServer,
  type MockMcpServer,
} from "@spike-land-ai/mcp-server-base";

export { type TestCase } from "../../../src/mcp-tools/code-eval/mcp/types.js";

// ─── Fixtures ────────────────────────────────────────────────────────────────

/** Simple add function for testing. */
export const SIMPLE_ADD_CODE = `function solution(a, b) { return a + b; }`;

/** Buggy add function (always returns first arg). */
export const BUGGY_ADD_CODE = `function solution(a, b) { return a; }`;

/** Function that throws an error. */
export const THROWING_CODE = `function solution() { throw new Error("boom"); }`;

/** Infinite loop code. */
export const INFINITE_LOOP_CODE = `function solution() { while(true) {} }`;

/** Simple add test cases. */
export const ADD_TESTS = [
  { name: "2+3=5", input: "solution(2, 3)", expected: "5" },
  { name: "0+0=0", input: "solution(0, 0)", expected: "0" },
  { name: "-1+1=0", input: "solution(-1, 1)", expected: "0" },
];

/** Fibonacci test cases. */
export const FIB_TESTS = [
  { name: "fib(0)=0", input: "solution(0)", expected: "0" },
  { name: "fib(1)=1", input: "solution(1)", expected: "1" },
  { name: "fib(5)=5", input: "solution(5)", expected: "5" },
  { name: "fib(10)=55", input: "solution(10)", expected: "55" },
];

/** Reference fibonacci implementation. */
export const FIB_CODE = `function solution(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) { [a, b] = [b, a + b]; }
  return b;
}`;
