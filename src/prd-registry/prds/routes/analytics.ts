import type { PrdDefinition } from "../../core-logic/types.js";

export const analyticsRoute: PrdDefinition = {
  id: "route:/analytics",
  level: "route",
  name: "Analytics Dashboard",
  summary:
    "Analytics dashboard: GA4 integration, 5 tabs (overview/acquisition/behavior/audience/platform)",
  purpose:
    "Internal analytics surface for operators and publishers. Integrates GA4 Reporting API across five tab views. Custom events (install, launch, share, upgrade) tracked alongside standard GA4. Time range selector (7d/30d/90d/custom) applies globally.",
  constraints: [
    "GA4 Reporting API calls must be server-side — API secret not exposed to client",
    "Dashboard is access-controlled: requires authenticated operator or publisher role",
    "Chart data refreshes on tab switch or time range change — no background polling",
    "Custom event schema must match the event taxonomy defined in domain:platform-infra",
    "Data must be anonymised — no individual user identifiers in any chart",
  ],
  acceptance: [
    "All 5 tabs render with correct chart types and metric labels",
    "Changing time range re-fetches data for the active tab within 3s",
    "Overview tab shows sessions, new users, installs, and revenue at a glance",
    "Platform tab shows MCP tool usage, Durable Object hit rate, and Worker CPU time",
    "Custom event 'checkout_completed' appears in behavior tab event list",
  ],
  toolCategories: ["analytics", "reporting", "ga4"],
  tools: [
    "ga4_get_report",
    "ga4_list_custom_events",
    "analytics_get_platform_metrics",
    "analytics_get_funnel",
  ],
  composesFrom: ["platform", "domain:platform-infra"],
  routePatterns: ["/analytics", "/analytics/:tab"],
  keywords: [
    "analytics",
    "dashboard",
    "ga4",
    "metrics",
    "reporting",
    "events",
    "acquisition",
    "behavior",
    "audience",
    "conversion",
    "funnel",
  ],
  tokenEstimate: 290,
  version: "1.0.0",
};
