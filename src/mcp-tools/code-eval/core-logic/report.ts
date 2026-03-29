/**
 * eval_report tool — full evaluation pipeline orchestrator.
 *
 * generate challenge → amplify tests → evaluate code → rate → structured report.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ChallengeCategory, Difficulty, EvalReport } from "../mcp/types.js";
import { errorResult, jsonResult } from "../mcp/types.js";
import { amplifyTests, resolveExpectations } from "./amplifier.js";
import { generateChallenge, getChallengeById } from "./challenges.js";
import { calculateElo } from "./elo.js";
import { evaluateCode } from "./evaluator.js";
import { runInSandbox, wrapCodeWithSolutionBinding } from "./sandbox.js";

/**
 * Run the full eval pipeline and produce a structured report.
 */
export async function runEvalPipeline(
  code: string,
  challengeId?: string,
  difficulty: Difficulty = "medium",
  category?: ChallengeCategory,
): Promise<EvalReport> {
  // 1. Get or generate challenge
  const challenge =
    challengeId !== undefined
      ? getChallengeById(challengeId)
      : generateChallenge(difficulty, category);

  if (challenge === undefined) {
    throw new Error(`No challenge available for the given parameters`);
  }

  // 2. Amplify tests using the reference solution
  const amplified = amplifyTests(challenge.tests, 5);
  const wrappedRef = wrapCodeWithSolutionBinding(challenge.referenceSolution);

  const resolvedAmplified = await resolveExpectations(
    amplified,
    wrappedRef,
    async (refCode, expr) => {
      const result = await runInSandbox(refCode, expr, { timeoutMs: 5_000 });
      return { value: result.value, error: result.error };
    },
  );

  // 3. Combine original + amplified tests
  const allTests = [...challenge.tests, ...resolvedAmplified];

  // 4. Evaluate the submitted code
  const evalResult = await evaluateCode(code, allTests, 5_000);

  // 5. Also evaluate the reference solution for comparison
  const refEvalResult = await evaluateCode(challenge.referenceSolution, allTests, 5_000);

  // 6. Calculate Elo rating
  const eloRating = calculateElo(
    evalResult,
    code.length,
    challenge.difficulty,
    refEvalResult,
    challenge.referenceSolution.length,
  );

  // 7. Generate summary
  const summary = generateSummary(evalResult, eloRating, challenge.tests.length, allTests.length);

  return {
    challenge: {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      difficulty: challenge.difficulty,
      category: challenge.category,
    },
    originalTestCount: challenge.tests.length,
    amplifiedTestCount: allTests.length,
    evalResult,
    eloRating,
    summary,
  };
}

function generateSummary(
  evalResult: { passed: number; totalTests: number; passRate: number },
  eloRating: { elo: number; percentile: number },
  originalTestCount: number,
  amplifiedTestCount: number,
): string {
  const passPercent = Math.round(evalResult.passRate * 100);
  const amplificationNote =
    amplifiedTestCount > originalTestCount
      ? ` (${originalTestCount} original + ${amplifiedTestCount - originalTestCount} amplified)`
      : "";

  let grade: string;
  if (eloRating.elo >= 1600) grade = "Excellent";
  else if (eloRating.elo >= 1200) grade = "Good";
  else if (eloRating.elo >= 800) grade = "Average";
  else grade = "Needs Improvement";

  return `${grade}: Elo ${eloRating.elo} (top ${(100 - eloRating.percentile).toFixed(1)}%). Passed ${evalResult.passed}/${evalResult.totalTests} tests (${passPercent}%)${amplificationNote}.`;
}

// ─── MCP Tool Registration ──────────────────────────────────────────────────

const EvalReportSchema = {
  code: z.string().describe("The solution code to evaluate"),
  challengeId: z
    .string()
    .optional()
    .describe("Previously generated challenge ID (omit to generate a new challenge)"),
  difficulty: z
    .enum(["easy", "medium", "hard"])
    .default("medium")
    .describe("Difficulty for generated challenge"),
  category: z
    .enum([
      "arrays",
      "strings",
      "math",
      "sorting",
      "searching",
      "data-structures",
      "dynamic-programming",
    ])
    .optional()
    .describe("Category for generated challenge"),
};

export function registerEvalReportTool(server: McpServer): void {
  server.tool(
    "eval_report",
    "Run a full evaluation pipeline: generate challenge → amplify tests → evaluate code → rate with Elo. Returns a comprehensive report with all metrics.",
    EvalReportSchema,
    async ({ code, challengeId, difficulty, category }) => {
      if (code.trim().length === 0) {
        return errorResult("INVALID_CODE", "Code cannot be empty");
      }

      try {
        const report = await runEvalPipeline(
          code,
          challengeId,
          difficulty as Difficulty,
          category as ChallengeCategory | undefined,
        );
        return jsonResult(report);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return errorResult("INTERNAL_ERROR", message);
      }
    },
  );
}
