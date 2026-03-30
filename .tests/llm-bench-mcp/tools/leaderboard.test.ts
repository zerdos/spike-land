import { describe, it, expect, beforeEach } from "vitest";
import {
  getLeaderboard,
  getModelEntry,
  updateLeaderboard,
  clearLeaderboard,
} from "../../../src/mcp-tools/llm-bench/core-logic/leaderboard.js";
import type {
  AgentEloRating,
  DimensionState,
} from "../../../src/mcp-tools/llm-bench/core-logic/types.js";

function makeDimensionState(dim: string, mastered: boolean): DimensionState {
  return {
    dimension: dim as DimensionState["dimension"],
    correctCount: mastered ? 2 : 0,
    attempts: 3,
    mastered,
    conflicts: 0,
    answerHistory: new Map(),
  };
}

function makeEloRating(overall: number): AgentEloRating {
  return {
    overall,
    perDimension: {},
    percentile: 50,
    correctnessScore: 0.8,
    efficiencyScore: 0.6,
    consistencyScore: 1,
    breadthScore: 0.5,
  };
}

describe("Leaderboard", () => {
  beforeEach(() => {
    clearLeaderboard();
  });

  it("starts empty", () => {
    const entries = getLeaderboard();
    expect(entries).toHaveLength(0);
  });

  it("adds a model after first session", () => {
    const states = [
      makeDimensionState("code_generation", true),
      makeDimensionState("debugging", false),
    ];
    updateLeaderboard("model-a", makeEloRating(1050), states, 3, 0, 6);

    const entry = getModelEntry("model-a");
    expect(entry).toBeDefined();
    expect(entry?.sessionsCompleted).toBe(1);
    expect(entry?.avgElo).toBe(1050);
    expect(entry?.bestElo).toBe(1050);
  });

  it("updates model stats on subsequent sessions", () => {
    const states1 = [makeDimensionState("code_generation", true)];
    const states2 = [makeDimensionState("code_generation", true)];

    updateLeaderboard("model-a", makeEloRating(1000), states1, 3, 0, 3);
    updateLeaderboard("model-a", makeEloRating(1100), states2, 2, 0, 3);

    const entry = getModelEntry("model-a");
    expect(entry?.sessionsCompleted).toBe(2);
    expect(entry?.avgElo).toBe(1050);
    expect(entry?.bestElo).toBe(1100);
  });

  it("sorts by average ELO descending", () => {
    updateLeaderboard("model-b", makeEloRating(900), [], 5, 2, 10);
    updateLeaderboard("model-a", makeEloRating(1200), [], 2, 0, 6);
    updateLeaderboard("model-c", makeEloRating(1050), [], 3, 1, 8);

    const entries = getLeaderboard(10);
    expect(entries[0]?.modelId).toBe("model-a");
    expect(entries[1]?.modelId).toBe("model-c");
    expect(entries[2]?.modelId).toBe("model-b");
  });

  it("respects top_n limit", () => {
    updateLeaderboard("model-a", makeEloRating(1000), [], 3, 0, 3);
    updateLeaderboard("model-b", makeEloRating(1100), [], 3, 0, 3);
    updateLeaderboard("model-c", makeEloRating(1200), [], 3, 0, 3);

    const entries = getLeaderboard(2);
    expect(entries).toHaveLength(2);
  });

  it("filters by dimension when specified", () => {
    const statesA = [makeDimensionState("code_generation", true)];
    const statesB = [makeDimensionState("code_generation", false)];

    updateLeaderboard("model-a", makeEloRating(900), statesA, 3, 0, 3);
    updateLeaderboard("model-b", makeEloRating(1100), statesB, 3, 0, 3);

    const entries = getLeaderboard(10, "code_generation");
    // model-a has mastery rate 1.0 for code_generation, model-b has 0
    expect(entries[0]?.modelId).toBe("model-a");
  });

  it("tracks conflict rate", () => {
    updateLeaderboard("model-a", makeEloRating(1000), [], 3, 2, 10);
    const entry = getModelEntry("model-a");
    expect(entry?.avgConflictRate).toBe(0.2);
  });
});
