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
 * Multi-signal scoring: keyword overlap + phrase overlap + anti-stuffing penalties.
 */
function computeAnswerSimilarity(
  response: string,
  correctAnswer: string,
  targetSignal: string,
): number {
  const keywordScore = computeKeywordOverlap(response, correctAnswer, targetSignal);
  const phraseScore = computePhraseOverlap(response, correctAnswer);

  // Length penalty: response must be within 0.3x-3x the length of correctAnswer
  const answerLen = correctAnswer.split(/\s+/).length;
  const responseLen = response.split(/\s+/).length;
  const ratio = answerLen > 0 ? responseLen / answerLen : 1;
  const lengthPenalty = ratio < 0.3 || ratio > 3.0 ? 0.5 : 1.0;

  // Anti-stuffing: penalize responses with >2.5x the unique meaningful words of the answer
  const responseUniqueWords = new Set(normalizeWords(response)).size;
  const answerUniqueWords = new Set(normalizeWords(correctAnswer)).size;
  const stuffingPenalty =
    answerUniqueWords > 0 && responseUniqueWords > answerUniqueWords * 2.5 ? 0.7 : 1.0;

  // Weighted: 50% keywords + 50% phrases, with penalties
  return (keywordScore * 0.5 + phraseScore * 0.5) * lengthPenalty * stuffingPenalty;
}

/** Common stopwords to exclude from scoring. */
const STOPWORDS = new Set([
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

/** Normalize text into meaningful words (lowercase, >2 chars, no stopwords). */
function normalizeWords(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/** Keyword overlap score (original logic, extracted). */
function computeKeywordOverlap(
  response: string,
  correctAnswer: string,
  targetSignal: string,
): number {
  const responseWords = new Set(normalizeWords(response));
  const keyWords = [
    ...new Set([...normalizeWords(correctAnswer), ...normalizeWords(targetSignal)]),
  ];
  if (keyWords.length === 0) return 0;

  let matches = 0;
  for (const word of keyWords) {
    if (responseWords.has(word)) matches++;
  }
  return matches / keyWords.length;
}

/**
 * Phrase overlap: require multi-word phrases from correct answer,
 * not just individual keywords. This defeats keyword stuffing.
 */
function computePhraseOverlap(response: string, correctAnswer: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const responseNorm = normalize(response);
  const answerWords = normalize(correctAnswer)
    .split(/\s+/)
    .filter((w) => w.length > 2);

  // Extract 3-grams from the correct answer
  const trigrams: string[] = [];
  for (let i = 0; i <= answerWords.length - 3; i++) {
    trigrams.push(answerWords.slice(i, i + 3).join(" "));
  }
  if (trigrams.length === 0) return 0;

  let matched = 0;
  for (const trigram of trigrams) {
    if (responseNorm.includes(trigram)) matched++;
  }
  return matched / trigrams.length;
}
