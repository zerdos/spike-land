#!/usr/bin/env node

/**
 * LLM Agentic Coding Benchmark ("Queez") — MCP Server
 *
 * Adaptive mastery-based benchmark for LLM coding ability.
 * 6 dimensions, Elo rating, conflict detection, D1-backed leaderboard.
 */

import {
  createErrorShipper,
  createMcpServer,
  registerFeedbackTool,
  startMcpServer,
  wrapServerWithLogging,
} from "@spike-land-ai/mcp-server-base";
import { z } from "zod";
import { jsonResult, errorResult } from "./types.js";
import {
  createSession,
  generateNextRound,
  evaluateRound,
  sanitizeRound,
  getSessionState,
} from "../core-logic/session.js";
import {
  generateChallengeForDimension,
  evaluateChallengeResponse,
} from "../core-logic/dimensions.js";
import { computeAgentElo } from "../core-logic/elo.js";
import { getLeaderboard, updateLeaderboard } from "../core-logic/leaderboard.js";
import { evaluateToolSelection } from "../core-logic/evaluators/tool-selection.js";
import { evaluateMultiStep } from "../core-logic/evaluators/multi-step.js";
import { evaluateContextManagement } from "../core-logic/evaluators/context-management.js";
import type { BenchDimension, ChallengeResponse, Difficulty } from "../core-logic/types.js";
import { BENCH_DIMENSIONS, DIFFICULTY_LEVELS } from "../core-logic/types.js";

// ─── Server Setup ────────────────────────────────────────────────────────────

const server = createMcpServer({
  name: "llm-bench-mcp",
  version: "0.1.0",
});

// ─── Error Shipping ──────────────────────────────────────────────────────────

const shipper = createErrorShipper();

process.on("uncaughtException", (err) =>
  shipper.shipError({
    service_name: "llm-bench-mcp",
    message: err.message,
    stack_trace: err.stack ?? "",
    severity: "high",
  }),
);

process.on("unhandledRejection", (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  shipper.shipError({
    service_name: "llm-bench-mcp",
    message: err.message,
    stack_trace: err.stack ?? "",
    severity: "medium",
  });
});

// ─── Logging ─────────────────────────────────────────────────────────────────

wrapServerWithLogging(server, "llm-bench-mcp");

// ─── Tool 1: bench_create_session ────────────────────────────────────────────

server.tool(
  "bench_create_session",
  "Create a new LLM benchmark session. Generates the first round of challenges across selected dimensions.",
  {
    model_id: z.string().describe("LLM identifier, e.g. 'claude-opus-4-20250514'"),
    difficulty: z.enum(DIFFICULTY_LEVELS).default("medium").describe("Challenge difficulty level"),
    dimensions: z
      .array(z.enum(BENCH_DIMENSIONS))
      .optional()
      .describe("Dimensions to test (default: all 6)"),
    seed: z.number().int().optional().describe("Seed for reproducibility"),
  },
  async ({ model_id, difficulty, dimensions, seed }) => {
    const state = createSession(
      model_id,
      difficulty as Difficulty,
      dimensions as BenchDimension[] | undefined,
      seed,
    );

    // Generate first round
    const round = generateNextRound(state, generateChallengeForDimension);
    const sanitized = sanitizeRound(round);

    return jsonResult({
      session_id: state.session.id,
      model_id: state.session.modelId,
      difficulty: state.session.difficulty,
      dimensions: state.session.dimensions,
      round: sanitized,
      total_dimensions: state.dimensionStates.length,
    });
  },
);

// ─── Tool 2: bench_submit_round ──────────────────────────────────────────────

server.tool(
  "bench_submit_round",
  "Submit solutions for the current benchmark round. Evaluates responses, detects conflicts, and advances the session.",
  {
    session_id: z.string().describe("The benchmark session ID"),
    solutions: z
      .array(
        z.object({
          challenge_index: z
            .number()
            .int()
            .min(0)
            .max(2)
            .describe("Index of the challenge in the round"),
          response: z.string().describe("LLM's solution (code, answer, or tool sequence)"),
        }),
      )
      .min(1)
      .describe("Responses for each challenge in the round"),
  },
  async ({ session_id, solutions }) => {
    const state = getSessionState(session_id);
    if (!state) {
      return errorResult("SESSION_NOT_FOUND", `Session ${session_id} not found`);
    }
    if (state.session.status !== "active") {
      return errorResult("SESSION_COMPLETED", `Session is already ${state.session.status}`);
    }

    const responses: ChallengeResponse[] = solutions.map((s) => ({
      challengeIndex: s.challenge_index,
      response: s.response,
    }));

    // Evaluate each response
    const evaluation = evaluateRound(state, responses, (challenge, response) => {
      // Sync evaluators for MCQ, pipeline, extract; async for code-based
      const evalType = challenge.evaluationData.type;
      if (evalType === "mcq") return evaluateToolSelection(challenge, response);
      if (evalType === "pipeline") return evaluateMultiStep(challenge, response);
      if (evalType === "extract") return evaluateContextManagement(challenge, response);

      // Code-based evaluators are async — return placeholder, replaced below
      return {
        dimension: challenge.dimension,
        passed: false,
        score: 0,
        detail: "pending_async",
        conflict: false,
      };
    });

    // Handle async evaluations for code-based dimensions
    const round = state.currentRound;
    if (round) {
      for (let i = 0; i < evaluation.results.length; i++) {
        const result = evaluation.results[i];
        if (result && result.detail === "pending_async") {
          const resp = responses[i];
          const challenge = resp ? round.challenges[resp.challengeIndex] : undefined;
          if (challenge && resp) {
            const asyncResult = await evaluateChallengeResponse(challenge, resp.response);
            evaluation.results[i] = asyncResult;
          }
        }
      }
    }

    // Compute Elo if session is complete
    let eloRating = null;
    if (evaluation.sessionCompleted) {
      const elo = computeAgentElo(
        state.dimensionStates,
        state.rounds.length,
        state.session.conflictCount,
        state.session.difficulty,
      );
      state.session.eloRating = elo.overall;
      eloRating = elo;

      // Update leaderboard
      const totalAttempts = state.dimensionStates.reduce((sum, ds) => sum + ds.attempts, 0);
      updateLeaderboard(
        state.session.modelId,
        elo,
        state.dimensionStates,
        state.rounds.length,
        state.session.conflictCount,
        totalAttempts,
      );
    }

    // Generate next round if session continues
    let nextRound = null;
    if (!evaluation.sessionCompleted) {
      const round = generateNextRound(state, generateChallengeForDimension);
      nextRound = sanitizeRound(round);
    }

    return jsonResult({
      results: evaluation.results,
      conflicts: evaluation.conflicts,
      all_mastered: evaluation.allMastered,
      session_completed: evaluation.sessionCompleted,
      fail_reason: evaluation.failReason,
      mastery_status: state.dimensionStates.map((ds) => ({
        dimension: ds.dimension,
        mastered: ds.mastered,
        correct: ds.correctCount,
        attempts: ds.attempts,
        conflicts: ds.conflicts,
      })),
      elo_rating: eloRating,
      next_round: nextRound,
    });
  },
);

// ─── Tool 3: bench_challenge_debug ───────────────────────────────────────────

server.tool(
  "bench_challenge_debug",
  "Generate a standalone debugging challenge. Returns buggy code with a failing test — the LLM must fix the bug.",
  {
    difficulty: z.enum(DIFFICULTY_LEVELS).default("medium"),
    bug_type: z
      .enum(["off_by_one", "wrong_operator", "missing_edge_case", "type_error", "logic_inversion"])
      .optional()
      .describe("Specific bug type to inject"),
    seed: z.number().int().optional(),
  },
  async ({ difficulty, bug_type, seed }) => {
    const { generateDebuggingChallenge } = await import("../core-logic/evaluators/debugging.js");
    const actualSeed = seed ?? Math.floor(Math.random() * 1_000_000);
    const bugTypeIndex = bug_type
      ? [
          "off_by_one",
          "wrong_operator",
          "missing_edge_case",
          "type_error",
          "logic_inversion",
        ].indexOf(bug_type)
      : 0;

    const challenge = generateDebuggingChallenge(
      bugTypeIndex >= 0 ? bugTypeIndex : 0,
      difficulty as Difficulty,
      actualSeed,
    );

    return jsonResult({
      dimension: challenge.dimension,
      difficulty: challenge.difficulty,
      type: challenge.type,
      prompt: challenge.prompt,
    });
  },
);

// ─── Tool 4: bench_challenge_test_writing ────────────────────────────────────

server.tool(
  "bench_challenge_test_writing",
  "Generate a test-writing challenge. Returns a function — the LLM must write tests that catch hidden mutants.",
  {
    difficulty: z.enum(DIFFICULTY_LEVELS).default("medium"),
    seed: z.number().int().optional(),
  },
  async ({ difficulty, seed }) => {
    const { generateTestWritingChallenge } = await import(
      "../core-logic/evaluators/test-writing.js"
    );
    const actualSeed = seed ?? Math.floor(Math.random() * 1_000_000);
    const challenge = generateTestWritingChallenge(0, difficulty as Difficulty, actualSeed);

    return jsonResult({
      dimension: challenge.dimension,
      difficulty: challenge.difficulty,
      type: challenge.type,
      prompt: challenge.prompt,
    });
  },
);

// ─── Tool 5: bench_challenge_tool_selection ──────────────────────────────────

server.tool(
  "bench_challenge_tool_selection",
  "Generate a tool-selection MCQ. Tests whether the LLM understands MCP tool usage.",
  {
    difficulty: z.enum(DIFFICULTY_LEVELS).default("medium"),
    variant: z.number().int().min(0).default(0).describe("Question variant index"),
  },
  async ({ difficulty, variant }) => {
    const { generateToolSelectionChallenge } = await import(
      "../core-logic/evaluators/tool-selection.js"
    );
    const challenge = generateToolSelectionChallenge(variant, difficulty as Difficulty, 0);

    return jsonResult({
      dimension: challenge.dimension,
      difficulty: challenge.difficulty,
      type: challenge.type,
      prompt: challenge.prompt,
    });
  },
);

// ─── Tool 6: bench_get_report ────────────────────────────────────────────────

server.tool(
  "bench_get_report",
  "Get the full benchmark report for a session. Includes per-dimension mastery, Elo rating, conflicts, and summary.",
  {
    session_id: z.string().describe("The benchmark session ID"),
  },
  async ({ session_id }) => {
    const state = getSessionState(session_id);
    if (!state) {
      return errorResult("SESSION_NOT_FOUND", `Session ${session_id} not found`);
    }

    const elo = computeAgentElo(
      state.dimensionStates,
      state.rounds.length,
      state.session.conflictCount,
      state.session.difficulty,
    );

    const masteredCount = state.dimensionStates.filter((ds) => ds.mastered).length;
    const totalDimensions = state.dimensionStates.length;
    const summary = [
      `Model: ${state.session.modelId}`,
      `Status: ${state.session.status}`,
      `Difficulty: ${state.session.difficulty}`,
      `Rounds: ${state.rounds.length}`,
      `Mastery: ${masteredCount}/${totalDimensions} dimensions`,
      `Conflicts: ${state.session.conflictCount}`,
      `Elo: ${elo.overall} (${elo.percentile}th percentile)`,
    ].join(" | ");

    return jsonResult({
      session: {
        id: state.session.id,
        model_id: state.session.modelId,
        status: state.session.status,
        difficulty: state.session.difficulty,
        rounds_completed: state.rounds.length,
      },
      dimension_states: state.dimensionStates.map((ds) => ({
        dimension: ds.dimension,
        mastered: ds.mastered,
        correct_count: ds.correctCount,
        attempts: ds.attempts,
        conflicts: ds.conflicts,
      })),
      elo_rating: elo,
      conflicts: state.conflicts,
      summary,
    });
  },
);

// ─── Tool 7: bench_leaderboard ───────────────────────────────────────────────

server.tool(
  "bench_leaderboard",
  "Get the benchmark leaderboard showing aggregated model performance across sessions.",
  {
    top_n: z.number().int().min(1).max(50).default(10).describe("Number of entries to return"),
    dimension: z.enum(BENCH_DIMENSIONS).optional().describe("Filter/sort by a specific dimension"),
  },
  async ({ top_n, dimension }) => {
    const entries = getLeaderboard(top_n, dimension as BenchDimension | undefined);

    return jsonResult({
      entries,
      total_models: entries.length,
      sort_by: dimension ?? "avg_elo",
    });
  },
);

// ─── Feedback Tool ───────────────────────────────────────────────────────────

registerFeedbackTool(server, { serviceName: "llm-bench-mcp" });

// ─── Start ───────────────────────────────────────────────────────────────────

await startMcpServer(server);
