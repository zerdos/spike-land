/**
 * Queez — Quiz-Style Planning Interview for a Specific spike.land App
 *
 * Parallel to BAZDMEG's planning_interview_* tools, but parameterized by a
 * codespace (app slug). Fetches the target app's metadata from the mcpApps
 * table, derives a PlanningAppContext, and grounds the Gemini-generated
 * concepts in that app's tools/category/tagline/tags.
 *
 * Shares the quizSessions D1 table with BAZDMEG — session IDs are UUIDs so
 * the two can coexist without collision. A "kind" discriminator column may
 * be added later for analytics; not required for correctness.
 *
 * Six concepts tested (same as BAZDMEG): file_awareness, test_strategy,
 * edge_cases, dependency_chain, failure_modes, verification.
 */

import { z } from "zod";
import { eq } from "drizzle-orm";
import type { ToolRegistry } from "../../lazy-imports/registry";
import { freeTool, jsonResult } from "../../lazy-imports/procedures-index.ts";
import type { DrizzleDB } from "../../db/db/db-index.ts";
import { mcpApps, quizSessions } from "../../db/db/schema.ts";
import type { ToolRegistrationEnv } from "../mcp/manifest";
import {
  type BadgePayload,
  type PlanningAppContext,
  type QuizSession,
  QUESTIONS_PER_ROUND,
  computeScore,
  createQuizSession,
  evaluateAnswers,
  generateBadgeToken,
  generateNextRound,
  generatePlanningConcepts,
  sanitizeRound,
} from "../lib/quiz-engine";

const MAX_CONTRADICTIONS = 3;

// ── Session persistence helpers ─────────────────────────────────────────────
// Intentionally duplicated from bazdmeg/workflow.ts. If a third caller appears,
// extract into a shared module (core-logic/lib/quiz-session-db.ts).

function serializeSession(session: QuizSession): string {
  return JSON.stringify(session, (_key, value) => {
    if (value instanceof Map) {
      return { __type: "Map", entries: [...value.entries()] };
    }
    return value;
  });
}

function deserializeSession(json: string): QuizSession {
  return JSON.parse(json, (_key, value) => {
    if (value && typeof value === "object" && value.__type === "Map") {
      return new Map(value.entries);
    }
    return value;
  }) as QuizSession;
}

async function getSessionFromDb(db: DrizzleDB, id: string): Promise<QuizSession | undefined> {
  const rows = await db.select().from(quizSessions).where(eq(quizSessions.id, id)).limit(1);
  const row = rows[0];
  if (!row) return undefined;
  return deserializeSession(row.data);
}

async function saveSessionToDb(
  db: DrizzleDB,
  id: string,
  userId: string,
  session: QuizSession,
): Promise<void> {
  const now = Date.now();
  const data = serializeSession(session);
  const existing = await db
    .select({ id: quizSessions.id })
    .from(quizSessions)
    .where(eq(quizSessions.id, id))
    .limit(1);
  if (existing.length > 0) {
    await db.update(quizSessions).set({ data, updatedAt: now }).where(eq(quizSessions.id, id));
  } else {
    await db.insert(quizSessions).values({
      id,
      userId,
      data,
      createdAt: now,
      updatedAt: now,
    });
  }
}

// ── App context lookup ──────────────────────────────────────────────────────

/**
 * Loads app metadata from mcpApps and shapes it into a PlanningAppContext.
 * Returns undefined if the app does not exist (caller decides how to respond).
 * Exported for unit testing.
 */
export async function loadAppContext(
  db: DrizzleDB,
  slug: string,
): Promise<{ name: string; tagline: string; context: PlanningAppContext } | undefined> {
  const row = await db
    .select({
      name: mcpApps.name,
      category: mcpApps.category,
      tagline: mcpApps.tagline,
      tools: mcpApps.tools,
      tags: mcpApps.tags,
    })
    .from(mcpApps)
    .where(eq(mcpApps.slug, slug))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!row) return undefined;

  let tools: string[] = [];
  try {
    const parsed = JSON.parse(row.tools) as unknown;
    if (Array.isArray(parsed)) tools = parsed.filter((t): t is string => typeof t === "string");
  } catch {
    // malformed JSON — treat as no tools
  }

  let tags: string[] = [];
  try {
    const parsed = JSON.parse(row.tags) as unknown;
    if (Array.isArray(parsed)) tags = parsed.filter((t): t is string => typeof t === "string");
  } catch {
    // malformed JSON — treat as no tags
  }

  const context: PlanningAppContext = {};
  if (row.category) context.category = row.category;
  if (row.tagline) context.tagline = row.tagline;
  if (tools.length > 0) context.tools = tools;
  if (tags.length > 0) context.tags = tags;

  return {
    name: row.name,
    tagline: row.tagline,
    context,
  };
}

export function registerQueezTools(
  registry: ToolRegistry,
  userId: string,
  db: DrizzleDB,
  env?: ToolRegistrationEnv,
): void {
  const t = freeTool(userId, db);

  // ── queez_start ──────────────────────────────────────────────────────────
  registry.registerBuilt(
    t
      .tool(
        "queez_start",
        "Start a quiz-style planning interview for a specific spike.land app. " +
          "Given an app slug (codespace ID) and a task description, generates " +
          "MCQ questions grounded in that app's tools and category. Tests the " +
          "same 6 BAZDMEG concepts. Master all 6 to receive a synthesized plan.",
        {
          codespace_id: z
            .string()
            .min(1)
            .describe("App slug / codespace ID (e.g. the :slug from /apps/:slug)."),
          task_description: z
            .string()
            .min(10)
            .describe("Description of the task being planned for this app."),
        },
      )
      .meta({ category: "queez", tier: "free" })
      .handler(async ({ input }) => {
        const loaded = await loadAppContext(db, input.codespace_id);
        if (!loaded) {
          throw new Error(
            `Codespace "${input.codespace_id}" not found. Pass a valid app slug from /apps.`,
          );
        }

        const concepts = await generatePlanningConcepts(
          input.task_description,
          input.codespace_id,
          env?.geminiApiKey,
          loaded.context,
        );

        const id = crypto.randomUUID();
        const session = createQuizSession(id, userId, input.task_description, concepts);
        await saveSessionToDb(db, id, userId, session);

        return jsonResult(
          `Queez interview started for "${loaded.name}" — ${concepts.length} concepts to master.`,
          {
            sessionId: id,
            codespaceId: input.codespace_id,
            appName: loaded.name,
            taskDescription: input.task_description,
            concepts: concepts.map((c) => c.name),
            appContext: loaded.context,
            stoppingRules: {
              pass: "All 6 concepts mastered (2+ correct each) → final plan",
              failLowScore: "Score < 50% on a round → study the app before retrying",
              failContradictions: "3+ contradictions → review the app before retrying",
            },
            firstRound: sanitizeRound(session.currentRound),
          },
        );
      }),
  );

  // ── queez_answer ─────────────────────────────────────────────────────────
  registry.registerBuilt(
    t
      .tool(
        "queez_answer",
        "Submit answers for the current Queez round (3 questions, each 0-3). " +
          "Returns round results, mastery progress, and either the next round or a final verdict.",
        {
          session_id: z.string().describe("Queez session ID returned from queez_start."),
          answers: z
            .tuple([
              z.number().int().min(0).max(3),
              z.number().int().min(0).max(3),
              z.number().int().min(0).max(3),
            ])
            .describe("Answers for each of the 3 questions (0-3 option index)."),
        },
      )
      .meta({ category: "queez", tier: "free" })
      .handler(async ({ input }) => {
        const session = await getSessionFromDb(db, input.session_id);
        if (!session) throw new Error(`Session ${input.session_id} not found`);
        if (session.completed) throw new Error("Queez interview already completed");

        const answers = input.answers as [number, number, number];
        const { results, conflicts, allMastered } = evaluateAnswers(session, answers);

        session.score = computeScore(session);

        const correctThisRound = results.filter((r) => r.correct).length;
        const progress = session.conceptStates.map((s) => ({
          concept: s.name,
          mastered: s.mastered,
          correctCount: s.correctCount,
          attempts: s.attempts,
        }));

        // Stopping rule: score < 50% on this round
        if (correctThisRound < Math.ceil(QUESTIONS_PER_ROUND / 2)) {
          session.completed = true;
          session.completedAt = Date.now();
          await saveSessionToDb(db, input.session_id, session.userId, session);
          return jsonResult(
            `FAILED — Score too low (${correctThisRound}/${QUESTIONS_PER_ROUND} correct). ` +
              `Study the app before retrying.`,
            {
              verdict: "FAIL_LOW_SCORE",
              results,
              conflicts,
              score: session.score,
              progress,
              recommendation:
                "Re-read the app's description, tools, and existing usage before retrying.",
            },
          );
        }

        // Stopping rule: too many contradictions
        if (session.conflicts.length >= MAX_CONTRADICTIONS) {
          session.completed = true;
          session.completedAt = Date.now();
          await saveSessionToDb(db, input.session_id, session.userId, session);
          return jsonResult(
            `FAILED — ${session.conflicts.length} contradictions detected. ` +
              `Review the app before retrying.`,
            {
              verdict: "FAIL_CONTRADICTIONS",
              results,
              conflicts: session.conflicts,
              score: session.score,
              progress,
              recommendation:
                "Your answers are inconsistent. Review the app's tools and docs before retrying.",
            },
          );
        }

        // All mastered — pass!
        if (allMastered) {
          session.completed = true;
          session.completedAt = Date.now();

          const badgePayload: BadgePayload = {
            sid: session.id,
            topic: "Queez",
            score: session.score,
            ts: session.completedAt,
          };
          const token = generateBadgeToken(badgePayload, "queez-secret");

          await saveSessionToDb(db, input.session_id, session.userId, session);
          return jsonResult(
            `PASSED — All ${session.concepts.length} concepts mastered! Ready for plan synthesis.`,
            {
              verdict: "PASS",
              results,
              conflicts,
              score: session.score,
              progress,
              badge: {
                token,
                topic: badgePayload.topic,
                score: badgePayload.score,
                completedAt: new Date(badgePayload.ts).toISOString(),
              },
            },
          );
        }

        // Continue — next round
        session.roundNumber++;
        session.currentRound = generateNextRound(session);

        await saveSessionToDb(db, input.session_id, session.userId, session);
        return jsonResult(
          `Round ${session.roundNumber - 1}: ${correctThisRound}/${QUESTIONS_PER_ROUND} correct` +
            (conflicts.length > 0 ? `. ${conflicts.length} contradiction(s)!` : "") +
            `. ${progress.filter((p) => p.mastered).length}/${session.concepts.length} concepts mastered.`,
          {
            verdict: "CONTINUE",
            results,
            conflicts,
            score: session.score,
            progress,
            nextRound: sanitizeRound(session.currentRound),
          },
        );
      }),
  );
}
