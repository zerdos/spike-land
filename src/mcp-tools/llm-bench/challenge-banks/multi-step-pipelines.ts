/**
 * Multi-Step Pipeline Scenarios — challenges requiring tool chaining.
 *
 * Tests: "Can the LLM chain multiple operations to solve a problem?"
 */

import type { PipelineStep } from "../core-logic/types.js";

export interface MultiStepScenario {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  steps: PipelineStep[];
  expectedOutcome: string;
}

export const MULTI_STEP_SCENARIOS: MultiStepScenario[] = [
  // ─── Easy ───────────────────────────────────────────────────────────────
  {
    title: "Generate and Evaluate",
    description: "Generate a coding challenge and evaluate a given solution against it.",
    difficulty: "easy",
    steps: [
      {
        description: "Generate a coding challenge",
        expectedTool: "generate_challenge",
        expectedArgs: { difficulty: "easy" },
      },
      {
        description: "Evaluate the solution against the challenge's tests",
        expectedTool: "eval_code",
        expectedArgs: { code: "<solution>", tests: "<from_step_1>" },
      },
    ],
    expectedOutcome: "A structured evaluation result showing pass/fail per test",
  },
  {
    title: "Amplify and Test",
    description: "Take a thin test suite, amplify it, then run the amplified tests against code.",
    difficulty: "easy",
    steps: [
      {
        description: "Amplify the existing test suite",
        expectedTool: "amplify_tests",
        expectedArgs: { code: "<reference>", existingTests: "<tests>" },
      },
      {
        description: "Evaluate code against the amplified tests",
        expectedTool: "eval_code",
        expectedArgs: { code: "<solution>", tests: "<amplified_from_step_1>" },
      },
    ],
    expectedOutcome: "Evaluation showing if the code handles edge cases found by amplification",
  },

  // ─── Medium ─────────────────────────────────────────────────────────────
  {
    title: "Full Eval Pipeline",
    description: "Generate a challenge, amplify its tests, evaluate a solution, then rate it.",
    difficulty: "medium",
    steps: [
      {
        description: "Generate a medium difficulty challenge",
        expectedTool: "generate_challenge",
        expectedArgs: { difficulty: "medium" },
      },
      {
        description: "Amplify the generated test suite",
        expectedTool: "amplify_tests",
        expectedArgs: { code: "<reference_from_step_1>", existingTests: "<tests_from_step_1>" },
      },
      {
        description: "Evaluate the solution against all tests",
        expectedTool: "eval_code",
        expectedArgs: { code: "<solution>", tests: "<all_tests>" },
      },
      {
        description: "Rate the solution with Elo",
        expectedTool: "rate_solution",
        expectedArgs: { solutionCode: "<solution>", tests: "<all_tests>" },
      },
    ],
    expectedOutcome: "Complete evaluation with Elo rating, pass rate, and execution time",
  },
  {
    title: "Debug and Verify",
    description: "Identify the bug in code, fix it, verify the fix with amplified tests.",
    difficulty: "medium",
    steps: [
      {
        description: "Evaluate buggy code to identify failing tests",
        expectedTool: "eval_code",
        expectedArgs: { code: "<buggy_code>", tests: "<tests>" },
      },
      {
        description: "Fix the identified bug",
        expectedTool: "eval_code",
        expectedArgs: { code: "<fixed_code>", tests: "<tests>" },
      },
      {
        description: "Amplify tests and re-verify the fix",
        expectedTool: "amplify_tests",
        expectedArgs: { code: "<fixed_code>", existingTests: "<tests>" },
      },
    ],
    expectedOutcome: "Fixed code passes both original and amplified tests",
  },

  // ─── Hard ──────────────────────────────────────────────────────────────
  {
    title: "Comparative Evaluation",
    description:
      "Generate a challenge, have two solutions compete, amplify tests for robustness, rate both.",
    difficulty: "hard",
    steps: [
      {
        description: "Generate a hard challenge",
        expectedTool: "generate_challenge",
        expectedArgs: { difficulty: "hard" },
      },
      {
        description: "Amplify the test suite aggressively",
        expectedTool: "amplify_tests",
        expectedArgs: { amplificationFactor: 20 },
      },
      {
        description: "Evaluate solution A",
        expectedTool: "eval_code",
        expectedArgs: { code: "<solution_a>" },
      },
      {
        description: "Evaluate solution B",
        expectedTool: "eval_code",
        expectedArgs: { code: "<solution_b>" },
      },
      {
        description: "Rate both solutions head-to-head",
        expectedTool: "rate_solution",
        expectedArgs: { solutionCode: "<solution_a>", referenceCode: "<solution_b>" },
      },
    ],
    expectedOutcome: "Head-to-head Elo comparison showing which solution is more robust",
  },
  {
    title: "Contamination Detection Pipeline",
    description:
      "Test if a model's solution is contaminated by amplifying tests and checking edge case failure patterns.",
    difficulty: "hard",
    steps: [
      {
        description: "Generate a challenge with a specific seed",
        expectedTool: "generate_challenge",
        expectedArgs: { seed: 42 },
      },
      {
        description: "Evaluate against original thin tests",
        expectedTool: "eval_code",
        expectedArgs: { code: "<solution>" },
      },
      {
        description: "Amplify with high factor to generate novel edge cases",
        expectedTool: "amplify_tests",
        expectedArgs: { amplificationFactor: 30 },
      },
      {
        description: "Re-evaluate against amplified tests",
        expectedTool: "eval_code",
        expectedArgs: { code: "<solution>", tests: "<amplified>" },
      },
      {
        description: "Compare pass rates: high original + low amplified = contamination signal",
        expectedTool: "eval_report",
        expectedArgs: {},
      },
    ],
    expectedOutcome:
      "Analysis showing whether performance drop on amplified tests indicates contamination",
  },
];

export function getScenariosByDifficulty(
  difficulty: "easy" | "medium" | "hard",
): MultiStepScenario[] {
  return MULTI_STEP_SCENARIOS.filter((s) => s.difficulty === difficulty);
}

export function getScenario(
  difficulty: "easy" | "medium" | "hard",
  variantIndex: number,
): MultiStepScenario | undefined {
  const filtered = getScenariosByDifficulty(difficulty);
  return filtered[variantIndex % filtered.length];
}
