/**
 * Tool Selection MCQ Bank — questions about MCP tool usage.
 *
 * Tests whether the LLM understands when and how to use platform tools.
 */

export interface ToolSelectionMCQ {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  difficulty: "easy" | "medium" | "hard";
  concept: string;
}

export const TOOL_SELECTION_MCQS: ToolSelectionMCQ[] = [
  // ─── Easy ───────────────────────────────────────────────────────────────
  {
    question:
      "You need to evaluate whether an LLM-generated function works correctly. Which tool should you use?",
    options: [
      "eval_code — submit code + tests to a sandboxed evaluator",
      "search_tools — search the MCP registry",
      "amplify_tests — generate more test cases",
      "rate_solution — get an Elo rating",
    ],
    correctIndex: 0,
    difficulty: "easy",
    concept: "basic_tool_selection",
  },
  {
    question:
      "You want to generate additional edge case tests from a small test suite. Which tool?",
    options: [
      "generate_challenge — create a new coding problem",
      "amplify_tests — deterministic test amplification",
      "eval_code — run existing tests",
      "eval_report — full pipeline report",
    ],
    correctIndex: 1,
    difficulty: "easy",
    concept: "basic_tool_selection",
  },
  {
    question:
      "You need to create a fresh coding challenge not from any training dataset. Which tool?",
    options: [
      "eval_code — evaluate existing code",
      "rate_solution — compare solutions",
      "generate_challenge — parameterized challenge generation",
      "amplify_tests — generate test cases",
    ],
    correctIndex: 2,
    difficulty: "easy",
    concept: "basic_tool_selection",
  },

  // ─── Medium ─────────────────────────────────────────────────────────────
  {
    question:
      "You need to evaluate code, then expand the test suite, then rate the solution. What is the correct tool sequence?",
    options: [
      "eval_code → amplify_tests → rate_solution",
      "amplify_tests → eval_code → rate_solution",
      "rate_solution → eval_code → amplify_tests",
      "generate_challenge → eval_code → amplify_tests",
    ],
    correctIndex: 0,
    difficulty: "medium",
    concept: "tool_sequencing",
  },
  {
    question:
      "A persona generates a banking function. You want to verify it handles edge cases that the original tests miss. What is the best approach?",
    options: [
      "Run eval_code with the original tests only",
      "Use amplify_tests to expand the test suite, then eval_code with amplified tests",
      "Use generate_challenge to create a new problem",
      "Use rate_solution to check the Elo rating",
    ],
    correctIndex: 1,
    difficulty: "medium",
    concept: "tool_composition",
  },
  {
    question:
      "You suspect a generated solution only works because the test suite is too thin. Which pipeline proves or disproves this?",
    options: [
      "eval_report — orchestrates generate → amplify → eval → rate automatically",
      "eval_code with the same thin tests",
      "rate_solution without additional tests",
      "generate_challenge to change the problem",
    ],
    correctIndex: 0,
    difficulty: "medium",
    concept: "tool_composition",
  },
  {
    question:
      "Two LLMs solve the same challenge differently. You want an intuitive comparison score. Which tool?",
    options: [
      "eval_code — run both against the same tests",
      "amplify_tests — generate more tests for both",
      "rate_solution — Elo rating for head-to-head comparison",
      "generate_challenge — create a harder version",
    ],
    correctIndex: 2,
    difficulty: "medium",
    concept: "tool_selection_advanced",
  },

  // ─── Hard ──────────────────────────────────────────────────────────────
  {
    question:
      "An LLM passes all 5 original tests but you suspect training data contamination. What tool-based strategy best detects this?",
    options: [
      "amplify_tests with high factor → eval_code with amplified tests — contamination shows as failure on novel edge cases",
      "rate_solution — lower Elo indicates contamination",
      "generate_challenge with a new seed — completely fresh problem eliminates contamination",
      "eval_code again — sometimes tests are flaky",
    ],
    correctIndex: 0,
    difficulty: "hard",
    concept: "contamination_detection",
  },
  {
    question:
      "You need to benchmark 10 LLMs on agentic coding ability. Which approach gives the most reliable Elo rankings?",
    options: [
      "Generate 1 hard challenge and compare all solutions",
      "Use eval_report for each model on the same set of seeded challenges, then aggregate Elo ratings",
      "Run rate_solution for random pairs of models",
      "Manually review code quality for each model",
    ],
    correctIndex: 1,
    difficulty: "hard",
    concept: "benchmark_design",
  },
  {
    question:
      "An LLM solves a hard sorting challenge correctly but fails the easy version of the same algorithm. In the Queez model, what happens?",
    options: [
      "Both results are averaged into the score",
      "The hard pass overrides the easy fail",
      "A conflict is detected — mastery is reset for that dimension, signaling unreliable capability",
      "The easy fail is ignored since the hard pass proves competence",
    ],
    correctIndex: 2,
    difficulty: "hard",
    concept: "queez_mechanics",
  },
  {
    question:
      "You want to test whether an LLM can work across files in a repo, not just solve isolated functions. Which existing benchmark inspired the approach for this?",
    options: [
      "HumanEval — canonical function-level benchmark",
      "RepoBench — cross-file retrieval and completion evaluation",
      "MBPP — basic Python programming",
      "CodeElo — competitive programming ranking",
    ],
    correctIndex: 1,
    difficulty: "hard",
    concept: "benchmark_knowledge",
  },
  {
    question:
      "A benchmark session shows 2 conflicts after 4 rounds. What is the session's most likely next state?",
    options: [
      "Immediately fails — 2 conflicts exceeds the threshold",
      "Continues normally — the maximum is 3 conflicts before failure",
      "Resets all mastery progress and starts over",
      "Skips the conflicted dimensions entirely",
    ],
    correctIndex: 1,
    difficulty: "hard",
    concept: "queez_mechanics",
  },
];

/**
 * Get MCQs filtered by difficulty.
 */
export function getMCQsByDifficulty(difficulty: "easy" | "medium" | "hard"): ToolSelectionMCQ[] {
  return TOOL_SELECTION_MCQS.filter((q) => q.difficulty === difficulty);
}

/**
 * Get a specific MCQ by index within a difficulty level.
 */
export function getMCQ(
  difficulty: "easy" | "medium" | "hard",
  variantIndex: number,
): ToolSelectionMCQ | undefined {
  const filtered = getMCQsByDifficulty(difficulty);
  return filtered[variantIndex % filtered.length];
}
