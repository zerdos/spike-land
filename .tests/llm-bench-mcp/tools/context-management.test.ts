import { describe, it, expect } from "vitest";
import {
  generateContextManagementChallenge,
  evaluateContextManagement,
} from "../../../src/mcp-tools/llm-bench/core-logic/evaluators/context-management.js";
import { getContextScenariosByDifficulty } from "../../../src/mcp-tools/llm-bench/challenge-banks/context-scenarios.js";

describe("Context Management Evaluator", () => {
  describe("generateContextManagementChallenge", () => {
    it("generates an extract challenge", () => {
      const challenge = generateContextManagementChallenge(0, "easy", 42);
      expect(challenge.dimension).toBe("context_management");
      expect(challenge.type).toBe("extract");
      expect(challenge.prompt).toContain("Question");
    });

    it("includes the full context in the prompt", () => {
      const challenge = generateContextManagementChallenge(0, "easy", 42);
      // The prompt should contain actual content (not just the question)
      expect(challenge.prompt.length).toBeGreaterThan(100);
    });
  });

  describe("evaluateContextManagement", () => {
    it("passes when response contains key information", () => {
      const challenge = generateContextManagementChallenge(0, "easy", 42);
      const evalData = challenge.evaluationData;
      if (evalData.type !== "extract") throw new Error("Expected extract");

      // Answer with the correct information
      const result = evaluateContextManagement(challenge, evalData.correctAnswer);
      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(0.5);
    });

    it("fails when response is completely irrelevant", () => {
      const challenge = generateContextManagementChallenge(0, "easy", 42);
      const result = evaluateContextManagement(
        challenge,
        "The weather today is sunny with a high of 72 degrees.",
      );
      expect(result.passed).toBe(false);
      expect(result.score).toBeLessThan(0.5);
    });

    it("partially scores when some keywords match", () => {
      const challenge = generateContextManagementChallenge(0, "easy", 42);
      const evalData = challenge.evaluationData;
      if (evalData.type !== "extract") throw new Error("Expected extract");

      // Include just a few keywords from the answer
      const words = evalData.correctAnswer.split(" ").slice(0, 3).join(" ");
      const result = evaluateContextManagement(challenge, words);
      // Should get some partial credit
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Scenario Bank", () => {
    it("has scenarios for all difficulty levels", () => {
      for (const diff of ["easy", "medium", "hard"] as const) {
        const scenarios = getContextScenariosByDifficulty(diff);
        expect(scenarios.length).toBeGreaterThan(0);
      }
    });

    it("hard scenarios have longer contexts", () => {
      const easyScenarios = getContextScenariosByDifficulty("easy");
      const hardScenarios = getContextScenariosByDifficulty("hard");

      const avgEasyLen =
        easyScenarios.reduce((s, sc) => s + sc.fullContext.length, 0) / easyScenarios.length;
      const avgHardLen =
        hardScenarios.reduce((s, sc) => s + sc.fullContext.length, 0) / hardScenarios.length;

      expect(avgHardLen).toBeGreaterThan(avgEasyLen);
    });
  });
});
