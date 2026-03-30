/**
 * Multi-Step Reasoning evaluator — pipeline challenges.
 *
 * Tests: "Can the LLM chain multiple operations to solve a multi-step problem?"
 *
 * The LLM must describe which tools to use and in what order.
 * Evaluation checks tool sequence correctness.
 */

import { getScenario } from "../../challenge-banks/multi-step-pipelines.js";
import type { BenchChallenge, ChallengeResult, Difficulty, PipelineStep } from "../types.js";

/**
 * Generate a multi_step_reasoning challenge.
 */
export function generateMultiStepChallenge(
  variantIndex: number,
  difficulty: Difficulty,
  _seed: number,
): BenchChallenge {
  const scenario = getScenario(difficulty, variantIndex);

  if (!scenario) {
    return createFallbackMultiStep(variantIndex, difficulty);
  }

  const stepsDescription = scenario.steps
    .map((step, i) => `${i + 1}. ${step.description}`)
    .join("\n");

  return {
    dimension: "multi_step_reasoning",
    variantIndex,
    difficulty,
    type: "pipeline",
    prompt: [
      `## Multi-Step Challenge: ${scenario.title}`,
      "",
      scenario.description,
      "",
      "**Available tools:** eval_code, amplify_tests, generate_challenge, rate_solution, eval_report",
      "",
      "Describe the exact sequence of tool calls needed to accomplish this task.",
      "For each step, specify: (1) the tool name, (2) what you'd pass as arguments, (3) how the output feeds into the next step.",
      "",
      "Format your answer as a numbered list with tool names in backticks.",
    ].join("\n"),
    evaluationData: {
      type: "pipeline",
      steps: scenario.steps,
      expectedOutcome: scenario.expectedOutcome,
    },
  };
}

function createFallbackMultiStep(variantIndex: number, difficulty: Difficulty): BenchChallenge {
  return {
    dimension: "multi_step_reasoning",
    variantIndex,
    difficulty,
    type: "pipeline",
    prompt: [
      "## Multi-Step Challenge: Generate, Evaluate, Rate",
      "",
      "A user wants to benchmark their code solution. Describe the pipeline:",
      "1. Generate a fresh coding challenge",
      "2. Evaluate the user's code against the challenge tests",
      "3. Rate the solution",
      "",
      "**Available tools:** eval_code, amplify_tests, generate_challenge, rate_solution, eval_report",
      "",
      "Describe each step with the tool name and how data flows between steps.",
    ].join("\n"),
    evaluationData: {
      type: "pipeline",
      steps: [
        {
          description: "Generate a challenge",
          expectedTool: "generate_challenge",
          expectedArgs: {},
        },
        { description: "Evaluate code", expectedTool: "eval_code", expectedArgs: {} },
        { description: "Rate solution", expectedTool: "rate_solution", expectedArgs: {} },
      ],
      expectedOutcome: "Structured evaluation with Elo rating",
    },
  };
}

/**
 * Evaluate a multi-step reasoning response.
 *
 * Checks if the LLM mentions the correct tools in the correct order.
 */
export function evaluateMultiStep(challenge: BenchChallenge, response: string): ChallengeResult {
  const evalData = challenge.evaluationData;
  if (evalData.type !== "pipeline") {
    return {
      dimension: "multi_step_reasoning",
      passed: false,
      score: 0,
      detail: "Wrong eval data type",
      conflict: false,
    };
  }

  const mentionedTools = extractToolMentions(response);
  const expectedTools = evalData.steps.map((s) => s.expectedTool);

  // Check tool presence (order-aware)
  let matchedInOrder = 0;
  let toolIdx = 0;

  for (const mentioned of mentionedTools) {
    if (toolIdx < expectedTools.length && mentioned === expectedTools[toolIdx]) {
      matchedInOrder++;
      toolIdx++;
    }
  }

  // Also check if all expected tools are mentioned (regardless of order)
  const expectedSet = new Set(expectedTools);
  const mentionedSet = new Set(mentionedTools);
  let toolsPresent = 0;
  for (const tool of expectedSet) {
    if (mentionedSet.has(tool)) toolsPresent++;
  }

  const orderScore = expectedTools.length > 0 ? matchedInOrder / expectedTools.length : 0;
  const presenceScore = expectedSet.size > 0 ? toolsPresent / expectedSet.size : 0;

  // Anti-dumping: if agent mentions ALL known tools but only N expected, penalize
  const knownTools = [
    "eval_code",
    "amplify_tests",
    "generate_challenge",
    "rate_solution",
    "eval_report",
  ];
  const allToolsMentioned = knownTools.every((t) => mentionedSet.has(t));
  const dumpingPenalty =
    allToolsMentioned && mentionedTools.length > expectedTools.length + 1 ? 0.6 : 1.0;

  // Minimum explanation check: require substantive descriptions, not just tool names
  const explanationPenalty = hasMinimalExplanation(response, expectedTools.length) ? 1.0 : 0.6;

  // Weighted: 60% correct order, 40% tools present, with anti-cheat penalties
  const rawScore = orderScore * 0.6 + presenceScore * 0.4;
  const score = rawScore * dumpingPenalty * explanationPenalty;
  const passed = score >= 0.6;

  const pct = Math.round(score * 100);
  return {
    dimension: "multi_step_reasoning",
    passed,
    score,
    detail: passed
      ? "Pipeline sequence correctly identified."
      : `Pipeline incomplete (score: ${pct}%).`,
    conflict: false,
  };
}

/**
 * Check if the response has minimal substantive explanation (not just tool names).
 */
function hasMinimalExplanation(response: string, expectedStepCount: number): boolean {
  const lines = response.split("\n").filter((l) => l.trim().length > 0);
  // Require at least as many non-empty lines as expected steps
  if (lines.length < expectedStepCount) return false;
  // Require average line length > 20 chars (not just tool names)
  const avgLen = lines.reduce((sum, l) => sum + l.trim().length, 0) / lines.length;
  return avgLen > 20;
}

/**
 * Extract tool names mentioned in the response.
 * Rejects single-line tool dumps (all tools on one line).
 */
function extractToolMentions(response: string): string[] {
  const knownTools = [
    "eval_code",
    "amplify_tests",
    "generate_challenge",
    "rate_solution",
    "eval_report",
  ];

  const mentions: Array<{ tool: string; lineIndex: number }> = [];
  const lines = response.split("\n");

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx]!;
    for (const tool of knownTools) {
      if (line.includes(tool) && !mentions.some((m) => m.tool === tool)) {
        mentions.push({ tool, lineIndex: lineIdx });
      }
    }
  }

  // If no tools found by exact match, try backtick patterns
  if (mentions.length === 0) {
    const backtickMatches = response.matchAll(/`(\w+)`/g);
    for (const match of backtickMatches) {
      const tool = match[1];
      if (tool && knownTools.includes(tool) && !mentions.some((m) => m.tool === tool)) {
        mentions.push({ tool, lineIndex: -1 });
      }
    }
  }

  // Anti-dump: if multiple tools all on the same line, reject
  if (mentions.length > 1) {
    const uniqueLines = new Set(mentions.map((m) => m.lineIndex));
    if (uniqueLines.size === 1) return [];
  }

  return mentions.map((m) => m.tool);
}
