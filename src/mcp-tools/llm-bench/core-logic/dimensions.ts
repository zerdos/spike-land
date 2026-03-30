/**
 * Dimensions — wires all 6 evaluators into dimension definitions.
 *
 * Each dimension has a challenge generator and a response evaluator.
 */

import type { BenchChallenge, BenchDimension, ChallengeResult, Difficulty } from "./types.js";
import { generateCodeGenChallenge, evaluateCodeGen } from "./evaluators/code-generation.js";
import { generateDebuggingChallenge, evaluateDebugging } from "./evaluators/debugging.js";
import { generateTestWritingChallenge, evaluateTestWriting } from "./evaluators/test-writing.js";
import {
  generateToolSelectionChallenge,
  evaluateToolSelection,
} from "./evaluators/tool-selection.js";
import { generateMultiStepChallenge, evaluateMultiStep } from "./evaluators/multi-step.js";
import {
  generateContextManagementChallenge,
  evaluateContextManagement,
} from "./evaluators/context-management.js";

// ─── Dimension Registry ─────────────────────────────────────────────────────

export interface DimensionDef {
  dimension: BenchDimension;
  name: string;
  description: string;
  generateChallenge: (variantIndex: number, difficulty: Difficulty, seed: number) => BenchChallenge;
  evaluate: (
    challenge: BenchChallenge,
    response: string,
  ) => ChallengeResult | Promise<ChallengeResult>;
}

export const DIMENSION_DEFS: DimensionDef[] = [
  {
    dimension: "code_generation",
    name: "Code Generation",
    description: "Write correct code from a specification",
    generateChallenge: generateCodeGenChallenge,
    evaluate: evaluateCodeGen,
  },
  {
    dimension: "debugging",
    name: "Debugging",
    description: "Find and fix bugs in code",
    generateChallenge: generateDebuggingChallenge,
    evaluate: evaluateDebugging,
  },
  {
    dimension: "test_writing",
    name: "Test Writing",
    description: "Write tests that catch known bugs in mutants",
    generateChallenge: generateTestWritingChallenge,
    evaluate: evaluateTestWriting,
  },
  {
    dimension: "tool_selection",
    name: "Tool Selection",
    description: "Pick the right MCP tools for a task",
    generateChallenge: generateToolSelectionChallenge,
    evaluate: evaluateToolSelection,
  },
  {
    dimension: "multi_step_reasoning",
    name: "Multi-Step Reasoning",
    description: "Chain multiple operations to solve a problem",
    generateChallenge: generateMultiStepChallenge,
    evaluate: evaluateMultiStep,
  },
  {
    dimension: "context_management",
    name: "Context Management",
    description: "Extract relevant information from noisy context",
    generateChallenge: generateContextManagementChallenge,
    evaluate: evaluateContextManagement,
  },
];

const DIMENSION_MAP = new Map<BenchDimension, DimensionDef>();
for (const def of DIMENSION_DEFS) {
  DIMENSION_MAP.set(def.dimension, def);
}

export function getDimensionDef(dimension: BenchDimension): DimensionDef | undefined {
  return DIMENSION_MAP.get(dimension);
}

/**
 * Generate a challenge for a specific dimension.
 */
export function generateChallengeForDimension(
  dimension: BenchDimension,
  variantIndex: number,
  difficulty: Difficulty,
  seed: number,
): BenchChallenge {
  const def = getDimensionDef(dimension);
  if (!def) throw new Error(`Unknown dimension: ${dimension}`);
  return def.generateChallenge(variantIndex, difficulty, seed);
}

/**
 * Evaluate a response for a specific dimension.
 */
export async function evaluateChallengeResponse(
  challenge: BenchChallenge,
  response: string,
): Promise<ChallengeResult> {
  const def = getDimensionDef(challenge.dimension);
  if (!def) throw new Error(`Unknown dimension: ${challenge.dimension}`);
  return def.evaluate(challenge, response);
}
