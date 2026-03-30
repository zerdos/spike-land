/**
 * Debugging evaluator — tests if an LLM can find and fix bugs.
 *
 * Generates a working solution, injects a deterministic bug,
 * shows buggy code + failing test, evaluates the fix.
 */

import { evaluateCode } from "../../../code-eval/core-logic/evaluator.js";
import { generateChallenge } from "../../../code-eval/core-logic/challenges.js";
import { injectAnyBug } from "../bug-injector.js";
import type { BenchChallenge, BugType, ChallengeResult, Difficulty, TestCase } from "../types.js";
import { BUG_TYPES } from "../types.js";

/**
 * Generate a debugging challenge.
 */
export function generateDebuggingChallenge(
  variantIndex: number,
  difficulty: Difficulty,
  seed: number,
): BenchChallenge {
  const bugType: BugType = BUG_TYPES[variantIndex % BUG_TYPES.length] ?? "off_by_one";
  const challengeSeed = seed + variantIndex * 211;

  const challenge = generateChallenge(difficulty, undefined, challengeSeed);
  if (!challenge) {
    return createFallbackDebugging(variantIndex, difficulty, bugType);
  }

  const injected = injectAnyBug(challenge.referenceSolution, bugType);
  if (!injected) {
    return createFallbackDebugging(variantIndex, difficulty, bugType);
  }

  return {
    dimension: "debugging",
    variantIndex,
    difficulty,
    type: "fix",
    prompt: [
      `## Debug This Code`,
      "",
      `The following function has a bug. Find and fix it.`,
      "",
      "**Buggy code:**",
      "```javascript",
      injected.buggyCode,
      "```",
      "",
      "**Failing test:**",
      `\`${challenge.tests[0]?.input ?? "solution()"}\` should return \`${challenge.tests[0]?.expected ?? "undefined"}\``,
      "",
      "Return the corrected function as `solution`.",
    ].join("\n"),
    evaluationData: {
      type: "fix",
      buggyCode: injected.buggyCode,
      originalCode: challenge.referenceSolution,
      tests: challenge.tests,
      bugType: injected.bugType,
    },
  };
}

function createFallbackDebugging(
  variantIndex: number,
  difficulty: Difficulty,
  bugType: BugType,
): BenchChallenge {
  // Fallback with a simple known buggy function
  const buggyCode = `function solution(arr) {
  let sum = 0;
  for (let i = 0; i <= arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}`;
  const originalCode = `function solution(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}`;

  return {
    dimension: "debugging",
    variantIndex,
    difficulty,
    type: "fix",
    prompt: [
      `## Debug This Code`,
      "",
      `The following function has an off-by-one error. Find and fix it.`,
      "",
      "**Buggy code:**",
      "```javascript",
      buggyCode,
      "```",
      "",
      "**Failing test:** `solution([1, 2, 3])` should return `6`",
      "",
      "Return the corrected function as `solution`.",
    ].join("\n"),
    evaluationData: {
      type: "fix",
      buggyCode,
      originalCode,
      tests: [
        { name: "basic", input: "solution([1, 2, 3])", expected: "6" },
        { name: "empty", input: "solution([])", expected: "0" },
        { name: "single", input: "solution([5])", expected: "5" },
      ],
      bugType,
    },
  };
}

/**
 * Evaluate a debugging response.
 */
export async function evaluateDebugging(
  challenge: BenchChallenge,
  response: string,
): Promise<ChallengeResult> {
  const evalData = challenge.evaluationData;
  if (evalData.type !== "fix") {
    return {
      dimension: "debugging",
      passed: false,
      score: 0,
      detail: "Wrong eval data type",
      conflict: false,
    };
  }

  try {
    const result = await evaluateCode(response, evalData.tests, 5_000);

    return {
      dimension: "debugging",
      passed: result.passRate >= 0.8,
      score: result.passRate,
      detail: `Fix passed ${result.passed}/${result.totalTests} tests (bug type: ${evalData.bugType})`,
      conflict: false,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      dimension: "debugging",
      passed: false,
      score: 0,
      detail: `Evaluation error: ${message}`,
      conflict: false,
    };
  }
}
