/**
 * amplify_tests tool — deterministic test amplification.
 *
 * EvalPlus-inspired: given code + seed tests, generate additional test cases
 * that probe edge cases, boundary conditions, and error paths.
 * No LLM needed — purely mechanical mutation strategies.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { TestCase } from "../mcp/types.js";
import { jsonResult } from "../mcp/types.js";

// ─── Mutation Strategies ─────────────────────────────────────────────────────

/** Mutations for numeric inputs. */
const NUMBER_MUTATIONS = [
  0,
  -1,
  1,
  -0,
  0.5,
  -0.5,
  100,
  -100,
  Number.MAX_SAFE_INTEGER,
  Number.MIN_SAFE_INTEGER,
];

/** Mutations for string inputs. */
const STRING_MUTATIONS = [
  '""',
  '" "',
  '"a"',
  '"aa"',
  '"abc"',
  '"Hello World"',
  '"  leading"',
  '"trailing  "',
  '"special!@#$%"',
  '"unicode: café"',
  '"emoji: 🎉"',
  `"${"a".repeat(100)}"`,
];

/** Mutations for array inputs. */
const ARRAY_MUTATIONS = [
  "[]",
  "[0]",
  "[1]",
  "[1, 2, 3]",
  "[3, 2, 1]",
  "[1, 1, 1]",
  "[-1, 0, 1]",
  "[0, 0, 0, 0, 0]",
  "[100]",
  "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]",
];

/** Mutations for boolean inputs. */
const BOOLEAN_MUTATIONS = ["true", "false"];

// ─── Type Detection ──────────────────────────────────────────────────────────

type InputType = "number" | "string" | "array" | "boolean" | "object" | "unknown";

/**
 * Infer the type of a test input expression.
 */
export function inferInputType(input: string): InputType {
  const trimmed = input.trim();

  // Check if it's a function call like `solution(...)` — inspect the argument
  const callMatch = /^solution\((.+)\)$/.exec(trimmed);
  const argStr = callMatch?.[1] ?? trimmed;
  const firstArg = argStr.split(",")[0]?.trim() ?? argStr;

  if (/^-?\d+(\.\d+)?$/.test(firstArg) || /^Number\b/.test(firstArg)) return "number";
  if (firstArg.startsWith('"') || firstArg.startsWith("'") || firstArg.startsWith("`"))
    return "string";
  if (firstArg.startsWith("[")) return "array";
  if (firstArg === "true" || firstArg === "false") return "boolean";
  if (firstArg.startsWith("{")) return "object";
  return "unknown";
}

/**
 * Get mutation values for a detected type.
 */
function getMutationsForType(type: InputType): string[] {
  switch (type) {
    case "number":
      return NUMBER_MUTATIONS.map(String);
    case "string":
      return STRING_MUTATIONS;
    case "array":
      return ARRAY_MUTATIONS;
    case "boolean":
      return BOOLEAN_MUTATIONS;
    case "object":
      return ["{}"];
    case "unknown":
      return [
        ...NUMBER_MUTATIONS.slice(0, 3).map(String),
        ...STRING_MUTATIONS.slice(0, 3),
        ...ARRAY_MUTATIONS.slice(0, 3),
      ];
  }
}

/**
 * Extract the function call pattern from a test input.
 * Returns the wrapper template and the argument(s).
 *
 * Examples:
 *   "solution(5)"        → { template: "solution($)", args: ["5"] }
 *   "solution([1,2], 3)" → { template: "solution($, $)", args: ["[1,2]", "3"] }
 *   "5 + 3"              → { template: "$", args: ["5 + 3"] }
 */
export function extractCallPattern(input: string): { template: string; argIndices: number[] } {
  const callMatch = /^solution\((.+)\)$/.exec(input.trim());
  if (!callMatch?.[1]) {
    return { template: input, argIndices: [] };
  }

  // Split args respecting brackets and quotes
  const args = splitArgs(callMatch[1]);
  let template = "solution(";
  const argIndices: number[] = [];

  for (let i = 0; i < args.length; i++) {
    if (i > 0) template += ", ";
    template += `\${${i}}`;
    argIndices.push(i);
  }
  template += ")";

  return { template, argIndices };
}

/**
 * Split function arguments respecting nested brackets and quotes.
 */
export function splitArgs(argsStr: string): string[] {
  const args: string[] = [];
  let current = "";
  let depth = 0;
  let inString: string | null = null;

  for (const char of argsStr) {
    if (inString !== null) {
      current += char;
      if (char === inString) inString = null;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      inString = char;
      current += char;
      continue;
    }

    if (char === "[" || char === "(" || char === "{") {
      depth++;
      current += char;
      continue;
    }

    if (char === "]" || char === ")" || char === "}") {
      depth--;
      current += char;
      continue;
    }

    if (char === "," && depth === 0) {
      args.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim().length > 0) {
    args.push(current.trim());
  }

  return args;
}

/**
 * Generate amplified test cases from existing tests.
 *
 * Strategy:
 * 1. Detect input types from existing tests
 * 2. Apply type-specific mutations
 * 3. Build new test expressions using the same call pattern
 * 4. Deduplicate against existing tests
 */
export function amplifyTests(existingTests: TestCase[], amplificationFactor: number): TestCase[] {
  if (existingTests.length === 0) return [];

  const existingInputs = new Set(existingTests.map((t) => t.input));
  const amplified: TestCase[] = [];

  for (const test of existingTests) {
    const inputType = inferInputType(test.input);
    const mutations = getMutationsForType(inputType);
    const callMatch = /^solution\((.+)\)$/.exec(test.input.trim());

    if (!callMatch?.[1]) continue;

    const args = splitArgs(callMatch[1]);
    if (args.length === 0) continue;

    // Mutate the first argument (most impactful)
    for (const mutation of mutations) {
      if (amplified.length >= amplificationFactor * existingTests.length) break;

      const newArgs = [mutation, ...args.slice(1)];
      const newInput = `solution(${newArgs.join(", ")})`;

      if (existingInputs.has(newInput)) continue;
      existingInputs.add(newInput);

      amplified.push({
        name: `amplified_${test.name}_${amplified.length}`,
        input: newInput,
        // Expected is "unknown" — caller must evaluate reference solution
        expected: "__NEEDS_REFERENCE__",
      });
    }
  }

  return amplified;
}

/**
 * Resolve amplified test expectations by running reference code.
 * Tests whose reference execution fails are discarded (the mutation
 * may produce invalid input for this particular problem).
 */
export async function resolveExpectations(
  amplifiedTests: TestCase[],
  referenceCode: string,
  runFn: (
    code: string,
    expression: string,
  ) => Promise<{ value: string; error: string | undefined }>,
): Promise<TestCase[]> {
  const resolved: TestCase[] = [];

  for (const test of amplifiedTests) {
    const result = await runFn(referenceCode, test.input);
    if (result.error === undefined) {
      resolved.push({
        ...test,
        expected: result.value,
      });
    }
    // Tests where reference solution errors are silently dropped —
    // the mutation produced an input the reference can't handle,
    // which means it's not a valid test case for this problem.
  }

  return resolved;
}

// ─── MCP Tool Registration ──────────────────────────────────────────────────

const TestCaseSchema = z.object({
  name: z.string().describe("Test case name"),
  input: z.string().describe("Expression to evaluate"),
  expected: z.string().describe("Expected result as JSON string"),
});

const AmplifyTestsSchema = {
  code: z.string().describe("The code to generate additional tests for"),
  existingTests: z.array(TestCaseSchema).optional().describe("Existing tests to build upon"),
  amplificationFactor: z
    .number()
    .int()
    .min(2)
    .max(50)
    .default(10)
    .describe("Target multiplier for test count"),
};

export function registerAmplifyTestsTool(server: McpServer): void {
  server.tool(
    "amplify_tests",
    "Generate additional test cases from existing tests using deterministic mutation strategies. EvalPlus-style test amplification that probes edge cases, boundaries, and error paths.",
    AmplifyTestsSchema,
    async ({ code, existingTests, amplificationFactor }) => {
      const tests = (existingTests ?? []) as TestCase[];
      const amplified = amplifyTests(tests, amplificationFactor);

      // Resolve expectations using the provided code as reference
      const { runInSandbox, wrapCodeWithSolutionBinding } = await import("./sandbox.js");
      const wrappedCode = wrapCodeWithSolutionBinding(code);

      const resolved = await resolveExpectations(amplified, wrappedCode, async (refCode, expr) => {
        const result = await runInSandbox(refCode, expr, { timeoutMs: 5_000 });
        return { value: result.value, error: result.error };
      });

      return jsonResult({
        originalCount: tests.length,
        amplifiedCount: resolved.length,
        amplificationRatio: tests.length > 0 ? resolved.length / tests.length : 0,
        tests: resolved,
      });
    },
  );
}
