/**
 * Composite Agent ELO — scoring system for agentic coding benchmarks.
 *
 * Different from code-eval's ELO: weights agent-specific factors
 * like consistency (conflict rate) and breadth (dimensions mastered).
 *
 * Components:
 * - Correctness (50%): Pass rate across challenges
 * - Efficiency (20%): Fewer rounds to mastery
 * - Consistency (20%): Inverse of conflict count
 * - Breadth (10%): Dimensions mastered
 */

import { expectedScore } from "../../../core/shared-utils/core-logic/elo.js";
import type { AgentEloRating, BenchDimension, DimensionState } from "./types.js";
import { BASE_ELO, MAX_ROUNDS } from "./types.js";

// ─── Component Weights ──────────────────────────────────────────────────────

const WEIGHT_CORRECTNESS = 0.5;
const WEIGHT_EFFICIENCY = 0.2;
const WEIGHT_CONSISTENCY = 0.2;
const WEIGHT_BREADTH = 0.1;

// ─── K-Factor ───────────────────────────────────────────────────────────────

const K_FACTOR = 32;

// ─── Difficulty Multipliers ─────────────────────────────────────────────────

const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  easy: 0.8,
  medium: 1.0,
  hard: 1.2,
};

// ─── Component Calculators ──────────────────────────────────────────────────

/**
 * Correctness score: average pass rate across all dimension attempts.
 */
export function computeCorrectnessScore(dimensionStates: DimensionState[]): number {
  if (dimensionStates.length === 0) return 0;

  let totalCorrect = 0;
  let totalAttempts = 0;

  for (const ds of dimensionStates) {
    totalCorrect += ds.correctCount;
    totalAttempts += ds.attempts;
  }

  return totalAttempts > 0 ? totalCorrect / totalAttempts : 0;
}

/**
 * Efficiency score: how quickly mastery was achieved (fewer rounds = higher score).
 */
export function computeEfficiencyScore(roundsUsed: number): number {
  if (roundsUsed <= 0) return 0;
  // Perfect = 1 round, worst = MAX_ROUNDS
  return Math.max(0, 1 - (roundsUsed - 1) / (MAX_ROUNDS - 1));
}

/**
 * Consistency score: inverse of conflict rate.
 */
export function computeConsistencyScore(conflictCount: number, totalAttempts: number): number {
  if (totalAttempts <= 0) return 1;
  const conflictRate = conflictCount / totalAttempts;
  return Math.max(0, 1 - conflictRate * 5); // 20% conflict rate = 0 consistency
}

/**
 * Breadth score: fraction of dimensions mastered.
 */
export function computeBreadthScore(dimensionStates: DimensionState[]): number {
  if (dimensionStates.length === 0) return 0;
  const mastered = dimensionStates.filter((ds) => ds.mastered).length;
  return mastered / dimensionStates.length;
}

// ─── Composite ELO ──────────────────────────────────────────────────────────

/**
 * Compute the composite agent ELO rating.
 */
export function computeAgentElo(
  dimensionStates: DimensionState[],
  roundsUsed: number,
  conflictCount: number,
  difficulty: string,
): AgentEloRating {
  const correctnessScore = computeCorrectnessScore(dimensionStates);
  const efficiencyScore = computeEfficiencyScore(roundsUsed);
  const totalAttempts = dimensionStates.reduce((sum, ds) => sum + ds.attempts, 0);
  const consistencyScore = computeConsistencyScore(conflictCount, totalAttempts);
  const breadthScore = computeBreadthScore(dimensionStates);

  // Weighted composite (0 to 1)
  const composite =
    correctnessScore * WEIGHT_CORRECTNESS +
    efficiencyScore * WEIGHT_EFFICIENCY +
    consistencyScore * WEIGHT_CONSISTENCY +
    breadthScore * WEIGHT_BREADTH;

  // Map composite to Elo delta
  const difficultyMult = DIFFICULTY_MULTIPLIER[difficulty] ?? 1.0;
  const opponent = BASE_ELO; // benchmark difficulty acts as opponent
  const expected = expectedScore(BASE_ELO, opponent);
  const actual = composite;
  const delta = Math.round(K_FACTOR * (actual - expected) * difficultyMult);
  const overall = BASE_ELO + delta;

  // Per-dimension Elo (simpler: direct from pass rate)
  const perDimension: Partial<Record<BenchDimension, number>> = {};
  for (const ds of dimensionStates) {
    const dimPassRate = ds.attempts > 0 ? ds.correctCount / ds.attempts : 0;
    const dimDelta = Math.round(K_FACTOR * (dimPassRate - 0.5) * difficultyMult);
    perDimension[ds.dimension] = BASE_ELO + dimDelta;
  }

  // Percentile estimation (sigmoid curve centered at 1000)
  const percentile = Math.round(100 / (1 + Math.exp(-(overall - 1000) / 100)));

  return {
    overall,
    perDimension,
    percentile,
    correctnessScore: Math.round(correctnessScore * 100) / 100,
    efficiencyScore: Math.round(efficiencyScore * 100) / 100,
    consistencyScore: Math.round(consistencyScore * 100) / 100,
    breadthScore: Math.round(breadthScore * 100) / 100,
  };
}
