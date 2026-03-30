/**
 * Anti-cheat hardening tests for llm-bench.
 *
 * Verifies: answer leak prevention, seed removal, rate limiting,
 * session limits, keyword-stuffing rejection, tool-dumping rejection.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { evaluateToolSelection } from "../../../src/mcp-tools/llm-bench/core-logic/evaluators/tool-selection.js";
import { evaluateMultiStep } from "../../../src/mcp-tools/llm-bench/core-logic/evaluators/multi-step.js";
import { evaluateContextManagement } from "../../../src/mcp-tools/llm-bench/core-logic/evaluators/context-management.js";
import { createRateLimiter } from "../../../src/mcp-tools/llm-bench/core-logic/rate-limiter.js";
import {
  createSession,
  clearSessions,
  countActiveSessions,
} from "../../../src/mcp-tools/llm-bench/core-logic/session.js";
import type { BenchChallenge } from "../../../src/mcp-tools/llm-bench/core-logic/types.js";

// ─── Answer Leak Prevention ─────────────────────────────────────────────────

describe("answer leak prevention", () => {
  const mcqChallenge: BenchChallenge = {
    dimension: "tool_selection",
    variantIndex: 0,
    difficulty: "medium",
    type: "mcq",
    prompt: "Which tool evaluates code?",
    evaluationData: {
      type: "mcq",
      correctIndex: 1,
      options: ["search_tools", "eval_code", "amplify_tests", "generate_challenge"],
    },
  };

  it("wrong answer detail does NOT contain correct letter or option", () => {
    const result = evaluateToolSelection(mcqChallenge, "A");
    expect(result.passed).toBe(false);
    expect(result.detail).not.toContain("B");
    expect(result.detail).not.toContain("eval_code");
    expect(result.detail).not.toContain("correct was");
    expect(result.detail).toBe("Incorrect. Selected A.");
  });

  it("correct answer detail does NOT leak the answer", () => {
    const result = evaluateToolSelection(mcqChallenge, "B");
    expect(result.passed).toBe(true);
    expect(result.detail).toBe("Correct answer selected.");
    expect(result.detail).not.toContain("eval_code");
  });

  it("multi-step detail does NOT leak tool counts", () => {
    const pipelineChallenge: BenchChallenge = {
      dimension: "multi_step_reasoning",
      variantIndex: 0,
      difficulty: "medium",
      type: "pipeline",
      prompt: "Describe the pipeline",
      evaluationData: {
        type: "pipeline",
        steps: [
          { description: "Generate", expectedTool: "generate_challenge", expectedArgs: {} },
          { description: "Evaluate", expectedTool: "eval_code", expectedArgs: {} },
        ],
        expectedOutcome: "Full evaluation",
      },
    };

    // Submit a wrong answer
    const result = evaluateMultiStep(pipelineChallenge, "I would use search_tools to find stuff.");
    expect(result.detail).not.toMatch(/\d+\/\d+/); // No "X/Y" patterns
    expect(result.detail).not.toContain("expectedTools");
  });
});

// ─── Rate Limiter ───────────────────────────────────────────────────────────

describe("rate limiter", () => {
  it("allows requests up to the limit", () => {
    const limiter = createRateLimiter(3, 60_000);
    expect(limiter.check("model-a")).toBe(true);
    expect(limiter.check("model-a")).toBe(true);
    expect(limiter.check("model-a")).toBe(true);
    expect(limiter.check("model-a")).toBe(false); // 4th blocked
  });

  it("tracks keys independently", () => {
    const limiter = createRateLimiter(2, 60_000);
    expect(limiter.check("model-a")).toBe(true);
    expect(limiter.check("model-a")).toBe(true);
    expect(limiter.check("model-a")).toBe(false);
    expect(limiter.check("model-b")).toBe(true); // different key still OK
  });

  it("reset clears all state", () => {
    const limiter = createRateLimiter(1, 60_000);
    expect(limiter.check("x")).toBe(true);
    expect(limiter.check("x")).toBe(false);
    limiter.reset();
    expect(limiter.check("x")).toBe(true);
  });
});

// ─── Session Limits ─────────────────────────────────────────────────────────

describe("session limits", () => {
  beforeEach(() => clearSessions());

  it("countActiveSessions tracks active sessions per model", () => {
    createSession("model-a", "medium");
    createSession("model-a", "medium");
    createSession("model-b", "medium");

    expect(countActiveSessions("model-a")).toBe(2);
    expect(countActiveSessions("model-b")).toBe(1);
    expect(countActiveSessions("model-c")).toBe(0);
  });
});

// ─── Keyword Stuffing Rejection ─────────────────────────────────────────────

describe("context-management anti-stuffing", () => {
  const contextChallenge: BenchChallenge = {
    dimension: "context_management",
    variantIndex: 0,
    difficulty: "medium",
    type: "extract",
    prompt: "What database change was made?",
    evaluationData: {
      type: "extract",
      fullContext: "...",
      targetSignal: "database migration increased pool size from 10 to 20",
      correctAnswer: "The database pool size was increased from 10 to 20",
    },
  };

  it("keyword-stuffed response scores lower than coherent answer", () => {
    const stuffed = evaluateContextManagement(
      contextChallenge,
      "database pool size increased 10 20 migration config settings deployment scaling infrastructure monitoring observability logging",
    );
    const coherent = evaluateContextManagement(
      contextChallenge,
      "The database pool size was increased from 10 to 20",
    );

    expect(coherent.score).toBeGreaterThan(stuffed.score);
  });

  it("exact correct answer passes", () => {
    const result = evaluateContextManagement(
      contextChallenge,
      "The database pool size was increased from 10 to 20",
    );
    expect(result.passed).toBe(true);
  });
});

// ─── Tool Dumping Rejection ─────────────────────────────────────────────────

describe("multi-step anti-dumping", () => {
  const pipelineChallenge: BenchChallenge = {
    dimension: "multi_step_reasoning",
    variantIndex: 0,
    difficulty: "medium",
    type: "pipeline",
    prompt: "Describe the pipeline",
    evaluationData: {
      type: "pipeline",
      steps: [
        { description: "Generate", expectedTool: "generate_challenge", expectedArgs: {} },
        { description: "Evaluate", expectedTool: "eval_code", expectedArgs: {} },
        { description: "Rate", expectedTool: "rate_solution", expectedArgs: {} },
      ],
      expectedOutcome: "Full evaluation",
    },
  };

  it("single-line tool dump is rejected", () => {
    const result = evaluateMultiStep(
      pipelineChallenge,
      "generate_challenge eval_code amplify_tests rate_solution eval_report",
    );
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0); // All on one line = extractToolMentions returns []
  });

  it("all-tools dump with minimal explanation gets penalized", () => {
    const result = evaluateMultiStep(
      pipelineChallenge,
      "1. generate_challenge\n2. eval_code\n3. amplify_tests\n4. rate_solution\n5. eval_report",
    );
    // Mentions all 5 tools but only 3 expected → dumping penalty applies
    expect(result.score).toBeLessThan(0.7);
  });

  it("proper multi-step explanation still passes", () => {
    const result = evaluateMultiStep(
      pipelineChallenge,
      [
        "1. First, use `generate_challenge` to create a fresh coding challenge with test cases for the user to solve.",
        "2. Then, use `eval_code` to run the user's submitted code against the generated test suite in a sandbox.",
        "3. Finally, use `rate_solution` to compute an ELO-based rating based on correctness and efficiency.",
      ].join("\n"),
    );
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0.6);
  });
});
