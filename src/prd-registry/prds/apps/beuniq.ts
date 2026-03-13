import type { PrdDefinition } from "../../core-logic/types.js";

export const beuniqPrd: PrdDefinition = {
  id: "app:beuniq",
  level: "app",
  name: "BeUniq",
  summary:
    "Persona quiz: 4-question binary flow → 16 archetypes, recommendation engine, onboarding wizard",
  purpose:
    "Onboarding experience that classifies users into one of 16 distinct personas via a short binary quiz. Each persona maps to a curated set of app recommendations, enabling a personalised first-session journey and driving activation through the onboarding wizard.",
  constraints: [
    "Quiz must complete in 4 binary questions (2^4 = 16 unique paths)",
    "Persona assignment stored in user session and persisted to profile on first auth",
    "Recommendation engine must map every persona to at least 3 app slugs",
    "Onboarding wizard integration must not block navigation — dismissible at any step",
    "No PII collected during the unauthenticated quiz flow",
  ],
  acceptance: [
    "All 16 question paths produce a distinct persona with a unique slug and description",
    "Recommended apps for each persona are discoverable in the store",
    "Onboarding wizard advances users from quiz result to first app install within 3 steps",
    "Persona persists across page refreshes for authenticated users",
    "Anonymous persona stored in localStorage and merged on sign-in",
  ],
  toolCategories: ["persona", "recommendation", "onboarding"],
  tools: [
    "persona_classify",
    "persona_get_recommendations",
    "onboarding_next_step",
    "onboarding_dismiss",
  ],
  composesFrom: ["platform", "domain:app-building", "route:/apps"],
  routePatterns: ["/apps/beuniq", "/onboarding", "/onboarding/*"],
  keywords: [
    "persona",
    "quiz",
    "onboarding",
    "recommendation",
    "personalisation",
    "archetype",
    "wizard",
    "classification",
  ],
  tokenEstimate: 350,
  version: "1.0.0",
};
