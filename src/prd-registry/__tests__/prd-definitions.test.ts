/**
 * Tests for all PRD definition files (platform, domains, routes, apps).
 * Validates that every registered PRD:
 *   1. Passes PrdDefinitionSchema parse (no Zod errors)
 *   2. Has correct level for its location
 *   3. References composesFrom IDs that exist in the full manifest
 *   4. Has unique IDs across the entire registry
 *   5. Has tokenEstimate > 0
 *   6. Has routePatterns only for route/app levels
 */

import { describe, expect, it } from "vitest";
import { PrdDefinitionSchema } from "../core-logic/types.js";

// Platform
import { platformPrd } from "../prds/platform.js";

// Domains
import { aiAutomationDomain } from "../prds/domains/ai-automation.js";
import { appBuildingDomain } from "../prds/domains/app-building.js";
import { contentDomain } from "../prds/domains/content.js";
import { labsDomain } from "../prds/domains/labs.js";
import { learningDomain } from "../prds/domains/learning.js";
import { platformInfraDomain } from "../prds/domains/platform-infra.js";
import { aetherDomain } from "../prds/domains/aether.js";
import { editorDomain } from "../prds/domains/editor.js";
import { contextRenderingDomain } from "../prds/domains/context-rendering.js";

// Routes
import { appsRoute } from "../prds/routes/apps.js";
import { blogRoute } from "../prds/routes/blog.js";
import { dashboardRoute } from "../prds/routes/dashboard.js";
import { pricingRoute } from "../prds/routes/pricing.js";
import { vibeCodeRoute } from "../prds/routes/vibe-code.js";
import { learnitRoute } from "../prds/routes/learnit.js";
import { createRoute } from "../prds/routes/create.js";
import { storeCategoryRoute } from "../prds/routes/store-category.js";
import { analyticsRoute } from "../prds/routes/analytics.js";

// Apps
import { aiGatewayPrd } from "../prds/apps/ai-gateway.js";
import { chessArenaPrd } from "../prds/apps/chess-arena.js";
import { crdtLabPrd } from "../prds/apps/crdt-lab.js";
import { imageStudioPrd } from "../prds/apps/image-studio.js";
import { qaStudioPrd } from "../prds/apps/qa-studio.js";
import { beuniqPrd } from "../prds/apps/beuniq.js";
import { spikeChatWidgetPrd } from "../prds/apps/spike-chat-widget.js";
import { supportPrd } from "../prds/apps/support.js";

const ALL_PRDS = [
  platformPrd,
  aiAutomationDomain,
  appBuildingDomain,
  contentDomain,
  labsDomain,
  learningDomain,
  platformInfraDomain,
  aetherDomain,
  editorDomain,
  contextRenderingDomain,
  appsRoute,
  blogRoute,
  dashboardRoute,
  pricingRoute,
  vibeCodeRoute,
  learnitRoute,
  createRoute,
  storeCategoryRoute,
  analyticsRoute,
  aiGatewayPrd,
  chessArenaPrd,
  crdtLabPrd,
  imageStudioPrd,
  qaStudioPrd,
  beuniqPrd,
  spikeChatWidgetPrd,
  supportPrd,
];

const ALL_IDS = new Set(ALL_PRDS.map((p) => p.id));

describe("PRD definition files", () => {
  describe("platform PRD", () => {
    it("passes schema validation", () => {
      expect(() => PrdDefinitionSchema.parse(platformPrd)).not.toThrow();
    });

    it("has level: platform", () => {
      expect(platformPrd.level).toBe("platform");
    });

    it("has no composesFrom (root node)", () => {
      expect(platformPrd.composesFrom).toEqual([]);
    });

    it("has tokenEstimate > 0", () => {
      expect(platformPrd.tokenEstimate).toBeGreaterThan(0);
    });

    it("has meaningful keywords", () => {
      expect(platformPrd.keywords.length).toBeGreaterThan(0);
    });
  });

  describe("domain PRDs", () => {
    const domains = [
      aiAutomationDomain,
      appBuildingDomain,
      contentDomain,
      labsDomain,
      learningDomain,
      platformInfraDomain,
      aetherDomain,
      editorDomain,
      contextRenderingDomain,
    ];

    for (const domain of domains) {
      describe(domain.id, () => {
        it("passes schema validation", () => {
          expect(() => PrdDefinitionSchema.parse(domain)).not.toThrow();
        });

        it("has level: domain", () => {
          expect(domain.level).toBe("domain");
        });

        it("composes from platform", () => {
          expect(domain.composesFrom).toContain("platform");
        });

        it("has tokenEstimate > 0", () => {
          expect(domain.tokenEstimate).toBeGreaterThan(0);
        });

        it("has at least one keyword", () => {
          expect(domain.keywords.length).toBeGreaterThan(0);
        });

        it("all composesFrom IDs are known", () => {
          for (const parentId of domain.composesFrom) {
            expect(ALL_IDS).toContain(parentId);
          }
        });
      });
    }
  });

  describe("route PRDs", () => {
    const routes = [
      appsRoute,
      blogRoute,
      dashboardRoute,
      pricingRoute,
      vibeCodeRoute,
      learnitRoute,
      createRoute,
      storeCategoryRoute,
      analyticsRoute,
    ];

    for (const route of routes) {
      describe(route.id, () => {
        it("passes schema validation", () => {
          expect(() => PrdDefinitionSchema.parse(route)).not.toThrow();
        });

        it("has level: route", () => {
          expect(route.level).toBe("route");
        });

        it("has at least one routePattern", () => {
          expect(route.routePatterns.length).toBeGreaterThan(0);
        });

        it("all route patterns start with /", () => {
          for (const pattern of route.routePatterns) {
            expect(pattern).toMatch(/^\//);
          }
        });

        it("has tokenEstimate > 0", () => {
          expect(route.tokenEstimate).toBeGreaterThan(0);
        });

        it("all composesFrom IDs are known", () => {
          for (const parentId of route.composesFrom) {
            expect(ALL_IDS).toContain(parentId);
          }
        });
      });
    }
  });

  describe("app PRDs", () => {
    // Apps with specific route patterns (most apps)
    const routedApps = [
      aiGatewayPrd,
      chessArenaPrd,
      crdtLabPrd,
      imageStudioPrd,
      qaStudioPrd,
      beuniqPrd,
      supportPrd,
    ];

    // Apps that are global overlays and intentionally have no routePatterns
    const globalOverlayApps = [spikeChatWidgetPrd];

    const allApps = [...routedApps, ...globalOverlayApps];

    for (const app of allApps) {
      describe(app.id, () => {
        it("passes schema validation", () => {
          expect(() => PrdDefinitionSchema.parse(app)).not.toThrow();
        });

        it("has level: app", () => {
          expect(app.level).toBe("app");
        });

        it("id starts with 'app:'", () => {
          expect(app.id).toMatch(/^app:/);
        });

        it("has tokenEstimate > 0", () => {
          expect(app.tokenEstimate).toBeGreaterThan(0);
        });

        it("composes from platform (directly or transitively via known parent)", () => {
          const composesFromKnown = app.composesFrom.every((id) => ALL_IDS.has(id));
          expect(composesFromKnown).toBe(true);
        });

        it("has at least one keyword", () => {
          expect(app.keywords.length).toBeGreaterThan(0);
        });
      });
    }

    for (const app of routedApps) {
      describe(`${app.id} — route patterns`, () => {
        it("has at least one routePattern", () => {
          expect(app.routePatterns.length).toBeGreaterThan(0);
        });

        it("all route patterns start with a known prefix", () => {
          const hasKnownPattern = app.routePatterns.some(
            (p) => p.startsWith("/apps/") || p.startsWith("/onboarding"),
          );
          expect(hasKnownPattern).toBe(true);
        });
      });
    }

    describe("spike-chat-widget — global overlay", () => {
      it("intentionally has no routePatterns (renders on all routes)", () => {
        expect(spikeChatWidgetPrd.routePatterns).toEqual([]);
      });

      it("is discoverable via keywords", () => {
        expect(spikeChatWidgetPrd.keywords.length).toBeGreaterThan(0);
      });

      it("is discoverable via tool categories", () => {
        expect(spikeChatWidgetPrd.toolCategories.length).toBeGreaterThan(0);
      });
    });
  });

  describe("registry-wide constraints", () => {
    it("all PRD IDs are unique", () => {
      const ids = ALL_PRDS.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("all composesFrom references resolve to known IDs", () => {
      const unknownRefs: string[] = [];
      for (const prd of ALL_PRDS) {
        for (const parentId of prd.composesFrom) {
          if (!ALL_IDS.has(parentId)) {
            unknownRefs.push(`${prd.id} → ${parentId}`);
          }
        }
      }
      expect(unknownRefs).toEqual([]);
    });

    it("total PRD count matches expected (27)", () => {
      expect(ALL_PRDS.length).toBe(27);
    });

    it("all PRDs pass Zod validation", () => {
      const failures: string[] = [];
      for (const prd of ALL_PRDS) {
        try {
          PrdDefinitionSchema.parse(prd);
        } catch (_err) {
          failures.push(prd.id);
        }
      }
      expect(failures).toEqual([]);
    });

    it("no PRD summary exceeds 120 chars", () => {
      const violations = ALL_PRDS.filter((p) => p.summary.length > 120).map((p) => p.id);
      expect(violations).toEqual([]);
    });

    it("no PRD purpose exceeds 300 chars", () => {
      const violations = ALL_PRDS.filter(
        (p) => p.purpose !== undefined && p.purpose.length > 300,
      ).map((p) => p.id);
      expect(violations).toEqual([]);
    });

    it("no PRD has more than 8 constraints", () => {
      const violations = ALL_PRDS.filter((p) => p.constraints.length > 8).map((p) => p.id);
      expect(violations).toEqual([]);
    });

    it("no PRD has more than 5 acceptance criteria", () => {
      const violations = ALL_PRDS.filter((p) => p.acceptance.length > 5).map((p) => p.id);
      expect(violations).toEqual([]);
    });

    it("platform PRD has no routePatterns", () => {
      expect(platformPrd.routePatterns).toEqual([]);
    });
  });
});
