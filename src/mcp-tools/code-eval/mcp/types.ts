/**
 * Code Eval Arena MCP Server — Types & Helpers
 */

// ─── Test Case ───

export interface TestCase {
  name: string;
  input: string;
  expected: string;
}

// ─── Eval Result ───

export interface TestResult {
  name: string;
  passed: boolean;
  actual: string | undefined;
  expected: string;
  error: string | undefined;
  durationMs: number;
}

export interface EvalResult {
  totalTests: number;
  passed: number;
  failed: number;
  errors: number;
  passRate: number;
  totalDurationMs: number;
  results: TestResult[];
}

// ─── Elo ───

export interface EloRating {
  elo: number;
  percentile: number;
  passRate: number;
  avgExecutionMs: number;
  codeLength: number;
  difficulty: Difficulty;
}

export type Difficulty = "easy" | "medium" | "hard";

// ─── Challenge ───

export type ChallengeCategory =
  | "arrays"
  | "strings"
  | "math"
  | "sorting"
  | "searching"
  | "data-structures"
  | "dynamic-programming";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  functionSignature: string;
  starterCode: string;
  tests: TestCase[];
  referenceSolution: string;
  difficulty: Difficulty;
  category: ChallengeCategory;
}

export interface ChallengeTemplate {
  title: string;
  category: ChallengeCategory;
  difficulties: Difficulty[];
  generate: (difficulty: Difficulty, seed: number) => Challenge;
}

// ─── Report ───

export interface EvalReport {
  challenge: {
    id: string;
    title: string;
    description: string;
    difficulty: Difficulty;
    category: ChallengeCategory;
  };
  originalTestCount: number;
  amplifiedTestCount: number;
  evalResult: EvalResult;
  eloRating: EloRating;
  summary: string;
}

// ─── Sandbox ───

export interface SandboxOptions {
  timeoutMs: number;
  maxOutputBytes: number;
}

export interface SandboxResult {
  value: string;
  error: string | undefined;
  durationMs: number;
  timedOut: boolean;
}

// ─── Error Codes ───

export type CodeEvalErrorCode =
  | "SANDBOX_ERROR"
  | "TIMEOUT"
  | "INVALID_CODE"
  | "INVALID_TESTS"
  | "CHALLENGE_NOT_FOUND"
  | "AMPLIFICATION_FAILED"
  | "INTERNAL_ERROR";

// ─── Result Helpers (re-exported from mcp-server-base) ───

export {
  type CallToolResult,
  errorResult,
  jsonResult,
  tryCatch,
} from "@spike-land-ai/mcp-server-base";
