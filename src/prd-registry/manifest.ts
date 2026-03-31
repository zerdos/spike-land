import { PrdRegistry } from "./core-logic/registry.js";
import type { PrdDefinition } from "./core-logic/types.js";

// Platform
import { platformPrd } from "./prds/platform.js";

// Domains
import { aiAutomationDomain } from "./prds/domains/ai-automation.js";
import { appBuildingDomain } from "./prds/domains/app-building.js";
import { contentDomain } from "./prds/domains/content.js";
import { labsDomain } from "./prds/domains/labs.js";
import { learningDomain } from "./prds/domains/learning.js";
import { platformInfraDomain } from "./prds/domains/platform-infra.js";
import { aetherDomain } from "./prds/domains/aether.js";
import { editorDomain } from "./prds/domains/editor.js";
import { contextRenderingDomain } from "./prds/domains/context-rendering.js";

// Routes
import { appsRoute } from "./prds/routes/apps.js";
import { blogRoute } from "./prds/routes/blog.js";
import { dashboardRoute } from "./prds/routes/dashboard.js";
import { pricingRoute } from "./prds/routes/pricing.js";
import { vibeCodeRoute } from "./prds/routes/vibe-code.js";
import { learnitRoute } from "./prds/routes/learnit.js";
import { createRoute } from "./prds/routes/create.js";
import { storeCategoryRoute } from "./prds/routes/store-category.js";
import { analyticsRoute } from "./prds/routes/analytics.js";

// Apps
import { aiGatewayPrd } from "./prds/apps/ai-gateway.js";
import { chessArenaPrd } from "./prds/apps/chess-arena.js";
import { crdtLabPrd } from "./prds/apps/crdt-lab.js";
import { imageStudioPrd } from "./prds/apps/image-studio.js";
import { qaStudioPrd } from "./prds/apps/qa-studio.js";
import { beuniqPrd } from "./prds/apps/beuniq.js";
import { spikeChatWidgetPrd } from "./prds/apps/spike-chat-widget.js";
import { radixBrightonPrd } from "./prds/apps/radix-brighton.js";
import { supportPrd } from "./prds/apps/support.js";

const ALL_PRDS: PrdDefinition[] = [
  // Platform (always first)
  platformPrd,
  // Domains
  appBuildingDomain,
  aiAutomationDomain,
  labsDomain,
  learningDomain,
  platformInfraDomain,
  contentDomain,
  aetherDomain,
  editorDomain,
  contextRenderingDomain,
  // Routes
  appsRoute,
  blogRoute,
  dashboardRoute,
  vibeCodeRoute,
  pricingRoute,
  learnitRoute,
  createRoute,
  storeCategoryRoute,
  analyticsRoute,
  // Apps
  chessArenaPrd,
  aiGatewayPrd,
  imageStudioPrd,
  qaStudioPrd,
  crdtLabPrd,
  beuniqPrd,
  spikeChatWidgetPrd,
  supportPrd,
  radixBrightonPrd,
];

let registrationFailures: string[] = [];

function safeRegister(registry: PrdRegistry, label: string, prd: PrdDefinition): void {
  try {
    registry.register(prd);
  } catch (err) {
    registrationFailures.push(label);
    console.error(`[PRD] Failed to register ${label}:`, err);
  }
}

/**
 * Register all PRDs into a registry instance.
 * Uses safeRegister() for error isolation (same pattern as MCP manifest.ts).
 */
export function registerAllPrds(registry: PrdRegistry): {
  failedCount: number;
  failedModules: string[];
} {
  registrationFailures = [];

  for (const prd of ALL_PRDS) {
    safeRegister(registry, prd.id, prd);
  }

  return {
    failedCount: registrationFailures.length,
    failedModules: [...registrationFailures],
  };
}

/**
 * Create a fully-loaded registry with all PRDs registered.
 * Convenience for consumers that just want a ready-to-use registry.
 */
export function createPrdRegistry(options?: { tokenBudget?: number }): PrdRegistry {
  const registry = new PrdRegistry(options);
  registerAllPrds(registry);
  return registry;
}
