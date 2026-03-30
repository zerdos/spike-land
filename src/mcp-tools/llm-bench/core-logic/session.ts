/**
 * Session State Machine — adapted from quiz-engine's adaptive mastery model.
 *
 * State flow:
 *   CREATED → ROUND_ACTIVE → EVALUATING → ROUND_COMPLETE
 *     → all_mastered → COMPLETED
 *     → next_round   → ROUND_ACTIVE
 *     → max_conflicts → FAILED
 *     → max_rounds    → COMPLETED (partial)
 */

import type {
  BenchChallenge,
  BenchDimension,
  BenchRound,
  BenchSession,
  ChallengeResponse,
  ChallengeResult,
  ConflictRecord,
  DimensionState,
} from "./types.js";
import {
  BASE_ELO,
  BENCH_DIMENSIONS,
  CHALLENGES_PER_ROUND,
  MASTERY_THRESHOLD,
  MAX_CONFLICTS,
  MAX_ROUNDS,
} from "./types.js";

// ─── In-Memory Storage (D1 adapter layer can wrap this) ─────────────────────

const sessions = new Map<string, SessionState>();

export interface SessionState {
  session: BenchSession;
  dimensionStates: DimensionState[];
  rounds: BenchRound[];
  conflicts: ConflictRecord[];
  currentRound: BenchRound | null;
}

export function getSessionState(id: string): SessionState | undefined {
  return sessions.get(id);
}

export function setSessionState(id: string, state: SessionState): void {
  sessions.set(id, state);
}

export function clearSessions(): void {
  sessions.clear();
}

// ─── Session Creation ───────────────────────────────────────────────────────

let idCounter = 0;

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${++idCounter}`;
}

export function createSession(
  modelId: string,
  difficulty: "easy" | "medium" | "hard",
  dimensions?: BenchDimension[],
  seed?: number,
): SessionState {
  const actualDimensions = dimensions ?? [...BENCH_DIMENSIONS];
  const actualSeed = seed ?? Math.floor(Math.random() * 1_000_000);

  const session: BenchSession = {
    id: generateId("bench"),
    modelId,
    difficulty,
    dimensions: actualDimensions,
    status: "active",
    seed: actualSeed,
    eloRating: BASE_ELO,
    conflictCount: 0,
    createdAt: Date.now(),
    completedAt: null,
  };

  const dimensionStates: DimensionState[] = actualDimensions.map((dim) => ({
    dimension: dim,
    correctCount: 0,
    attempts: 0,
    mastered: false,
    conflicts: 0,
    answerHistory: new Map(),
  }));

  const state: SessionState = {
    session,
    dimensionStates,
    rounds: [],
    conflicts: [],
    currentRound: null,
  };

  sessions.set(session.id, state);
  return state;
}

// ─── Round Generation ───────────────────────────────────────────────────────

/**
 * Generate the next round of challenges.
 * Picks unmastered dimensions first, then re-tests mastered ones.
 * Selects unused variants for each dimension.
 */
export function generateNextRound(
  state: SessionState,
  challengeGenerator: (
    dimension: BenchDimension,
    variantIndex: number,
    difficulty: "easy" | "medium" | "hard",
    seed: number,
  ) => BenchChallenge,
): BenchRound {
  const roundNumber = state.rounds.length + 1;
  const { session, dimensionStates } = state;

  // Pick unmastered dimensions first
  const unmastered = dimensionStates.filter((ds) => !ds.mastered);
  const mastered = dimensionStates.filter((ds) => ds.mastered);

  // Deterministic shuffle using session seed + round number
  const shuffled = [...unmastered];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.abs((session.seed * 31 + roundNumber * 17 + i * 7) % (i + 1));
    const tmp = shuffled[i];
    const swapItem = shuffled[j];
    if (tmp && swapItem) {
      shuffled[i] = swapItem;
      shuffled[j] = tmp;
    }
  }

  // Select up to CHALLENGES_PER_ROUND dimensions
  const selected: DimensionState[] = [];
  for (const ds of shuffled) {
    if (selected.length >= CHALLENGES_PER_ROUND) break;
    selected.push(ds);
  }

  // Fill remaining slots with mastered dimensions (re-test for consistency)
  for (const ds of mastered) {
    if (selected.length >= CHALLENGES_PER_ROUND) break;
    selected.push(ds);
  }

  // If still not enough, cycle through all dimensions
  while (selected.length < CHALLENGES_PER_ROUND && dimensionStates.length > 0) {
    const idx = selected.length % dimensionStates.length;
    const ds = dimensionStates[idx];
    if (ds) selected.push(ds);
  }

  // Generate challenges
  const challenges: BenchChallenge[] = selected.map((ds) => {
    // Pick a variant not yet used
    const usedVariants = new Set(ds.answerHistory.keys());
    let variantIndex = 0;
    for (let v = 0; v < 10; v++) {
      if (!usedVariants.has(v)) {
        variantIndex = v;
        break;
      }
    }
    if (usedVariants.size >= 10) {
      variantIndex = ds.attempts % 10;
    }

    const challengeSeed = session.seed * 1000 + roundNumber * 100 + variantIndex;
    return challengeGenerator(ds.dimension, variantIndex, session.difficulty, challengeSeed);
  });

  const round: BenchRound = {
    id: generateId("round"),
    sessionId: session.id,
    roundNumber,
    challenges,
    responses: null,
    results: null,
    createdAt: Date.now(),
  };

  state.currentRound = round;
  state.rounds.push(round);

  return round;
}

// ─── Response Evaluation ────────────────────────────────────────────────────

export interface RoundEvaluation {
  results: ChallengeResult[];
  conflicts: ConflictRecord[];
  allMastered: boolean;
  sessionCompleted: boolean;
  failReason: string | null;
}

/**
 * Evaluate responses for the current round.
 * Detects conflicts (pass hard, fail easy = inconsistency), updates mastery.
 */
export function evaluateRound(
  state: SessionState,
  responses: ChallengeResponse[],
  evaluator: (challenge: BenchChallenge, response: string) => ChallengeResult,
): RoundEvaluation {
  const round = state.currentRound;
  if (!round) throw new Error("No active round");

  const results: ChallengeResult[] = [];
  const newConflicts: ConflictRecord[] = [];

  for (const resp of responses) {
    const challenge = round.challenges[resp.challengeIndex];
    if (!challenge) continue;

    const result = evaluator(challenge, resp.response);
    results.push(result);

    // Find dimension state
    const ds = state.dimensionStates.find((d) => d.dimension === challenge.dimension);
    if (!ds) continue;

    // Conflict detection: previously passed a variant but now failed
    if (!result.passed && ds.answerHistory.size > 0) {
      for (const [prevVariant, prevPassed] of ds.answerHistory) {
        if (prevPassed) {
          const conflict: ConflictRecord = {
            dimension: challenge.dimension,
            round: round.roundNumber,
            detail: `Previously passed variant ${prevVariant}, now failed variant ${challenge.variantIndex}`,
          };
          newConflicts.push(conflict);
          state.conflicts.push(conflict);
          ds.conflicts++;
          state.session.conflictCount++;

          // Reset mastery
          ds.correctCount = 0;
          ds.mastered = false;
          result.conflict = true;
          break;
        }
      }
    }

    // Record answer
    ds.answerHistory.set(challenge.variantIndex, result.passed);
    ds.attempts++;

    if (result.passed && !result.conflict) {
      ds.correctCount++;
      if (ds.correctCount >= MASTERY_THRESHOLD) {
        ds.mastered = true;
      }
    }
  }

  // Update round
  round.responses = responses;
  round.results = results;

  // Check termination conditions
  const allMastered = state.dimensionStates.every((ds) => ds.mastered);
  let failReason: string | null = null;

  if (state.session.conflictCount >= MAX_CONFLICTS) {
    failReason = `Too many conflicts (${state.session.conflictCount}/${MAX_CONFLICTS})`;
    state.session.status = "failed";
    state.session.completedAt = Date.now();
  } else if (allMastered) {
    state.session.status = "completed";
    state.session.completedAt = Date.now();
  } else if (state.rounds.length >= MAX_ROUNDS) {
    state.session.status = "completed";
    state.session.completedAt = Date.now();
  }

  const sessionCompleted = state.session.status !== "active";

  return {
    results,
    conflicts: newConflicts,
    allMastered,
    sessionCompleted,
    failReason,
  };
}

// ─── Sanitization ───────────────────────────────────────────────────────────

/** Strip evaluation data from challenges before sending to LLM */
export function sanitizeRound(round: BenchRound): {
  roundNumber: number;
  challenges: Array<{
    dimension: BenchDimension;
    type: string;
    prompt: string;
  }>;
} {
  return {
    roundNumber: round.roundNumber,
    challenges: round.challenges.map((c) => ({
      dimension: c.dimension,
      type: c.type,
      prompt: c.prompt,
    })),
  };
}
