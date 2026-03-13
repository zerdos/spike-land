import type { PrdDefinition } from "../../core-logic/types.js";

export const supportPrd: PrdDefinition = {
  id: "app:support",
  level: "app",
  name: "Support Us",
  summary:
    "Support banner: fistbump counter, Stripe donations (£3/£5/£10), migration tiers, conversion tracking",
  purpose:
    "Monetisation surface for community support and professional migration services. Fistbump counter provides social proof; Stripe Checkout handles donations; three migration tiers (Blog £420, Script £1k, MCP £10k) convert developers into clients.",
  constraints: [
    "Stripe Checkout session must be server-created — no client-side secret exposure",
    "Fistbump counter updates optimistically and reconciles with server count within 5s",
    "Custom donation amount must be between £1 and £10 000",
    "Migration tier cards must link to a Stripe Payment Link or Checkout session",
    "Conversion events (view, click, checkout_started, checkout_completed) tracked via GA4",
    "Banner must be dismissible per-session without re-appearing on next page load",
  ],
  acceptance: [
    "Clicking any fixed donation amount initiates a Stripe Checkout session within 2s",
    "Custom amount validates input and blocks checkout for out-of-range values",
    "Fistbump animation triggers on click and increments counter visibly",
    "Each migration tier card displays correct price, scope, and CTA",
    "Checkout completion redirects to a success page and fires conversion event",
  ],
  toolCategories: ["payments", "conversion", "analytics"],
  tools: [
    "stripe_create_checkout_session",
    "fistbump_increment",
    "fistbump_get_count",
    "conversion_track_event",
  ],
  composesFrom: ["platform", "domain:content"],
  routePatterns: ["/support", "/apps/support"],
  keywords: [
    "support",
    "donation",
    "stripe",
    "fistbump",
    "migration",
    "tier",
    "checkout",
    "conversion",
    "monetisation",
    "payment",
  ],
  tokenEstimate: 320,
  version: "1.0.0",
};
