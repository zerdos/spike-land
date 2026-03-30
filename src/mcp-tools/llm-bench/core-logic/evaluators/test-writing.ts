/**
 * Test Writing evaluator — mutation testing.
 *
 * Tests: "Can the LLM write tests that catch known bugs in mutants?"
 *
 * Given a function, the LLM writes tests. Score = how many mutants
 * the tests kill (catch the bug).
 */

import { evaluateCode } from "../../../code-eval/core-logic/evaluator.js";
import { generateChallenge } from "../../../code-eval/core-logic/challenges.js";
import { generateMutants } from "../mutant-generator.js";
import type { BenchChallenge, ChallengeResult, Difficulty, TestCase } from "../types.js";

/**
 * Generate a test-writing challenge.
 */
export function generateTestWritingChallenge(
  variantIndex: number,
  difficulty: Difficulty,
  seed: number,
): BenchChallenge {
  const challengeSeed = seed + variantIndex * 313;
  const challenge = generateChallenge(difficulty, undefined, challengeSeed);

  if (!challenge) {
    return createFallbackTestWriting(variantIndex, difficulty);
  }

  const mutants = generateMutants(challenge.referenceSolution, 3);
  if (mutants.length === 0) {
    return createFallbackTestWriting(variantIndex, difficulty);
  }

  return {
    dimension: "test_writing",
    variantIndex,
    difficulty,
    type: "write_tests",
    prompt: [
      `## Write Tests for This Function`,
      "",
      `The following function claims to work correctly. Write test cases that would catch common bugs.`,
      "",
      "**Function:**",
      "```javascript",
      challenge.referenceSolution,
      "```",
      "",
      `**Function signature:** \`${challenge.functionSignature}\``,
      "",
      `Write your tests as a JSON array of objects with \`name\`, \`input\` (expression using \`solution\`), and \`expected\` (JSON string) fields.`,
      "",
      "Example format:",
      '```json',
      '[{"name": "test_basic", "input": "solution([1,2,3])", "expected": "6"}]',
      '```',
    ].join("\n"),
    evaluationData: {
      type: "write_tests",
      originalCode: challenge.referenceSolution,
      mutants: mutants.map((m) => ({ code: m.code, bugDescription: m.bugDescription })),
      functionSignature: challenge.functionSignature,
    },
  };
}

function createFallbackTestWriting(
  variantIndex: number,
  difficulty: Difficulty,
): BenchChallenge {
  const code = `function solution(arr) {
  if (arr.length === 0) return 0;
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) max = arr[i];
  }
  return max;
}`;

  return {
    dimension: "test_writing",
    variantIndex,
    difficulty,
    type: "write_tests",
    prompt: [
      `## Write Tests for This Function`,
      "",
      "Write test cases that thoroughly test this function and would catch common bugs.",
      "",
      "**Function:**",
      "```javascript",
      code,
      "```",
      "",
      "Write tests as JSON: `[{\"name\": \"...\", \"input\": \"solution(...)\", \"expected\": \"...\"}]`",
    ].join("\n"),
    evaluationData: {
      type: "write_tests",
      originalCode: code,
      mutants: [
        { code: code.replace("i < arr.length", "i <= arr.length"), bugDescription: "Off-by-one in loop" },
        { code: code.replace("arr[i] > max", "arr[i] >= max"), bugDescription: "Changed > to >=" },
        { code: code.replace("if (arr.length === 0) return 0;\n", ""), bugDescription: "Removed empty array guard" },
      ],
      functionSignature: "solution(arr: number[]): number",
    },
  };
}

/**
 * Evaluate a test-writing response.
 *
 * Parse the LLM's test cases, run them against original code (should pass)
 * and each mutant (should fail). Score = mutant kill rate.
 */
export async function evaluateTestWriting(
  challenge: BenchChallenge,
  response: string,
): Promise<ChallengeResult> {
  const evalData = challenge.evaluationData;
  if (evalData.type !== "write_tests") {
    return { dimension: "test_writing", passed: false, score: 0, detail: "Wrong eval data type", conflict: false };
  }

  try {
    // Parse tests from the LLM response
    const tests = parseTestsFromResponse(response);
    if (tests.length === 0) {
      return {
        dimension: "test_writing",
        passed: false,
        score: 0,
        detail: "Could not parse any test cases from response",
        conflict: false,
      };
    }

    // Step 1: Verify tests pass against original code
    const originalResult = await evaluateCode(evalData.originalCode, tests, 5_000);
    if (originalResult.passRate < 0.5) {
      return {
        dimension: "test_writing",
        passed: false,
        score: 0.1,
        detail: `Only ${originalResult.passed}/${originalResult.totalTests} tests pass against the original code`,
        conflict: false,
      };
    }

    // Step 2: Run tests against each mutant — count kills
    let mutantsKilled = 0;
    for (const mutant of evalData.mutants) {
      const mutantResult = await evaluateCode(mutant.code, tests, 5_000);
      // A mutant is "killed" if at least one test fails
      if (mutantResult.failed > 0) {
        mutantsKilled++;
      }
    }

    const killRate = evalData.mutants.length > 0 ? mutantsKilled / evalData.mutants.length : 0;

    return {
      dimension: "test_writing",
      passed: killRate >= 0.5,
      score: killRate,
      detail: `Killed ${mutantsKilled}/${evalData.mutants.length} mutants with ${tests.length} tests`,
      conflict: false,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      dimension: "test_writing",
      passed: false,
      score: 0,
      detail: `Evaluation error: ${message}`,
      conflict: false,
    };
  }
}

/**
 * Parse test cases from various response formats.
 */
function parseTestsFromResponse(response: string): TestCase[] {
  // Try parsing as JSON array directly
  try {
    const parsed: unknown = JSON.parse(response);
    if (Array.isArray(parsed)) {
      return validateTests(parsed);
    }
  } catch {
    // Not pure JSON
  }

  // Try extracting JSON from markdown code block
  const jsonMatch = /```(?:json)?\s*\n?([\s\S]*?)```/.exec(response);
  if (jsonMatch?.[1]) {
    try {
      const parsed: unknown = JSON.parse(jsonMatch[1]);
      if (Array.isArray(parsed)) {
        return validateTests(parsed);
      }
    } catch {
      // Invalid JSON in code block
    }
  }

  // Try finding array in the response
  const arrayMatch = /\[[\s\S]*\]/.exec(response);
  if (arrayMatch) {
    try {
      const parsed: unknown = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) {
        return validateTests(parsed);
      }
    } catch {
      // Can't parse
    }
  }

  return [];
}

function validateTests(arr: unknown[]): TestCase[] {
  const tests: TestCase[] = [];
  for (const item of arr) {
    if (
      typeof item === "object" &&
      item !== null &&
      "name" in item &&
      "input" in item &&
      "expected" in item &&
      typeof (item as Record<string, unknown>).name === "string" &&
      typeof (item as Record<string, unknown>).input === "string" &&
      typeof (item as Record<string, unknown>).expected === "string"
    ) {
      tests.push(item as TestCase);
    }
  }
  return tests;
}
