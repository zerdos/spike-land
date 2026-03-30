import { describe, it, expect } from "vitest";
import {
  generateMultiStepChallenge,
  evaluateMultiStep,
} from "../../../src/mcp-tools/llm-bench/core-logic/evaluators/multi-step.js";
import { getScenariosByDifficulty } from "../../../src/mcp-tools/llm-bench/challenge-banks/multi-step-pipelines.js";

describe("Multi-Step Evaluator", () => {
  describe("generateMultiStepChallenge", () => {
    it("generates a pipeline challenge", () => {
      const challenge = generateMultiStepChallenge(0, "easy", 42);
      expect(challenge.dimension).toBe("multi_step_reasoning");
      expect(challenge.type).toBe("pipeline");
      expect(challenge.prompt).toContain("Available tools");
    });

    it("generates different challenges for different difficulties", () => {
      const easy = generateMultiStepChallenge(0, "easy", 42);
      const hard = generateMultiStepChallenge(0, "hard", 42);
      expect(easy.prompt).not.toBe(hard.prompt);
    });
  });

  describe("evaluateMultiStep", () => {
    it("passes when all tools mentioned in correct order", () => {
      const challenge = generateMultiStepChallenge(0, "easy", 42);
      const evalData = challenge.evaluationData;
      if (evalData.type !== "pipeline") throw new Error("Expected pipeline");

      // Build response mentioning all expected tools in order
      const response = evalData.steps
        .map((s, i) => `${i + 1}. Use \`${s.expectedTool}\` to ${s.description}`)
        .join("\n");

      const result = evaluateMultiStep(challenge, response);
      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(0.6);
    });

    it("fails when tools are missing", () => {
      const challenge = generateMultiStepChallenge(0, "easy", 42);
      const result = evaluateMultiStep(challenge, "I would just look at the code manually.");
      expect(result.passed).toBe(false);
      expect(result.score).toBeLessThan(0.6);
    });

    it("partially scores when some tools mentioned out of order", () => {
      const challenge = generateMultiStepChallenge(0, "medium", 42);
      const evalData = challenge.evaluationData;
      if (evalData.type !== "pipeline") throw new Error("Expected pipeline");

      // Mention tools in reverse order
      const response = [...evalData.steps]
        .reverse()
        .map((s, i) => `${i + 1}. Use \`${s.expectedTool}\``)
        .join("\n");

      const result = evaluateMultiStep(challenge, response);
      // Should get presence points but not order points
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe("Scenario Bank", () => {
    it("has scenarios for all difficulty levels", () => {
      for (const diff of ["easy", "medium", "hard"] as const) {
        const scenarios = getScenariosByDifficulty(diff);
        expect(scenarios.length).toBeGreaterThan(0);
      }
    });

    it("all scenarios have at least 2 steps", () => {
      for (const diff of ["easy", "medium", "hard"] as const) {
        for (const scenario of getScenariosByDifficulty(diff)) {
          expect(scenario.steps.length).toBeGreaterThanOrEqual(2);
        }
      }
    });
  });
});
