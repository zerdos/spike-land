import { describe, it, expect } from "vitest";
import {
  computeAgentElo,
  computeCorrectnessScore,
  computeEfficiencyScore,
  computeConsistencyScore,
  computeBreadthScore,
} from "../../../src/mcp-tools/llm-bench/core-logic/elo.js";
import type { DimensionState } from "../../../src/mcp-tools/llm-bench/core-logic/types.js";

function makeDimensionState(
  dimension: string,
  correctCount: number,
  attempts: number,
  mastered: boolean,
): DimensionState {
  return {
    dimension: dimension as DimensionState["dimension"],
    correctCount,
    attempts,
    mastered,
    conflicts: 0,
    answerHistory: new Map(),
  };
}

describe("Agent ELO", () => {
  describe("computeCorrectnessScore", () => {
    it("returns 0 for no attempts", () => {
      expect(computeCorrectnessScore([])).toBe(0);
    });

    it("returns 1 for perfect score", () => {
      const states = [
        makeDimensionState("code_generation", 3, 3, true),
        makeDimensionState("debugging", 2, 2, true),
      ];
      expect(computeCorrectnessScore(states)).toBe(1);
    });

    it("returns 0.5 for half correct", () => {
      const states = [makeDimensionState("code_generation", 1, 2, false)];
      expect(computeCorrectnessScore(states)).toBe(0.5);
    });
  });

  describe("computeEfficiencyScore", () => {
    it("returns 1 for single round", () => {
      expect(computeEfficiencyScore(1)).toBe(1);
    });

    it("returns 0 for max rounds", () => {
      expect(computeEfficiencyScore(10)).toBe(0);
    });

    it("returns value between 0 and 1", () => {
      const score = computeEfficiencyScore(5);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });
  });

  describe("computeConsistencyScore", () => {
    it("returns 1 for zero conflicts", () => {
      expect(computeConsistencyScore(0, 10)).toBe(1);
    });

    it("returns 0 for high conflict rate", () => {
      expect(computeConsistencyScore(4, 10)).toBe(0);
    });

    it("returns intermediate value for some conflicts", () => {
      const score = computeConsistencyScore(1, 10);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });
  });

  describe("computeBreadthScore", () => {
    it("returns 0 for no dimensions", () => {
      expect(computeBreadthScore([])).toBe(0);
    });

    it("returns 1 when all mastered", () => {
      const states = [
        makeDimensionState("code_generation", 2, 2, true),
        makeDimensionState("debugging", 2, 2, true),
      ];
      expect(computeBreadthScore(states)).toBe(1);
    });

    it("returns 0.5 when half mastered", () => {
      const states = [
        makeDimensionState("code_generation", 2, 2, true),
        makeDimensionState("debugging", 0, 2, false),
      ];
      expect(computeBreadthScore(states)).toBe(0.5);
    });
  });

  describe("computeAgentElo", () => {
    it("returns base ELO for average performance", () => {
      const states = [makeDimensionState("code_generation", 1, 2, false)];
      const elo = computeAgentElo(states, 5, 0, "medium");
      // Should be around 1000
      expect(elo.overall).toBeGreaterThan(900);
      expect(elo.overall).toBeLessThan(1100);
    });

    it("returns higher ELO for excellent performance", () => {
      const states = [
        makeDimensionState("code_generation", 3, 3, true),
        makeDimensionState("debugging", 3, 3, true),
        makeDimensionState("tool_selection", 3, 3, true),
      ];
      const elo = computeAgentElo(states, 1, 0, "hard");
      expect(elo.overall).toBeGreaterThan(1000);
      expect(elo.breadthScore).toBe(1);
      expect(elo.correctnessScore).toBe(1);
    });

    it("penalizes conflicts", () => {
      const states = [makeDimensionState("code_generation", 2, 4, false)];
      const eloClean = computeAgentElo(states, 3, 0, "medium");
      const eloConflicts = computeAgentElo(states, 3, 3, "medium");
      expect(eloConflicts.overall).toBeLessThan(eloClean.overall);
    });

    it("includes per-dimension ratings", () => {
      const states = [
        makeDimensionState("code_generation", 3, 3, true),
        makeDimensionState("debugging", 0, 3, false),
      ];
      const elo = computeAgentElo(states, 3, 0, "medium");
      expect(elo.perDimension.code_generation).toBeGreaterThan(
        elo.perDimension.debugging ?? Infinity,
      );
    });

    it("includes percentile", () => {
      const states = [makeDimensionState("code_generation", 2, 2, true)];
      const elo = computeAgentElo(states, 2, 0, "medium");
      expect(elo.percentile).toBeGreaterThanOrEqual(0);
      expect(elo.percentile).toBeLessThanOrEqual(100);
    });
  });
});
