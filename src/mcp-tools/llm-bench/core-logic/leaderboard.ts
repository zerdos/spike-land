/**
 * Leaderboard — in-memory for now, D1-ready interface.
 *
 * Aggregates model performance across sessions.
 */

import type { AgentEloRating, BenchDimension, DimensionState, LeaderboardEntry } from "./types.js";

// ─── In-Memory Storage ──────────────────────────────────────────────────────

const leaderboard = new Map<string, LeaderboardEntry>();

export function getLeaderboard(topN: number = 10, dimension?: BenchDimension): LeaderboardEntry[] {
  const entries = [...leaderboard.values()];

  if (dimension) {
    // Sort by mastery rate for the specified dimension
    entries.sort((a, b) => {
      const aRate = a.dimensionsMastered[dimension] ?? 0;
      const bRate = b.dimensionsMastered[dimension] ?? 0;
      return bRate - aRate;
    });
  } else {
    // Sort by average Elo (descending)
    entries.sort((a, b) => b.avgElo - a.avgElo);
  }

  return entries.slice(0, topN);
}

export function getModelEntry(modelId: string): LeaderboardEntry | undefined {
  return leaderboard.get(modelId);
}

/**
 * Record that a session was created (for completion rate tracking).
 */
export function recordSessionCreated(modelId: string): void {
  const existing = leaderboard.get(modelId);
  if (existing) {
    existing.sessionsCreated++;
    existing.completionRate =
      existing.sessionsCreated > 0 ? existing.sessionsCompleted / existing.sessionsCreated : 1;
  } else {
    leaderboard.set(modelId, {
      modelId,
      sessionsCompleted: 0,
      sessionsCreated: 1,
      completionRate: 0,
      avgElo: 0,
      bestElo: 0,
      dimensionsMastered: {},
      avgRoundsToComplete: 0,
      avgConflictRate: 0,
      lastSessionAt: Date.now(),
    });
  }
}

/**
 * Update leaderboard after a session completes.
 * Applies completion rate penalty if model abandons >50% of sessions.
 */
export function updateLeaderboard(
  modelId: string,
  eloRating: AgentEloRating,
  dimensionStates: DimensionState[],
  roundsUsed: number,
  conflictCount: number,
  totalAttempts: number,
): void {
  const existing = leaderboard.get(modelId);

  // Completion rate penalty: abandoning >50% of sessions = 15% ELO penalty
  const completionPenalty = (entry: LeaderboardEntry): number =>
    entry.completionRate < 0.5 ? 0.85 : 1.0;

  if (existing) {
    const newSessionCount = existing.sessionsCompleted + 1;
    const rawAvgElo =
      (existing.avgElo * existing.sessionsCompleted + eloRating.overall) / newSessionCount;
    const newBestElo = Math.max(existing.bestElo, eloRating.overall);
    const newAvgRounds =
      (existing.avgRoundsToComplete * existing.sessionsCompleted + roundsUsed) / newSessionCount;
    const conflictRate = totalAttempts > 0 ? conflictCount / totalAttempts : 0;
    const newAvgConflictRate =
      (existing.avgConflictRate * existing.sessionsCompleted + conflictRate) / newSessionCount;
    const newCompletionRate =
      existing.sessionsCreated > 0 ? newSessionCount / existing.sessionsCreated : 1;

    // Merge dimension mastery rates
    const newDimensionsMastered = { ...existing.dimensionsMastered };
    for (const ds of dimensionStates) {
      const prevRate = newDimensionsMastered[ds.dimension] ?? 0;
      const newRate = ds.mastered ? 1 : 0;
      newDimensionsMastered[ds.dimension] =
        (prevRate * existing.sessionsCompleted + newRate) / newSessionCount;
    }

    const entry: LeaderboardEntry = {
      modelId,
      sessionsCompleted: newSessionCount,
      sessionsCreated: existing.sessionsCreated,
      completionRate: Math.round(newCompletionRate * 1000) / 1000,
      avgElo: Math.round(rawAvgElo),
      bestElo: Math.round(newBestElo),
      dimensionsMastered: newDimensionsMastered,
      avgRoundsToComplete: Math.round(newAvgRounds * 10) / 10,
      avgConflictRate: Math.round(newAvgConflictRate * 1000) / 1000,
      lastSessionAt: Date.now(),
    };

    // Apply completion rate penalty
    entry.avgElo = Math.round(entry.avgElo * completionPenalty(entry));

    leaderboard.set(modelId, entry);
  } else {
    const conflictRate = totalAttempts > 0 ? conflictCount / totalAttempts : 0;
    const dimensionsMastered: Partial<Record<BenchDimension, number>> = {};
    for (const ds of dimensionStates) {
      dimensionsMastered[ds.dimension] = ds.mastered ? 1 : 0;
    }

    leaderboard.set(modelId, {
      modelId,
      sessionsCompleted: 1,
      sessionsCreated: 1,
      completionRate: 1,
      avgElo: Math.round(eloRating.overall),
      bestElo: Math.round(eloRating.overall),
      dimensionsMastered,
      avgRoundsToComplete: roundsUsed,
      avgConflictRate: Math.round(conflictRate * 1000) / 1000,
      lastSessionAt: Date.now(),
    });
  }
}

export function clearLeaderboard(): void {
  leaderboard.clear();
}
