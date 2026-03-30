import { describe, it, expect } from "vitest";
import {
  generateToolSelectionChallenge,
  evaluateToolSelection,
} from "../../../src/mcp-tools/llm-bench/core-logic/evaluators/tool-selection.js";
import {
  getMCQ,
  getMCQsByDifficulty,
} from "../../../src/mcp-tools/llm-bench/challenge-banks/tool-selection-mcqs.js";

describe("Tool Selection Evaluator", () => {
  describe("generateToolSelectionChallenge", () => {
    it("generates an MCQ challenge", () => {
      const challenge = generateToolSelectionChallenge(0, "easy", 42);
      expect(challenge.dimension).toBe("tool_selection");
      expect(challenge.type).toBe("mcq");
      expect(challenge.prompt).toContain("A)");
      expect(challenge.prompt).toContain("B)");
      expect(challenge.evaluationData.type).toBe("mcq");
    });

    it("generates different challenges for different variants", () => {
      const c1 = generateToolSelectionChallenge(0, "easy", 42);
      const c2 = generateToolSelectionChallenge(1, "easy", 42);
      expect(c1.prompt).not.toBe(c2.prompt);
    });

    it("generates challenges at all difficulty levels", () => {
      for (const diff of ["easy", "medium", "hard"] as const) {
        const challenge = generateToolSelectionChallenge(0, diff, 42);
        expect(challenge.difficulty).toBe(diff);
      }
    });
  });

  describe("evaluateToolSelection", () => {
    it("accepts correct letter answer", () => {
      const challenge = generateToolSelectionChallenge(0, "easy", 42);
      const evalData = challenge.evaluationData;
      if (evalData.type !== "mcq") throw new Error("Expected MCQ");

      const correctLetter = String.fromCharCode(65 + evalData.correctIndex);
      const result = evaluateToolSelection(challenge, correctLetter);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(1);
    });

    it("rejects wrong letter answer", () => {
      const challenge = generateToolSelectionChallenge(0, "easy", 42);
      const evalData = challenge.evaluationData;
      if (evalData.type !== "mcq") throw new Error("Expected MCQ");

      const wrongIndex = (evalData.correctIndex + 1) % 4;
      const wrongLetter = String.fromCharCode(65 + wrongIndex);
      const result = evaluateToolSelection(challenge, wrongLetter);
      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
    });

    it("parses various answer formats", () => {
      const challenge = generateToolSelectionChallenge(0, "easy", 42);
      const evalData = challenge.evaluationData;
      if (evalData.type !== "mcq") throw new Error("Expected MCQ");

      const correct = String.fromCharCode(65 + evalData.correctIndex);
      const formats = [
        correct,
        `${correct})`,
        `${correct}.`,
        `The answer is ${correct}`,
        `I choose option ${correct}`,
      ];

      for (const format of formats) {
        const result = evaluateToolSelection(challenge, format);
        expect(result.passed).toBe(true);
      }
    });
  });

  describe("MCQ Bank", () => {
    it("has MCQs for all difficulty levels", () => {
      for (const diff of ["easy", "medium", "hard"] as const) {
        const mcqs = getMCQsByDifficulty(diff);
        expect(mcqs.length).toBeGreaterThan(0);
      }
    });

    it("all MCQs have valid correct indices", () => {
      for (const diff of ["easy", "medium", "hard"] as const) {
        for (const mcq of getMCQsByDifficulty(diff)) {
          expect(mcq.correctIndex).toBeGreaterThanOrEqual(0);
          expect(mcq.correctIndex).toBeLessThan(4);
          expect(mcq.options).toHaveLength(4);
        }
      }
    });

    it("getMCQ wraps around variant index", () => {
      const mcq0 = getMCQ("easy", 0);
      const mcq100 = getMCQ("easy", 100);
      // Should wrap around
      expect(mcq0).toBeDefined();
      expect(mcq100).toBeDefined();
    });
  });
});
