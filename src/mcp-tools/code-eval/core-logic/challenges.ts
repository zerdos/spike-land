/**
 * generate_challenge tool — parameterized challenge generation.
 *
 * Fresh problems from templates, not from any training dataset.
 * Seed-based reproducibility for consistent testing.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Challenge, ChallengeCategory, ChallengeTemplate, Difficulty } from "../mcp/types.js";
import { errorResult, jsonResult } from "../mcp/types.js";
import { arrayTemplates } from "./challenge-templates/arrays.js";
import { dataStructureTemplates } from "./challenge-templates/data-structures.js";
import { mathTemplates } from "./challenge-templates/math.js";
import { sortingTemplates } from "./challenge-templates/sorting.js";
import { stringTemplates } from "./challenge-templates/strings.js";

// ─── Template Registry ───────────────────────────────────────────────────────

const ALL_TEMPLATES: ChallengeTemplate[] = [
  ...arrayTemplates,
  ...stringTemplates,
  ...mathTemplates,
  ...sortingTemplates,
  ...dataStructureTemplates,
];

const TEMPLATES_BY_CATEGORY = new Map<ChallengeCategory, ChallengeTemplate[]>();
for (const template of ALL_TEMPLATES) {
  const existing = TEMPLATES_BY_CATEGORY.get(template.category) ?? [];
  existing.push(template);
  TEMPLATES_BY_CATEGORY.set(template.category, existing);
}

/**
 * Get all available templates, optionally filtered by category and difficulty.
 */
export function getTemplates(
  category?: ChallengeCategory,
  difficulty?: Difficulty,
): ChallengeTemplate[] {
  let templates =
    category !== undefined ? (TEMPLATES_BY_CATEGORY.get(category) ?? []) : ALL_TEMPLATES;

  if (difficulty !== undefined) {
    templates = templates.filter((t) => t.difficulties.includes(difficulty));
  }

  return templates;
}

/**
 * Generate a challenge from a template using a seed for reproducibility.
 */
export function generateChallenge(
  difficulty: Difficulty,
  category?: ChallengeCategory,
  seed?: number,
): Challenge | undefined {
  const actualSeed = seed ?? Math.floor(Math.random() * 1_000_000);
  const templates = getTemplates(category, difficulty);

  if (templates.length === 0) return undefined;

  // Select template deterministically from seed
  const templateIndex = actualSeed % templates.length;
  const template = templates[templateIndex] as (typeof templates)[number];

  return template.generate(difficulty, actualSeed);
}

/**
 * Get a challenge by ID (re-generate from the encoded parameters).
 */
export function getChallengeById(id: string): Challenge | undefined {
  // ID format: `{category}-{name}-{difficulty}-{seed}`
  const parts = id.split("-");
  if (parts.length < 3) return undefined;

  const seed = parseInt(parts[parts.length - 1] ?? "", 10);
  const difficulty = parts[parts.length - 2] as Difficulty;

  if (isNaN(seed) || !["easy", "medium", "hard"].includes(difficulty)) {
    return undefined;
  }

  // Find the template that generates this ID
  for (const template of ALL_TEMPLATES) {
    if (template.difficulties.includes(difficulty)) {
      const candidate = template.generate(difficulty, seed);
      if (candidate.id === id) return candidate;
    }
  }

  return undefined;
}

/**
 * List all available challenge categories with template counts.
 */
export function listCategories(): Array<{
  category: ChallengeCategory;
  count: number;
  difficulties: Difficulty[];
}> {
  const result: Array<{ category: ChallengeCategory; count: number; difficulties: Difficulty[] }> =
    [];

  for (const [category, templates] of TEMPLATES_BY_CATEGORY) {
    const allDifficulties = new Set<Difficulty>();
    for (const t of templates) {
      for (const d of t.difficulties) allDifficulties.add(d);
    }
    result.push({
      category,
      count: templates.length,
      difficulties: [...allDifficulties],
    });
  }

  return result;
}

// ─── MCP Tool Registration ──────────────────────────────────────────────────

const GenerateChallengeSchema = {
  difficulty: z
    .enum(["easy", "medium", "hard"])
    .default("medium")
    .describe("Problem difficulty level"),
  category: z
    .enum([
      "arrays",
      "strings",
      "math",
      "sorting",
      "searching",
      "data-structures",
      "dynamic-programming",
    ])
    .optional()
    .describe("Problem category (omit for random)"),
  seed: z.number().int().optional().describe("Random seed for reproducibility"),
};

export function registerGenerateChallengeTool(server: McpServer): void {
  server.tool(
    "generate_challenge",
    "Generate a coding challenge with test suite at a specified difficulty level. Returns fresh problems from parameterized templates, not from any training dataset. Use seed for reproducible results.",
    GenerateChallengeSchema,
    async ({ difficulty, category, seed }) => {
      const challenge = generateChallenge(
        difficulty as Difficulty,
        category as ChallengeCategory | undefined,
        seed,
      );

      if (challenge === undefined) {
        return errorResult(
          "CHALLENGE_NOT_FOUND",
          `No templates available for difficulty=${difficulty}${category !== undefined ? ` category=${category}` : ""}`,
        );
      }

      // Return challenge without the reference solution (that would be cheating)
      return jsonResult({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        functionSignature: challenge.functionSignature,
        starterCode: challenge.starterCode,
        tests: challenge.tests,
        difficulty: challenge.difficulty,
        category: challenge.category,
        availableCategories: listCategories(),
      });
    },
  );
}
