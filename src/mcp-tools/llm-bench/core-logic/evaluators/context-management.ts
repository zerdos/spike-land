/**
 * Context Management evaluator — signal-in-noise challenges.
 *
 * Tests: "Can the LLM extract relevant information from noisy context?"
 *
 * Given a large context with planted signals among irrelevant information,
 * the LLM must extract the correct answer.
 */

import { getContextScenario } from "../../challenge-banks/context-scenarios.js";
import type { BenchChallenge, ChallengeResult, Difficulty } from "../types.js";

/**
 * Generate a context_management challenge.
 */
export function generateContextManagementChallenge(
  variantIndex: number,
  difficulty: Difficulty,
  _seed: number,
): BenchChallenge {
  const scenario = getContextScenario(difficulty, variantIndex);

  if (!scenario) {
    return createFallbackContext(variantIndex, difficulty);
  }

  return {
    dimension: "context_management",
    variantIndex,
    difficulty,
    type: "extract",
    prompt: [
      `## Context Analysis: ${scenario.title}`,
      "",
      "Read the following context carefully and answer the question.",
      "",
      "---",
      scenario.fullContext,
      "---",
      "",
      `**Question:** ${scenario.question}`,
      "",
      "Answer concisely with the specific information requested.",
    ].join("\n"),
    evaluationData: {
      type: "extract",
      fullContext: scenario.fullContext,
      targetSignal: scenario.targetSignal,
      correctAnswer: scenario.correctAnswer,
    },
  };
}

function createFallbackContext(variantIndex: number, difficulty: Difficulty): BenchChallenge {
  return {
    dimension: "context_management",
    variantIndex,
    difficulty,
    type: "extract",
    prompt: [
      "## Context Analysis",
      "",
      "Read the following and answer the question.",
      "",
      "---",
      "The project uses React 19, TypeScript 5.8, and Vite 6.",
      "Team size: 5 engineers. Sprint length: 2 weeks.",
      "The deployment pipeline runs on GitHub Actions.",
      "**Important: The database migration on March 15 increased pool size from 10 to 20.**",
      "Coffee machine is broken. Office party next Friday.",
      "---",
      "",
      "**Question:** What database change was made on March 15?",
    ].join("\n"),
    evaluationData: {
      type: "extract",
      fullContext: "...",
      targetSignal: "database migration increased pool size from 10 to 20",
      correctAnswer: "The database pool size was increased from 10 to 20",
    },
  };
}

/**
 * Evaluate a context_management response.
 *
 * Checks if the response contains the key information from the target signal.
 * Uses keyword matching against the correct answer.
 */
export function evaluateContextManagement(
  challenge: BenchChallenge,
  response: string,
): ChallengeResult {
  const evalData = challenge.evaluationData;
  if (evalData.type !== "extract") {
    return {
      dimension: "context_management",
      passed: false,
      score: 0,
      detail: "Wrong eval data type",
      conflict: false,
    };
  }

  const score = computeAnswerSimilarity(response, evalData.correctAnswer, evalData.targetSignal);
  const passed = score >= 0.5;

  return {
    dimension: "context_management",
    passed,
    score,
    detail: passed
      ? `Answer correctly identifies the key information (score: ${Math.round(score * 100)}%)`
      : `Answer missing key information (score: ${Math.round(score * 100)}%)`,
    conflict: false,
  };
}

/**
 * Compute similarity between response and expected answer.
 * Uses keyword overlap with the target signal and correct answer.
 */
function computeAnswerSimilarity(
  response: string,
  correctAnswer: string,
  targetSignal: string,
): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);

  const responseWords = new Set(normalize(response));
  const answerWords = normalize(correctAnswer);
  const signalWords = normalize(targetSignal);

  // Combine answer + signal keywords (deduplicated)
  const keyWords = [...new Set([...answerWords, ...signalWords])];
  if (keyWords.length === 0) return 0;

  // Common stopwords to exclude
  const stopwords = new Set([
    "the",
    "and",
    "was",
    "that",
    "for",
    "with",
    "from",
    "this",
    "are",
    "not",
    "but",
    "has",
    "had",
    "have",
    "been",
    "will",
    "can",
    "which",
    "when",
    "what",
  ]);

  const meaningfulKeys = keyWords.filter((w) => !stopwords.has(w));
  if (meaningfulKeys.length === 0) return 0;

  let matches = 0;
  for (const word of meaningfulKeys) {
    if (responseWords.has(word)) matches++;
  }

  return matches / meaningfulKeys.length;
}
