/**
 * eval_code tool — evaluates code against a test suite in a sandbox.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { EvalResult, TestCase, TestResult } from "../mcp/types.js";
import { errorResult, jsonResult } from "../mcp/types.js";
import { runInSandbox, wrapCodeWithSolutionBinding } from "./sandbox.js";

const TestCaseSchema = z.object({
  name: z.string().describe("Test case name"),
  input: z.string().describe("Expression to evaluate (uses `solution` as the export)"),
  expected: z.string().describe("Expected result as JSON string"),
});

const EvalCodeSchema = {
  code: z.string().describe("The code to evaluate"),
  tests: z.array(TestCaseSchema).min(1).describe("Test cases to run against the code"),
  language: z.enum(["javascript", "typescript"]).default("javascript").describe("Source language"),
  timeoutMs: z
    .number()
    .int()
    .min(100)
    .max(30_000)
    .default(5_000)
    .describe("Timeout per test in milliseconds"),
};

/**
 * Run a single test case against the provided code.
 */
export async function runSingleTest(
  code: string,
  test: TestCase,
  timeoutMs: number,
): Promise<TestResult> {
  const wrappedCode = wrapCodeWithSolutionBinding(code);
  const result = await runInSandbox(wrappedCode, test.input, { timeoutMs });

  if (result.error !== undefined) {
    return {
      name: test.name,
      passed: false,
      actual: undefined,
      expected: test.expected,
      error: result.error,
      durationMs: result.durationMs,
    };
  }

  // Normalize comparison: parse both as JSON to handle formatting differences
  let passed = result.value === test.expected;
  if (!passed) {
    try {
      const actualParsed: unknown = JSON.parse(result.value);
      const expectedParsed: unknown = JSON.parse(test.expected);
      passed = JSON.stringify(actualParsed) === JSON.stringify(expectedParsed);
    } catch {
      // If parsing fails, stick with string comparison
    }
  }

  return {
    name: test.name,
    passed,
    actual: result.value,
    expected: test.expected,
    error: undefined,
    durationMs: result.durationMs,
  };
}

/**
 * Evaluate code against a full test suite.
 */
export async function evaluateCode(
  code: string,
  tests: TestCase[],
  timeoutMs: number,
): Promise<EvalResult> {
  const startTime = Date.now();
  const results: TestResult[] = [];

  for (const test of tests) {
    const result = await runSingleTest(code, test, timeoutMs);
    results.push(result);
  }

  const passed = results.filter((r) => r.passed).length;
  const errors = results.filter((r) => r.error !== undefined).length;

  return {
    totalTests: tests.length,
    passed,
    failed: tests.length - passed,
    errors,
    passRate: tests.length > 0 ? passed / tests.length : 0,
    totalDurationMs: Date.now() - startTime,
    results,
  };
}

export function registerEvalCodeTool(server: McpServer): void {
  server.tool(
    "eval_code",
    "Evaluate code against a test suite in a sandboxed environment. Returns pass/fail per test with execution timing.",
    EvalCodeSchema,
    async ({ code, tests, timeoutMs }) => {
      if (code.trim().length === 0) {
        return errorResult("INVALID_CODE", "Code cannot be empty");
      }

      const result = await evaluateCode(code, tests as TestCase[], timeoutMs);

      return jsonResult(result);
    },
  );
}
