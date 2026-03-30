/**
 * Code Generation evaluator — wraps code-eval's generate_challenge + eval_code.
 *
 * Tests: "Can the LLM write correct code from a spec?"
 */

import { evaluateCode } from "../../../code-eval/core-logic/evaluator.js";
import { generateChallenge } from "../../../code-eval/core-logic/challenges.js";
import { amplifyTests, resolveExpectations } from "../../../code-eval/core-logic/amplifier.js";
import {
  runInSandbox,
  wrapCodeWithSolutionBinding,
} from "../../../code-eval/core-logic/sandbox.js";
import type { BenchChallenge, ChallengeResult, Difficulty, TestCase } from "../types.js";

/**
 * Generate a code_generation challenge.
 */
export function generateCodeGenChallenge(
  variantIndex: number,
  difficulty: Difficulty,
  seed: number,
): BenchChallenge {
  // Use different categories for different variants
  const categories = ["arrays", "strings", "math", "sorting", "data-structures"] as const;
  const category = categories[variantIndex % categories.length] ?? "arrays";
  const challengeSeed = seed + variantIndex * 137;

  const challenge = generateChallenge(difficulty, category, challengeSeed);
  if (!challenge) {
    // Fallback: generate without category filter
    const fallback = generateChallenge(difficulty, undefined, challengeSeed);
    if (!fallback) {
      return {
        dimension: "code_generation",
        variantIndex,
        difficulty,
        type: "code",
        prompt: `Write a JavaScript function called \`solution\` that returns the sum of an array of numbers. Handle empty arrays by returning 0.`,
        evaluationData: {
          type: "code",
          challengeId: "fallback",
          tests: [
            { name: "basic", input: "solution([1, 2, 3])", expected: "6" },
            { name: "empty", input: "solution([])", expected: "0" },
            { name: "negative", input: "solution([-1, 1])", expected: "0" },
          ],
          referenceSolution: "function solution(arr) { return arr.reduce((a, b) => a + b, 0); }",
        },
      };
    }
    return buildChallengeFromTemplate(fallback, variantIndex, difficulty);
  }

  return buildChallengeFromTemplate(challenge, variantIndex, difficulty);
}

function buildChallengeFromTemplate(
  challenge: {
    id: string;
    title: string;
    description: string;
    functionSignature: string;
    starterCode: string;
    tests: TestCase[];
    referenceSolution: string;
  },
  variantIndex: number,
  difficulty: Difficulty,
): BenchChallenge {
  return {
    dimension: "code_generation",
    variantIndex,
    difficulty,
    type: "code",
    prompt: [
      `## ${challenge.title}`,
      "",
      challenge.description,
      "",
      `**Function signature:** \`${challenge.functionSignature}\``,
      "",
      "**Starter code:**",
      "```javascript",
      challenge.starterCode,
      "```",
      "",
      "Write a complete JavaScript function called `solution` that solves this problem.",
    ].join("\n"),
    evaluationData: {
      type: "code",
      challengeId: challenge.id,
      tests: challenge.tests,
      referenceSolution: challenge.referenceSolution,
    },
  };
}

/**
 * Evaluate a code_generation response.
 */
export async function evaluateCodeGen(
  challenge: BenchChallenge,
  response: string,
): Promise<ChallengeResult> {
  const evalData = challenge.evaluationData;
  if (evalData.type !== "code") {
    return {
      dimension: "code_generation",
      passed: false,
      score: 0,
      detail: "Wrong eval data type",
      conflict: false,
    };
  }

  try {
    // Amplify tests using the reference solution
    const amplified = amplifyTests(evalData.tests, 5);
    const wrappedRef = wrapCodeWithSolutionBinding(evalData.referenceSolution);

    const resolved = await resolveExpectations(amplified, wrappedRef, async (code, expr) => {
      const result = await runInSandbox(code, expr, { timeoutMs: 5_000 });
      return { value: result.value, error: result.error };
    });

    const allTests = [...evalData.tests, ...resolved];

    // Evaluate the LLM's code
    const result = await evaluateCode(response, allTests, 5_000);

    return {
      dimension: "code_generation",
      passed: result.passRate >= 0.8,
      score: result.passRate,
      detail: `Passed ${result.passed}/${result.totalTests} tests (${Math.round(result.passRate * 100)}%)`,
      conflict: false,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      dimension: "code_generation",
      passed: false,
      score: 0,
      detail: `Evaluation error: ${message}`,
      conflict: false,
    };
  }
}
