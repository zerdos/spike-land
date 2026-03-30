/**
 * Tool Selection evaluator — MCQ-based challenges about MCP tool usage.
 *
 * Tests: "Does the LLM pick the right tools in the right order?"
 * Reuses the quiz-engine MCQ format directly.
 */

import { getMCQ } from "../../challenge-banks/tool-selection-mcqs.js";
import type { BenchChallenge, ChallengeResult, Difficulty } from "../types.js";

/**
 * Generate a tool_selection MCQ challenge.
 */
export function generateToolSelectionChallenge(
  variantIndex: number,
  difficulty: Difficulty,
  _seed: number,
): BenchChallenge {
  const mcq = getMCQ(difficulty, variantIndex);

  if (!mcq) {
    // Fallback MCQ
    return {
      dimension: "tool_selection",
      variantIndex,
      difficulty,
      type: "mcq",
      prompt: [
        "## Tool Selection Question",
        "",
        "Which MCP tool evaluates code against a test suite in a sandbox?",
        "",
        "A) search_tools",
        "B) eval_code",
        "C) amplify_tests",
        "D) generate_challenge",
        "",
        "Answer with just the letter (A, B, C, or D).",
      ].join("\n"),
      evaluationData: {
        type: "mcq",
        correctIndex: 1,
        options: ["search_tools", "eval_code", "amplify_tests", "generate_challenge"],
      },
    };
  }

  const labels = ["A", "B", "C", "D"] as const;
  const optionLines = mcq.options.map((opt, i) => `${labels[i]}) ${opt}`);

  return {
    dimension: "tool_selection",
    variantIndex,
    difficulty,
    type: "mcq",
    prompt: [
      "## Tool Selection Question",
      "",
      mcq.question,
      "",
      ...optionLines,
      "",
      "Answer with just the letter (A, B, C, or D).",
    ].join("\n"),
    evaluationData: {
      type: "mcq",
      correctIndex: mcq.correctIndex,
      options: mcq.options,
    },
  };
}

/**
 * Evaluate a tool_selection MCQ response.
 */
export function evaluateToolSelection(
  challenge: BenchChallenge,
  response: string,
): ChallengeResult {
  const evalData = challenge.evaluationData;
  if (evalData.type !== "mcq") {
    return {
      dimension: "tool_selection",
      passed: false,
      score: 0,
      detail: "Wrong eval data type",
      conflict: false,
    };
  }

  const selectedIndex = parseLetterAnswer(response);
  const passed = selectedIndex === evalData.correctIndex;

  const labels = ["A", "B", "C", "D"] as const;
  const correctLabel = labels[evalData.correctIndex] ?? "?";
  const selectedLabel = selectedIndex !== null ? (labels[selectedIndex] ?? "?") : "none";

  return {
    dimension: "tool_selection",
    passed,
    score: passed ? 1 : 0,
    detail: passed
      ? `Correct: ${correctLabel}) ${evalData.options[evalData.correctIndex] ?? ""}`
      : `Wrong: selected ${selectedLabel}, correct was ${correctLabel}) ${evalData.options[evalData.correctIndex] ?? ""}`,
    conflict: false,
  };
}

/**
 * Parse a letter answer (A/B/C/D) from various response formats.
 */
function parseLetterAnswer(response: string): number | null {
  const trimmed = response.trim().toUpperCase();

  // Direct single letter
  if (/^[ABCD]$/.test(trimmed)) {
    return trimmed.charCodeAt(0) - "A".charCodeAt(0);
  }

  // "A)" or "A." format
  const letterMatch = /^([ABCD])[).:\s]/.exec(trimmed);
  if (letterMatch?.[1]) {
    return letterMatch[1].charCodeAt(0) - "A".charCodeAt(0);
  }

  // Contains "answer is A" or "option A" or "choose A"
  const phraseMatch = /(?:answer|option|choose|select|pick)\s*(?:is\s*)?([ABCD])/i.exec(response);
  if (phraseMatch?.[1]) {
    return phraseMatch[1].toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
  }

  // Last resort: find any standalone A/B/C/D
  const anyMatch = /\b([ABCD])\b/.exec(trimmed);
  if (anyMatch?.[1]) {
    return anyMatch[1].charCodeAt(0) - "A".charCodeAt(0);
  }

  return null;
}
