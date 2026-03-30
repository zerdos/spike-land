/**
 * Test utilities for llm-bench-mcp tests.
 */

import type {
  BenchChallenge,
  ChallengeResult,
  Difficulty,
} from "../../../src/mcp-tools/llm-bench/core-logic/types.js";

/**
 * Create a simple code-generation challenge for testing.
 */
export function createMockCodeChallenge(
  variantIndex: number = 0,
  difficulty: Difficulty = "medium",
): BenchChallenge {
  return {
    dimension: "code_generation",
    variantIndex,
    difficulty,
    type: "code",
    prompt: "Write a solution function",
    evaluationData: {
      type: "code",
      challengeId: "test-challenge",
      tests: [
        { name: "basic", input: "solution([1, 2, 3])", expected: "6" },
        { name: "empty", input: "solution([])", expected: "0" },
      ],
      referenceSolution: "function solution(arr) { return arr.reduce((a, b) => a + b, 0); }",
    },
  };
}

/**
 * Create a mock MCQ challenge for testing.
 */
export function createMockMCQChallenge(
  variantIndex: number = 0,
  difficulty: Difficulty = "medium",
): BenchChallenge {
  return {
    dimension: "tool_selection",
    variantIndex,
    difficulty,
    type: "mcq",
    prompt: "Which tool evaluates code?",
    evaluationData: {
      type: "mcq",
      correctIndex: 1,
      options: ["search_tools", "eval_code", "amplify_tests", "generate_challenge"],
    },
  };
}

/**
 * Create a mock passing result.
 */
export function createPassingResult(dimension: string): ChallengeResult {
  return {
    dimension: dimension as ChallengeResult["dimension"],
    passed: true,
    score: 1,
    detail: "All tests passed",
    conflict: false,
  };
}
