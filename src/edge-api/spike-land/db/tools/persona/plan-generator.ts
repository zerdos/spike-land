/**
 * Persona Audit Plan Generator Tools
 *
 * Generates step-by-step audit plans for persona landing pages.
 * Each plan walks an agent through the onboarding quiz, verifies
 * the persona landing page, and scores the experience.
 */

import { eq } from "drizzle-orm";
import { z } from "zod";

import { personaAuditBatches, personaAuditResults } from "../../db/schema";
import type { DrizzleDB } from "../../db/db-index.ts";
import {
  PERSONAS,
  getAnswersForPersona,
  getPersonaBySlug,
  getQuestionSequence,
} from "../../../core-logic/lib/persona-data";
import type { ToolRegistry } from "../../../lazy-imports/registry";
import { freeTool, jsonResult } from "../../../lazy-imports/procedures-index.ts";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuditStep {
  step: number;
  tool: string;
  args: Record<string, unknown>;
  description: string;
  verify: string;
  onFailure: string;
}

// ─── Plan Generator ─────────────────────────────────────────────────────────

function generatePersonaAuditPlan(personaSlug: string, batchId?: string): AuditStep[] {
  const answers = getAnswersForPersona(personaSlug);
  if (!answers) {
    throw new Error(`No answer path found for persona "${personaSlug}"`);
  }

  const steps: AuditStep[] = [];
  let stepNum = 1;

  // Step 1: Navigate to homepage
  steps.push({
    step: stepNum++,
    tool: "web_navigate",
    args: { url: "https://spike.land" },
    description: "Navigate to spike.land homepage",
    verify: "Page loads without errors",
    onFailure: "Check if spike.land is reachable; retry once",
  });

  // Step 2: Verify homepage loaded
  steps.push({
    step: stepNum++,
    tool: "web_read",
    args: { selector: "body" },
    description: "Verify homepage loaded and onboarding quiz is visible",
    verify: "Page contains quiz or onboarding elements",
    onFailure: "Screenshot the page and report homepage load failure",
  });

  // Steps 3-10: Walk through 4 questions (read + click for each)
  for (let qIdx = 0; qIdx < 4; qIdx++) {
    const answersUpToNow = answers.slice(0, qIdx);
    const sequence = getQuestionSequence(answersUpToNow);
    const question = sequence[sequence.length - 1];
    if (!question) continue;

    const answerIsYes = answers[qIdx];
    const buttonLabel = answerIsYes ? question.yesLabel : question.noLabel;

    // Read the question
    steps.push({
      step: stepNum++,
      tool: "web_read",
      args: { selector: "body" },
      description: `Read question ${qIdx + 1}: "${question.text}"`,
      verify: `Page shows question with options "${question.yesLabel}" and "${question.noLabel}"`,
      onFailure: "Screenshot page; quiz may not have advanced correctly",
    });

    // Click the answer
    steps.push({
      step: stepNum++,
      tool: "web_click",
      args: { text: buttonLabel },
      description: `Find and click element with text '${buttonLabel}'`,
      verify: "Quiz advances to next question or shows persona result",
      onFailure: `Button "${buttonLabel}" not found; try clicking by accessible role or partial text`,
    });
  }

  // Step 11: Navigate to persona landing page
  steps.push({
    step: stepNum++,
    tool: "web_navigate",
    args: { url: `https://spike.land/for/${personaSlug}` },
    description: `Navigate to persona landing page /for/${personaSlug}`,
    verify: "Landing page loads without errors",
    onFailure: "Check URL; report 404 or server error",
  });

  // Step 12: Verify landing page content
  steps.push({
    step: stepNum++,
    tool: "web_read",
    args: { selector: "body" },
    description: "Read landing page content and verify persona-specific copy",
    verify: "Page contains persona name, hero text, and CTA",
    onFailure: "Report missing or generic content",
  });

  // Step 13: Screenshot
  steps.push({
    step: stepNum++,
    tool: "web_screenshot",
    args: {},
    description: "Capture screenshot of the persona landing page",
    verify: "Screenshot captured successfully",
    onFailure: "Skip screenshot; continue with remaining checks",
  });

  // Step 14: Accessibility check
  steps.push({
    step: stepNum++,
    tool: "web_read",
    args: { selector: "[role='main'], main, [role='navigation'], nav, [aria-label]" },
    description: "Check page landmarks and accessibility attributes",
    verify: "Page has proper landmarks (main, nav) and ARIA labels",
    onFailure: "Note accessibility issues in audit results",
  });

  // Step 15: CTA check
  steps.push({
    step: stepNum++,
    tool: "web_read",
    args: { selector: "a[href], button" },
    description: "Check CTA text and href values on the landing page",
    verify: "CTA links are present and point to valid destinations",
    onFailure: "Report missing or broken CTA links",
  });

  // Step 16: Recommended apps
  steps.push({
    step: stepNum++,
    tool: "web_read",
    args: { selector: "[data-testid='recommended-apps'], .recommended-apps, section" },
    description: "Check recommended apps section for persona-relevant apps",
    verify: "Recommended apps are displayed and relevant to persona",
    onFailure: "Note missing or irrelevant app recommendations",
  });

  // Step 17: Broken links
  steps.push({
    step: stepNum++,
    tool: "web_read",
    args: { selector: "a[href]" },
    description: "Check for broken links on the landing page",
    verify: "All links have valid href attributes",
    onFailure: "List broken or suspicious links",
  });

  // Step 18: Submit evaluation
  const submitArgs: Record<string, unknown> = {
    persona_slug: personaSlug,
    ux_score: 0,
    content_relevance: 0,
    cta_compelling: 0,
    recommended_apps_relevant: 0,
    would_sign_up: 0,
    blockers: "",
    highlights: "",
    accessibility_issues: "[]",
    broken_links: "[]",
    performance_notes: "",
  };
  if (batchId) {
    submitArgs.batch_id = batchId;
  }

  steps.push({
    step: stepNum++,
    tool: "audit_submit_evaluation",
    args: submitArgs,
    description: "Submit audit evaluation with scores (fill in actual scores from observations)",
    verify: "Evaluation saved successfully",
    onFailure: "Retry submission; report if DB write fails",
  });

  return steps;
}

// ─── Tool Registration ──────────────────────────────────────────────────────

export function registerPlanGeneratorTools(
  registry: ToolRegistry,
  userId: string,
  db: DrizzleDB,
): void {
  const t = freeTool(userId, db);

  // plan_generate_persona_audit
  registry.registerBuilt(
    t
      .tool(
        "plan_generate_persona_audit",
        "Generate a step-by-step audit plan for a single persona's onboarding flow and landing page.",
        {
          persona_slug: z
            .string()
            .min(1)
            .describe("The persona slug (e.g. 'ai-indie', 'content-creator')"),
        },
      )
      .meta({ category: "persona", tier: "free" })
      .handler(async ({ input }) => {
        const persona = getPersonaBySlug(input.persona_slug);
        if (!persona) {
          throw new Error(
            `Unknown persona slug "${input.persona_slug}". Valid slugs: ${PERSONAS.map((p) => p.slug).join(", ")}`,
          );
        }

        const plan = generatePersonaAuditPlan(input.persona_slug);

        return jsonResult(`Generated ${plan.length}-step audit plan for persona "${persona.name}"`, {
          persona,
          plan,
        });
      }),
  );

  // plan_generate_batch_audit
  registry.registerBuilt(
    t
      .tool(
        "plan_generate_batch_audit",
        "Generate audit plans for all 16 personas and create a batch tracking record in the database.",
        {},
      )
      .meta({ category: "persona", tier: "free" })
      .handler(async ({ ctx }) => {
        const batchId = crypto.randomUUID();

        await ctx.db.insert(personaAuditBatches).values({
          id: batchId,
          userId: ctx.userId,
          status: "pending",
          totalPersonas: PERSONAS.length,
          completedCount: 0,
          createdAt: Date.now(),
        });

        const results = PERSONAS.map((persona) => ({
          persona,
          plan: generatePersonaAuditPlan(persona.slug, batchId),
        }));

        return jsonResult(
          `Created batch "${batchId}" with ${results.length} persona audit plans`,
          { batchId, audits: results },
        );
      }),
  );

  // plan_get_status
  registry.registerBuilt(
    t
      .tool(
        "plan_get_status",
        "Get the status of a persona audit batch including completed count and result summaries.",
        {
          batch_id: z
            .string()
            .min(1)
            .describe("The batch ID returned by plan_generate_batch_audit"),
        },
      )
      .meta({ category: "persona", tier: "free" })
      .handler(async ({ input, ctx }) => {
        const batches = await ctx.db
          .select()
          .from(personaAuditBatches)
          .where(eq(personaAuditBatches.id, input.batch_id))
          .limit(1);

        const batch = batches[0];
        if (!batch) {
          throw new Error(`Batch "${input.batch_id}" not found`);
        }

        const results = await ctx.db
          .select()
          .from(personaAuditResults)
          .where(eq(personaAuditResults.batchId, input.batch_id));

        const summary = results.map((r) => ({
          personaSlug: r.personaSlug,
          uxScore: r.uxScore,
          contentRelevance: r.contentRelevance,
          ctaCompelling: r.ctaCompelling,
          recommendedAppsRelevant: r.recommendedAppsRelevant,
          wouldSignUp: r.wouldSignUp,
          blockers: r.blockers,
          highlights: r.highlights,
        }));

        return jsonResult(
          `Batch "${input.batch_id}": ${batch.status} — ${results.length}/${batch.totalPersonas} completed`,
          {
            batch: {
              id: batch.id,
              status: batch.status,
              totalPersonas: batch.totalPersonas,
              completedCount: results.length,
              createdAt: batch.createdAt,
              completedAt: batch.completedAt,
            },
            results: summary,
          },
        );
      }),
  );
}
