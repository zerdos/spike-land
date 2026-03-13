import type { PrdDefinition } from "../../core-logic/types.js";

export const contextRenderingDomain: PrdDefinition = {
  id: "domain:context-rendering",
  level: "domain",
  name: "Context-Scripted Rendering",
  summary:
    "Conditional MDX blocks by persona/session/flags, dynamic layout branching, persona-aware variants",
  purpose:
    "Makes every page context-aware. MDX blocks carry condition descriptors keyed on persona, session tier, and feature flags. Context resolver prunes non-matching branches before sending HTML. Layout branches and component variant maps handle first-time vs power-user rendering.",
  constraints: [
    "Condition evaluation must be deterministic given the same context object",
    "Server-side resolution must not leak gated content in the HTML payload",
    "Feature flags sourced from domain:platform-infra flag store — no hardcoded values",
    "Persona context from domain:beuniq (app:beuniq) or anonymous fallback persona",
    "Layout branch selection must complete before first paint — no layout shift",
    "Component variant map must have a required 'default' variant as fallback",
  ],
  acceptance: [
    "A gated MDX block does not appear in page source when condition is false",
    "Changing user persona triggers re-evaluation and re-render of conditional blocks",
    "A route with two layout branches renders the correct template for each context",
    "Feature flag toggled to off removes corresponding UI element within one request cycle",
    "Anonymous visitors always receive the 'default' variant — no undefined component errors",
  ],
  toolCategories: ["context", "rendering", "feature-flags", "persona"],
  tools: [
    "context_resolve",
    "flag_get",
    "persona_get_current",
    "layout_select_branch",
    "mdx_render_conditional",
  ],
  composesFrom: ["platform", "domain:content", "domain:aether"],
  routePatterns: [],
  keywords: [
    "context",
    "conditional",
    "mdx",
    "persona",
    "feature-flag",
    "layout",
    "variant",
    "rendering",
    "dynamic",
    "session",
    "ssr",
    "hydration",
  ],
  tokenEstimate: 300,
  version: "1.0.0",
};
