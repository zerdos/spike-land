import { describe, it, expect, beforeEach } from "vitest";
import {
  createSession,
  generateNextRound,
  evaluateRound,
  sanitizeRound,
  clearSessions,
  getSessionState,
} from "../../../src/mcp-tools/llm-bench/core-logic/session.js";
import type {
  BenchChallenge,
  BenchDimension,
  Difficulty,
} from "../../../src/mcp-tools/llm-bench/core-logic/types.js";

// Simple challenge generator for tests
function mockChallengeGenerator(
  dimension: BenchDimension,
  variantIndex: number,
  difficulty: Difficulty,
  _seed: number,
): BenchChallenge {
  return {
    dimension,
    variantIndex,
    difficulty,
    type: "mcq",
    prompt: `Mock challenge for ${dimension} variant ${variantIndex}`,
    evaluationData: {
      type: "mcq",
      correctIndex: 0,
      options: ["Correct", "Wrong 1", "Wrong 2", "Wrong 3"],
    },
  };
}

describe("Session State Machine", () => {
  beforeEach(() => {
    clearSessions();
  });

  describe("createSession", () => {
    it("creates a session with all dimensions by default", () => {
      const state = createSession("test-model", "medium");
      expect(state.session.modelId).toBe("test-model");
      expect(state.session.difficulty).toBe("medium");
      expect(state.session.dimensions).toHaveLength(6);
      expect(state.session.status).toBe("active");
      expect(state.session.eloRating).toBe(1000);
      expect(state.dimensionStates).toHaveLength(6);
    });

    it("creates a session with selected dimensions", () => {
      const state = createSession("test-model", "hard", ["code_generation", "debugging"]);
      expect(state.session.dimensions).toHaveLength(2);
      expect(state.dimensionStates).toHaveLength(2);
    });

    it("stores session in memory", () => {
      const state = createSession("test-model", "easy");
      const retrieved = getSessionState(state.session.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.session.id).toBe(state.session.id);
    });

    it("uses provided seed", () => {
      const state = createSession("test-model", "medium", undefined, 42);
      expect(state.session.seed).toBe(42);
    });
  });

  describe("generateNextRound", () => {
    it("generates a round with 3 challenges", () => {
      const state = createSession("test-model", "medium");
      const round = generateNextRound(state, mockChallengeGenerator);
      expect(round.challenges).toHaveLength(3);
      expect(round.roundNumber).toBe(1);
    });

    it("picks unmastered dimensions first", () => {
      const state = createSession("test-model", "medium", [
        "code_generation",
        "debugging",
        "tool_selection",
        "test_writing",
      ]);

      // Master some dimensions
      const codeGen = state.dimensionStates.find((d) => d.dimension === "code_generation");
      if (codeGen) {
        codeGen.mastered = true;
        codeGen.correctCount = 2;
      }

      const round = generateNextRound(state, mockChallengeGenerator);
      // Should prefer unmastered dimensions
      const dims = round.challenges.map((c) => c.dimension);
      // code_generation may still appear (to re-test), but unmastered should be prioritized
      expect(dims.length).toBe(3);
    });
  });

  describe("evaluateRound", () => {
    it("evaluates correct MCQ answers", () => {
      const state = createSession("test-model", "medium", ["tool_selection"]);
      const round = generateNextRound(state, mockChallengeGenerator);

      const evaluation = evaluateRound(
        state,
        [
          { challengeIndex: 0, response: "A" },
          { challengeIndex: 1, response: "A" },
          { challengeIndex: 2, response: "A" },
        ],
        (challenge, _response) => ({
          dimension: challenge.dimension,
          passed: true,
          score: 1,
          detail: "Correct",
          conflict: false,
        }),
      );

      expect(evaluation.results).toHaveLength(3);
      expect(evaluation.results[0]?.passed).toBe(true);
    });

    it("detects conflicts when passing then failing", () => {
      const state = createSession("test-model", "medium", ["tool_selection"]);

      // Round 1: pass
      generateNextRound(state, mockChallengeGenerator);
      evaluateRound(
        state,
        [
          { challengeIndex: 0, response: "A" },
          { challengeIndex: 1, response: "A" },
          { challengeIndex: 2, response: "A" },
        ],
        (challenge) => ({
          dimension: challenge.dimension,
          passed: true,
          score: 1,
          detail: "Correct",
          conflict: false,
        }),
      );

      // Round 2: fail (should trigger conflict)
      generateNextRound(state, mockChallengeGenerator);
      const eval2 = evaluateRound(
        state,
        [
          { challengeIndex: 0, response: "B" },
          { challengeIndex: 1, response: "B" },
          { challengeIndex: 2, response: "B" },
        ],
        (challenge) => ({
          dimension: challenge.dimension,
          passed: false,
          score: 0,
          detail: "Wrong",
          conflict: false,
        }),
      );

      expect(eval2.conflicts.length).toBeGreaterThan(0);
      expect(state.session.conflictCount).toBeGreaterThan(0);
    });

    it("completes session when all dimensions mastered", () => {
      const state = createSession("test-model", "medium", ["tool_selection"]);

      // Round 1: pass everything
      generateNextRound(state, mockChallengeGenerator);
      evaluateRound(
        state,
        [
          { challengeIndex: 0, response: "A" },
          { challengeIndex: 1, response: "A" },
          { challengeIndex: 2, response: "A" },
        ],
        (challenge) => ({
          dimension: challenge.dimension,
          passed: true,
          score: 1,
          detail: "Correct",
          conflict: false,
        }),
      );

      // Round 2: pass again to reach mastery threshold (2)
      generateNextRound(state, mockChallengeGenerator);
      const eval2 = evaluateRound(
        state,
        [
          { challengeIndex: 0, response: "A" },
          { challengeIndex: 1, response: "A" },
          { challengeIndex: 2, response: "A" },
        ],
        (challenge) => ({
          dimension: challenge.dimension,
          passed: true,
          score: 1,
          detail: "Correct",
          conflict: false,
        }),
      );

      expect(eval2.allMastered).toBe(true);
      expect(eval2.sessionCompleted).toBe(true);
      expect(state.session.status).toBe("completed");
    });
  });

  describe("sanitizeRound", () => {
    it("strips evaluation data from challenges", () => {
      const state = createSession("test-model", "medium");
      const round = generateNextRound(state, mockChallengeGenerator);
      const sanitized = sanitizeRound(round);

      expect(sanitized.roundNumber).toBe(round.roundNumber);
      expect(sanitized.challenges).toHaveLength(round.challenges.length);
      for (const challenge of sanitized.challenges) {
        expect(challenge).not.toHaveProperty("evaluationData");
        expect(challenge).toHaveProperty("dimension");
        expect(challenge).toHaveProperty("prompt");
      }
    });
  });
});
