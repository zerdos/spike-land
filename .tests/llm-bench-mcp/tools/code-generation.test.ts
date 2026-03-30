import { describe, it, expect } from "vitest";
import {
  generateCodeGenChallenge,
  evaluateCodeGen,
} from "../../../src/mcp-tools/llm-bench/core-logic/evaluators/code-generation.js";

describe("Code Generation Evaluator", () => {
  describe("generateCodeGenChallenge", () => {
    it("generates a code challenge", () => {
      const challenge = generateCodeGenChallenge(0, "easy", 42);
      expect(challenge.dimension).toBe("code_generation");
      expect(challenge.type).toBe("code");
      expect(challenge.prompt).toBeTruthy();
      expect(challenge.evaluationData.type).toBe("code");
    });

    it("uses different categories for different variants", () => {
      const c0 = generateCodeGenChallenge(0, "medium", 42);
      const c1 = generateCodeGenChallenge(1, "medium", 42);
      // Different variants should produce different challenges
      expect(c0.prompt).not.toBe(c1.prompt);
    });

    it("works for all difficulty levels", () => {
      for (const diff of ["easy", "medium", "hard"] as const) {
        const challenge = generateCodeGenChallenge(0, diff, 42);
        expect(challenge.difficulty).toBe(diff);
        expect(challenge.evaluationData.type).toBe("code");
      }
    });
  });

  describe("evaluateCodeGen", () => {
    it("passes when correct solution is submitted", async () => {
      const challenge = generateCodeGenChallenge(0, "easy", 42);
      const evalData = challenge.evaluationData;
      if (evalData.type !== "code") throw new Error("Expected code");

      const result = await evaluateCodeGen(challenge, evalData.referenceSolution);
      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it("fails when empty code is submitted", async () => {
      const challenge = generateCodeGenChallenge(0, "easy", 42);
      const result = await evaluateCodeGen(challenge, "");
      expect(result.passed).toBe(false);
    });

    it("fails when incorrect code is submitted", async () => {
      const challenge = generateCodeGenChallenge(0, "easy", 42);
      const result = await evaluateCodeGen(challenge, "function solution() { return 42; }");
      expect(result.score).toBeLessThan(1);
    });
  });
});
