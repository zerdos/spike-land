/**
 * rate_solution tool — Elo rating system for code solutions.
 *
 * CodeElo-inspired: chess-style Elo rating that makes benchmark scores intuitive.
 * "This solution is rated 1650" is immediately meaningful.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Difficulty, EloRating, EvalResult, TestCase } from "../mcp/types.js";
import { jsonResult } from "../mcp/types.js";
import { evaluateCode } from "./evaluator.js";

// ─── Elo Constants ───────────────────────────────────────────────────────────

const BASE_ELO = 1000;
const K_FACTOR = 32;

const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = {
  easy: 0.8,
  medium: 1.0,
  hard: 1.2,
};

// ─── Percentile Table ────────────────────────────────────────────────────────
// Approximate mapping of Elo → percentile based on normal distribution
// centered at 1000 with σ=200

const PERCENTILE_TABLE: Array<[number, number]> = [
  [400, 0.1],
  [600, 2.3],
  [800, 15.9],
  [900, 30.9],
  [1000, 50.0],
  [1100, 69.1],
  [1200, 84.1],
  [1400, 97.7],
  [1600, 99.4],
  [1800, 99.9],
  [2000, 99.99],
];

/**
 * Interpolate percentile from Elo rating.
 */
export function eloToPercentile(elo: number): number {
  const first = PERCENTILE_TABLE[0] as [number, number];
  if (elo <= first[0]) return first[1];

  for (let i = 1; i < PERCENTILE_TABLE.length; i++) {
    const [prevElo, prevPct] = PERCENTILE_TABLE[i - 1] as [number, number];
    const [currElo, currPct] = PERCENTILE_TABLE[i] as [number, number];

    if (elo <= currElo) {
      const ratio = (elo - prevElo) / (currElo - prevElo);
      return prevPct + ratio * (currPct - prevPct);
    }
  }

  const last = PERCENTILE_TABLE[PERCENTILE_TABLE.length - 1] as [number, number];
  return last[1];
}

/**
 * Calculate Elo rating for a solution based on evaluation results.
 *
 * Score components:
 * - Correctness (70%): pass rate
 * - Speed (20%): normalized execution time (faster = higher)
 * - Brevity (10%): code length as proxy for complexity (shorter = higher)
 *
 * The rating is further adjusted by difficulty multiplier.
 */
export function calculateElo(
  evalResult: EvalResult,
  codeLength: number,
  difficulty: Difficulty,
  referenceEvalResult?: EvalResult,
  referenceCodeLength?: number,
): EloRating {
  // Correctness score (0–1)
  const correctnessScore = evalResult.passRate;

  // Speed score (0–1): based on average execution time
  // Normalize: < 10ms = 1.0, > 1000ms = 0.0
  const avgMs = evalResult.totalTests > 0 ? evalResult.totalDurationMs / evalResult.totalTests : 0;
  const speedScore = Math.max(0, Math.min(1, 1 - avgMs / 1000));

  // Brevity score (0–1): normalize code length
  // < 50 chars = 1.0, > 2000 chars = 0.0
  const brevityScore = Math.max(0, Math.min(1, 1 - (codeLength - 50) / 1950));

  // Weighted composite score
  const compositeScore = correctnessScore * 0.7 + speedScore * 0.2 + brevityScore * 0.1;

  // If we have a reference solution, use head-to-head Elo
  if (referenceEvalResult !== undefined && referenceCodeLength !== undefined) {
    const refAvgMs =
      referenceEvalResult.totalTests > 0
        ? referenceEvalResult.totalDurationMs / referenceEvalResult.totalTests
        : 0;
    const refSpeedScore = Math.max(0, Math.min(1, 1 - refAvgMs / 1000));
    const refBrevityScore = Math.max(0, Math.min(1, 1 - (referenceCodeLength - 50) / 1950));
    const refComposite =
      referenceEvalResult.passRate * 0.7 + refSpeedScore * 0.2 + refBrevityScore * 0.1;

    // Standard Elo: expected score based on rating difference
    const expectedScore = 1 / (1 + Math.pow(10, (BASE_ELO - BASE_ELO) / 400));
    const actualScore =
      compositeScore > refComposite ? 1 : compositeScore === refComposite ? 0.5 : 0;
    const eloDelta = K_FACTOR * (actualScore - expectedScore) * DIFFICULTY_MULTIPLIERS[difficulty];

    const elo = Math.round(BASE_ELO + eloDelta + compositeScore * 500);
    return {
      elo,
      percentile: Math.round(eloToPercentile(elo) * 10) / 10,
      passRate: Math.round(evalResult.passRate * 1000) / 1000,
      avgExecutionMs: Math.round(avgMs * 100) / 100,
      codeLength,
      difficulty,
    };
  }

  // Solo rating: map composite score to Elo range
  // 0.0 → 400, 0.5 → 1000, 1.0 → 1800
  const baseElo = 400 + compositeScore * 1400;
  const elo = Math.round(baseElo * DIFFICULTY_MULTIPLIERS[difficulty]);

  return {
    elo,
    percentile: Math.round(eloToPercentile(elo) * 10) / 10,
    passRate: Math.round(evalResult.passRate * 1000) / 1000,
    avgExecutionMs: Math.round(avgMs * 100) / 100,
    codeLength,
    difficulty,
  };
}

// ─── MCP Tool Registration ──────────────────────────────────────────────────

const TestCaseSchema = z.object({
  name: z.string().describe("Test case name"),
  input: z.string().describe("Expression to evaluate"),
  expected: z.string().describe("Expected result as JSON string"),
});

const RateSolutionSchema = {
  solutionCode: z.string().describe("The solution to rate"),
  referenceCode: z.string().optional().describe("Reference solution to compare against"),
  tests: z.array(TestCaseSchema).min(1).describe("Test suite for evaluation"),
  difficulty: z
    .enum(["easy", "medium", "hard"])
    .default("medium")
    .describe("Problem difficulty level"),
};

export function registerRateSolutionTool(server: McpServer): void {
  server.tool(
    "rate_solution",
    "Rate a code solution using a chess-style Elo system. Evaluates correctness, speed, and brevity. Returns an Elo rating and percentile.",
    RateSolutionSchema,
    async ({ solutionCode, referenceCode, tests, difficulty }) => {
      const testCases = tests as TestCase[];
      const diff = difficulty as Difficulty;

      const evalResult = await evaluateCode(solutionCode, testCases, 5_000);

      let refEvalResult: EvalResult | undefined;
      let refCodeLength: number | undefined;

      if (referenceCode !== undefined) {
        refEvalResult = await evaluateCode(referenceCode, testCases, 5_000);
        refCodeLength = referenceCode.length;
      }

      const rating = calculateElo(
        evalResult,
        solutionCode.length,
        diff,
        refEvalResult,
        refCodeLength,
      );

      return jsonResult({
        rating,
        evalResult,
      });
    },
  );
}
