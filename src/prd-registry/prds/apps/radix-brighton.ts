import type { PrdDefinition } from "../../core-logic/types.js";

export const radixBrightonPrd: PrdDefinition = {
  id: "app:radix-brighton",
  level: "app",
  name: "Radix Brighton",
  summary: "Smart food waste collection and recycling platform for Brighton & Hove",
  purpose:
    "A hyperlocal circular-economy platform turning Brighton's food waste into energy, compost, and community value. Leverages the Simpler Recycling mandate and B&H's existing weekly collections.",
  constraints: [
    "Must integrate with Brighton & Hove council's existing collection schedule",
    "Food waste tracking requires opt-in — no PII without explicit consent",
    "Biogas yield estimates must use WRAP-verified conversion factors",
    "Collection route optimisation must account for Brighton's hilly topology",
    "All community rewards redeemable at local Brighton businesses only",
  ],
  acceptance: [
    "Residents can log food waste and see energy-equivalent impact in real time",
    "Community leaderboard shows neighbourhood diversion rates updated weekly",
    "Local businesses can list rewards redeemable via earned recycling credits",
    "Dashboard shows aggregate biogas output and landfill diversion metrics",
  ],
  toolCategories: ["waste-tracking", "route-optimisation", "community-rewards", "impact-analytics"],
  tools: ["radix_log_waste", "radix_get_impact", "radix_leaderboard", "radix_redeem_reward"],
  composesFrom: ["platform", "domain:app-building", "route:/apps"],
  routePatterns: ["/apps/radix-brighton"],
  keywords: [
    "food waste",
    "recycling",
    "Brighton",
    "circular economy",
    "biogas",
    "compost",
    "sustainability",
    "community",
    "WRAP",
    "Simpler Recycling",
  ],
  tokenEstimate: 450,
  version: "1.0.0",
};
