/**
 * beUniq Quiz MCP Tools
 *
 * Agent-optimized yes/no onboarding quiz that determines user persona.
 * 4 binary questions => 16 personas via decision tree.
 */

import { z } from "zod";
import type { ToolRegistry } from "../../../lazy-imports/registry";
import { freeTool, jsonResult } from "../../../lazy-imports/procedures-index.ts";
import type { DrizzleDB } from "../../../db/db/db-index.ts";
import {
  type OnboardingPersona,
  type OnboardingQuestion,
  getPersonaFromAnswers,
  getQuestionSequence,
} from "../../lib/persona-data";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BeUniqSession {
  id: string;
  userId: string;
  answers: boolean[];
  currentQuestion: OnboardingQuestion | null;
  persona: OnboardingPersona | null;
  completed: boolean;
  createdAt: number;
}

// ─── In-memory storage ───────────────────────────────────────────────────────

const sessions = new Map<string, BeUniqSession>();

const SESSION_TTL_MS = 60 * 60 * 1000;

function cleanupSessions(): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

/** Exported for testing */
export function clearBeUniqSessions(): void {
  sessions.clear();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatQuestion(q: OnboardingQuestion) {
  return {
    id: q.id,
    text: q.text,
    yes_label: q.yesLabel,
    no_label: q.noLabel,
  };
}

function formatPersona(p: OnboardingPersona) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    hero_text: p.heroText,
    cta: p.cta,
    recommended_app_slugs: p.recommendedAppSlugs,
    default_theme: p.defaultTheme,
  };
}

// ─── Registration ────────────────────────────────────────────────────────────

export function registerBeUniqTools(registry: ToolRegistry, userId: string, db: DrizzleDB): void {
  registry.registerBuilt(
    freeTool(userId, db)
      .tool(
        "beuniq_start",
        "Start a beUniq onboarding quiz session. Returns the first yes/no question.",
        {},
      )
      .meta({ category: "persona", tier: "free" })
      .handler(async () => {
        cleanupSessions();

        const id = crypto.randomUUID();
        const sequence = getQuestionSequence([]);
        const firstQuestion = sequence[0] ?? null;

        const session: BeUniqSession = {
          id,
          userId,
          answers: [],
          currentQuestion: firstQuestion,
          persona: null,
          completed: false,
          createdAt: Date.now(),
        };
        sessions.set(id, session);

        return jsonResult("beUniq quiz started", {
          session_id: id,
          question: firstQuestion ? formatQuestion(firstQuestion) : null,
        });
      }),
  );

  registry.registerBuilt(
    freeTool(userId, db)
      .tool(
        "beuniq_answer",
        "Answer the current beUniq quiz question with yes (true) or no (false).",
        {
          session_id: z.string().describe("The beUniq session ID from beuniq_start."),
          answer: z.coerce.boolean().describe("true for yes, false for no."),
        },
      )
      .meta({ category: "persona", tier: "free" })
      .handler(async ({ input }) => {
        const session = sessions.get(input.session_id);
        if (!session) throw new Error(`Session ${input.session_id} not found`);
        if (session.completed) throw new Error(`Session ${input.session_id} is already completed`);

        session.answers.push(input.answer);

        if (session.answers.length === 4) {
          const persona = getPersonaFromAnswers(session.answers);
          session.completed = true;
          session.persona = persona;
          session.currentQuestion = null;

          if (!persona) {
            throw new Error("Could not determine persona from answers");
          }

          return jsonResult("Quiz complete! Persona determined.", {
            session_id: session.id,
            completed: true,
            persona: formatPersona(persona),
            next_steps: `Use beuniq_get_persona with session_id "${session.id}" to retrieve full details anytime. Recommended apps: ${persona.recommendedAppSlugs.join(", ")}.`,
          });
        }

        const sequence = getQuestionSequence(session.answers);
        const nextQuestion = sequence[session.answers.length] ?? null;
        session.currentQuestion = nextQuestion;

        return jsonResult(`Answer recorded (${session.answers.length}/4)`, {
          session_id: session.id,
          answers_so_far: session.answers.length,
          question: nextQuestion ? formatQuestion(nextQuestion) : null,
        });
      }),
  );

  registry.registerBuilt(
    freeTool(userId, db)
      .tool("beuniq_get_persona", "Get the persona result from a completed beUniq quiz session.", {
        session_id: z.string().describe("The beUniq session ID."),
      })
      .meta({ category: "persona", tier: "free" })
      .handler(async ({ input }) => {
        const session = sessions.get(input.session_id);
        if (!session) throw new Error(`Session ${input.session_id} not found`);
        if (!session.completed || !session.persona) {
          throw new Error(
            `Session ${input.session_id} is not yet completed. Answer all 4 questions first.`,
          );
        }

        return jsonResult(`Persona: ${session.persona.name}`, {
          session_id: session.id,
          answers: session.answers,
          persona: formatPersona(session.persona),
        });
      }),
  );
}
