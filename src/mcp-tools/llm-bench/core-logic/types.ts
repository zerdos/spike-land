/**
 * LLM Agentic Coding Benchmark ("Queez") — Types
 *
 * Adapts the quiz-engine's adaptive mastery model to benchmark LLMs
 * across 6 agentic coding dimensions.
 */

// ─── Dimensions ─────────────────────────────────────────────────────────────

export const BENCH_DIMENSIONS = [
  "code_generation",
  "debugging",
  "test_writing",
  "tool_selection",
  "multi_step_reasoning",
  "context_management",
] as const;

export type BenchDimension = (typeof BENCH_DIMENSIONS)[number];

export const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTY_LEVELS)[number];

// ─── Session ────────────────────────────────────────────────────────────────

export type SessionStatus = "active" | "completed" | "failed";

export interface BenchSession {
  id: string;
  modelId: string;
  difficulty: Difficulty;
  dimensions: BenchDimension[];
  status: SessionStatus;
  seed: number;
  eloRating: number;
  conflictCount: number;
  createdAt: number;
  completedAt: number | null;
}

// ─── Rounds ─────────────────────────────────────────────────────────────────

export interface BenchChallenge {
  dimension: BenchDimension;
  variantIndex: number;
  difficulty: Difficulty;
  /** Challenge type determines how to evaluate */
  type: "code" | "fix" | "write_tests" | "mcq" | "pipeline" | "extract";
  /** The challenge prompt/description shown to the LLM */
  prompt: string;
  /** Additional data for evaluation (hidden from LLM) */
  evaluationData: ChallengeEvalData;
}

export type ChallengeEvalData =
  | CodeGenEvalData
  | DebuggingEvalData
  | TestWritingEvalData
  | ToolSelectionEvalData
  | MultiStepEvalData
  | ContextManagementEvalData;

export interface CodeGenEvalData {
  type: "code";
  challengeId: string;
  tests: TestCase[];
  referenceSolution: string;
}

export interface DebuggingEvalData {
  type: "fix";
  buggyCode: string;
  originalCode: string;
  tests: TestCase[];
  bugType: BugType;
}

export interface TestWritingEvalData {
  type: "write_tests";
  originalCode: string;
  mutants: Array<{ code: string; bugDescription: string }>;
  functionSignature: string;
}

export interface ToolSelectionEvalData {
  type: "mcq";
  correctIndex: number;
  options: [string, string, string, string];
}

export interface MultiStepEvalData {
  type: "pipeline";
  steps: PipelineStep[];
  expectedOutcome: string;
}

export interface ContextManagementEvalData {
  type: "extract";
  fullContext: string;
  targetSignal: string;
  correctAnswer: string;
}

export interface TestCase {
  name: string;
  input: string;
  expected: string;
}

export interface PipelineStep {
  description: string;
  expectedTool: string;
  expectedArgs: Record<string, unknown>;
}

// ─── Responses ──────────────────────────────────────────────────────────────

export interface ChallengeResponse {
  challengeIndex: number;
  response: string;
}

// ─── Round ──────────────────────────────────────────────────────────────────

export interface BenchRound {
  id: string;
  sessionId: string;
  roundNumber: number;
  challenges: BenchChallenge[];
  responses: ChallengeResponse[] | null;
  results: ChallengeResult[] | null;
  createdAt: number;
}

export interface ChallengeResult {
  dimension: BenchDimension;
  passed: boolean;
  score: number; // 0.0 - 1.0
  detail: string;
  conflict: boolean;
}

// ─── Dimension State ────────────────────────────────────────────────────────

export interface DimensionState {
  dimension: BenchDimension;
  correctCount: number;
  attempts: number;
  mastered: boolean;
  conflicts: number;
  /** variant index → passed boolean */
  answerHistory: Map<number, boolean>;
}

// ─── Conflict ───────────────────────────────────────────────────────────────

export interface ConflictRecord {
  dimension: BenchDimension;
  round: number;
  detail: string;
}

// ─── Bug Types ──────────────────────────────────────────────────────────────

export const BUG_TYPES = [
  "off_by_one",
  "wrong_operator",
  "missing_edge_case",
  "type_error",
  "logic_inversion",
] as const;

export type BugType = (typeof BUG_TYPES)[number];

// ─── ELO ────────────────────────────────────────────────────────────────────

export interface AgentEloRating {
  overall: number;
  perDimension: Partial<Record<BenchDimension, number>>;
  percentile: number;
  correctnessScore: number;
  efficiencyScore: number;
  consistencyScore: number;
  breadthScore: number;
}

// ─── Leaderboard ────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  modelId: string;
  sessionsCompleted: number;
  sessionsCreated: number;
  completionRate: number;
  avgElo: number;
  bestElo: number;
  dimensionsMastered: Partial<Record<BenchDimension, number>>;
  avgRoundsToComplete: number;
  avgConflictRate: number;
  lastSessionAt: number;
}

// ─── Report ─────────────────────────────────────────────────────────────────

export interface BenchReport {
  session: BenchSession;
  dimensionStates: DimensionState[];
  eloRating: AgentEloRating;
  conflicts: ConflictRecord[];
  rounds: BenchRound[];
  summary: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** Correct answers needed across different variants to confirm mastery */
export const MASTERY_THRESHOLD = 2;

/** Maximum challenges per round */
export const CHALLENGES_PER_ROUND = 3;

/** Maximum rounds before forced termination */
export const MAX_ROUNDS = 10;

/** Maximum conflicts before session fails */
export const MAX_CONFLICTS = 3;

/** Base ELO rating for new sessions */
export const BASE_ELO = 1000;
