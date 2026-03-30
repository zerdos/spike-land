/**
 * LLM Bench MCP Server — Types & Helpers
 */

export type BenchErrorCode =
  | "SESSION_NOT_FOUND"
  | "SESSION_COMPLETED"
  | "INVALID_RESPONSE"
  | "CHALLENGE_GENERATION_FAILED"
  | "EVALUATION_FAILED"
  | "INTERNAL_ERROR";

export {
  type CallToolResult,
  errorResult,
  jsonResult,
  tryCatch,
} from "@spike-land-ai/mcp-server-base";

// Re-export all types for convenience
export type {
  AgentEloRating,
  BenchChallenge,
  BenchDimension,
  BenchReport,
  BenchRound,
  BenchSession,
  BugType,
  ChallengeResponse,
  ChallengeResult,
  ConflictRecord,
  Difficulty,
  DimensionState,
  LeaderboardEntry,
  TestCase,
} from "../core-logic/types.js";
