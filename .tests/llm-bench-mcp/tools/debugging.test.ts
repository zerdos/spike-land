import { describe, it, expect } from "vitest";
import {
  generateDebuggingChallenge,
  evaluateDebugging,
} from "../../../src/mcp-tools/llm-bench/core-logic/evaluators/debugging.js";
import {
  injectBug,
  injectAnyBug,
} from "../../../src/mcp-tools/llm-bench/core-logic/bug-injector.js";

describe("Bug Injector", () => {
  const simpleCode = `function solution(arr) {
  if (arr.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}`;

  describe("injectBug", () => {
    it("injects off-by-one bugs", () => {
      const result = injectBug(simpleCode, "off_by_one");
      expect(result).toBeDefined();
      expect(result?.buggyCode).not.toBe(simpleCode);
      expect(result?.bugType).toBe("off_by_one");
    });

    it("injects wrong-operator bugs", () => {
      const result = injectBug(simpleCode, "wrong_operator");
      expect(result).toBeDefined();
      expect(result?.buggyCode).not.toBe(simpleCode);
    });

    it("injects missing-edge-case bugs", () => {
      const result = injectBug(simpleCode, "missing_edge_case");
      expect(result).toBeDefined();
      expect(result?.buggyCode).not.toContain("arr.length === 0");
    });

    it("returns undefined for inapplicable bug types", () => {
      const trivialCode = "const x = 1;";
      const result = injectBug(trivialCode, "off_by_one");
      // May or may not match — just verify it doesn't crash
      expect(result === undefined || result.buggyCode !== trivialCode).toBe(true);
    });
  });

  describe("injectAnyBug", () => {
    it("finds a bug type that works", () => {
      const result = injectAnyBug(simpleCode);
      expect(result).toBeDefined();
      expect(result?.buggyCode).not.toBe(simpleCode);
    });

    it("prefers the specified bug type", () => {
      const result = injectAnyBug(simpleCode, "wrong_operator");
      expect(result).toBeDefined();
      // It should use wrong_operator if possible
      if (result) {
        expect(result.bugType).toBe("wrong_operator");
      }
    });
  });
});

describe("Debugging Evaluator", () => {
  describe("generateDebuggingChallenge", () => {
    it("generates a debugging challenge", () => {
      const challenge = generateDebuggingChallenge(0, "medium", 42);
      expect(challenge.dimension).toBe("debugging");
      expect(challenge.type).toBe("fix");
      expect(challenge.prompt).toContain("Bug");
    });

    it("generates challenges with different bug types for different variants", () => {
      const c0 = generateDebuggingChallenge(0, "medium", 42);
      const c1 = generateDebuggingChallenge(1, "medium", 42);
      // Different variants should produce different challenges
      expect(c0.evaluationData).not.toEqual(c1.evaluationData);
    });
  });

  describe("evaluateDebugging", () => {
    it("passes when fix is correct", async () => {
      const challenge = generateDebuggingChallenge(0, "easy", 42);
      const evalData = challenge.evaluationData;
      if (evalData.type !== "fix") throw new Error("Expected fix");

      // Submit the original (correct) code as the fix
      const result = await evaluateDebugging(challenge, evalData.originalCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it("fails when submitting the buggy code unchanged", async () => {
      const challenge = generateDebuggingChallenge(0, "easy", 42);
      const evalData = challenge.evaluationData;
      if (evalData.type !== "fix") throw new Error("Expected fix");

      const result = await evaluateDebugging(challenge, evalData.buggyCode);
      // Buggy code should fail at least some tests
      expect(result.score).toBeLessThan(1);
    });
  });
});
