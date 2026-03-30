/**
 * Edge case tests for PrdRegistry that complement the existing registry.test.ts.
 * Covers: param route matching, empty registry fallbacks, getAll, resolveForApp
 * fallback path, resolveForToolCategory with no matches, duplicate registration,
 * and composition with token budget trimming via the real manifest.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { PrdRegistry } from "../core-logic/registry.js";
import { createPrdRegistry, registerAllPrds } from "../manifest.js";
import type { PrdDefinition } from "../core-logic/types.js";

function makePrd(
  overrides: Partial<PrdDefinition> & Pick<PrdDefinition, "id" | "level">,
): PrdDefinition {
  return {
    name: overrides.id,
    summary: `Summary for ${overrides.id}`,
    constraints: [],
    acceptance: [],
    toolCategories: [],
    tools: [],
    composesFrom: [],
    routePatterns: [],
    keywords: [],
    tokenEstimate: 100,
    version: "1.0.0",
    ...overrides,
  };
}

describe("PrdRegistry — edge cases", () => {
  let registry: PrdRegistry;

  beforeEach(() => {
    registry = new PrdRegistry();
  });

  describe("getAll", () => {
    it("returns empty array when nothing registered", () => {
      expect(registry.getAll()).toEqual([]);
    });

    it("returns all registered PRDs", () => {
      registry.register(makePrd({ id: "platform", level: "platform" }));
      registry.register(makePrd({ id: "domain:labs", level: "domain" }));
      const all = registry.getAll();
      expect(all).toHaveLength(2);
      expect(all.map((p) => p.id)).toContain("platform");
      expect(all.map((p) => p.id)).toContain("domain:labs");
    });
  });

  describe("route matching — $param patterns", () => {
    it("matches $param route pattern with correct segment count", () => {
      const platform = makePrd({ id: "platform", level: "platform" });
      const route = makePrd({
        id: "route:/apps",
        level: "route",
        routePatterns: ["/apps/$slug"],
        composesFrom: ["platform"],
      });
      registry.register(platform);
      registry.register(route);

      const resolved = registry.resolveForRoute("/apps/chess-arena");
      expect(resolved.chain.map((p) => p.id)).toContain("route:/apps");
    });

    it("does not match $param pattern with wrong segment count", () => {
      const platform = makePrd({ id: "platform", level: "platform" });
      const route = makePrd({
        id: "route:/apps",
        level: "route",
        routePatterns: ["/apps/$slug"],
        composesFrom: ["platform"],
      });
      registry.register(platform);
      registry.register(route);

      // /apps/a/b has one extra segment — should not match /apps/$slug
      const resolved = registry.resolveForRoute("/apps/a/b");
      expect(resolved.chain.map((p) => p.id)).not.toContain("route:/apps");
    });

    it("matches /apps/* wildcard exactly at the prefix level", () => {
      const platform = makePrd({ id: "platform", level: "platform" });
      const route = makePrd({
        id: "route:/apps",
        level: "route",
        routePatterns: ["/apps/*"],
        composesFrom: ["platform"],
      });
      registry.register(platform);
      registry.register(route);

      // /apps itself should match since /* prefix means /apps is equal to prefix
      const resolvedBase = registry.resolveForRoute("/apps");
      expect(resolvedBase.chain.map((p) => p.id)).toContain("route:/apps");
    });
  });

  describe("resolveForRoute — empty registry fallback", () => {
    it("returns empty chain when registry is empty and route is unknown", () => {
      const resolved = registry.resolveForRoute("/unknown");
      expect(resolved.chain).toEqual([]);
      expect(resolved.totalTokens).toBe(0);
    });

    it("returns platform only for unknown route when platform registered", () => {
      registry.register(makePrd({ id: "platform", level: "platform" }));
      const resolved = registry.resolveForRoute("/completely/unknown/path");
      expect(resolved.chain).toHaveLength(1);
      expect(resolved.chain[0]?.id).toBe("platform");
    });
  });

  describe("resolveForApp — fallback to route resolution", () => {
    it("falls back to route resolution when app ID not registered", () => {
      const platform = makePrd({ id: "platform", level: "platform" });
      const route = makePrd({
        id: "route:/apps",
        level: "route",
        routePatterns: ["/apps/*"],
        composesFrom: ["platform"],
      });
      registry.register(platform);
      registry.register(route);

      // "unknown-app" has no app: entry — should fall back to /apps/unknown-app route
      const resolved = registry.resolveForApp("unknown-app");
      expect(resolved.chain.map((p) => p.id)).toContain("route:/apps");
    });

    it("resolves directly when app is registered", () => {
      const platform = makePrd({ id: "platform", level: "platform" });
      const app = makePrd({
        id: "app:chess",
        level: "app",
        composesFrom: ["platform"],
      });
      registry.register(platform);
      registry.register(app);

      const resolved = registry.resolveForApp("chess");
      expect(resolved.chain.map((p) => p.id)).toContain("app:chess");
    });
  });

  describe("resolveForToolCategory — no match fallback", () => {
    it("returns empty chain when no platform and no category match", () => {
      const resolved = registry.resolveForToolCategory("nonexistent");
      expect(resolved.chain).toEqual([]);
    });

    it("returns platform when no category match but platform registered", () => {
      registry.register(makePrd({ id: "platform", level: "platform" }));
      const resolved = registry.resolveForToolCategory("nonexistent-category");
      expect(resolved.chain.map((p) => p.id)).toContain("platform");
    });

    it("matches a PRD by tool category", () => {
      const platform = makePrd({ id: "platform", level: "platform" });
      const domain = makePrd({
        id: "domain:ai",
        level: "domain",
        toolCategories: ["ai-gateway", "swarm"],
        composesFrom: ["platform"],
      });
      registry.register(platform);
      registry.register(domain);

      const resolved = registry.resolveForToolCategory("ai-gateway");
      expect(resolved.chain.map((p) => p.id)).toContain("domain:ai");
    });
  });

  describe("resolveByKeywords — edge cases", () => {
    it("returns platform only when no keyword match", () => {
      registry.register(makePrd({ id: "platform", level: "platform" }));
      const resolved = registry.resolveByKeywords("zzznomatch");
      expect(resolved.chain.map((p) => p.id)).toEqual(["platform"]);
    });

    it("returns empty chain when empty registry and no keyword match", () => {
      const resolved = registry.resolveByKeywords("zzznomatch");
      expect(resolved.chain).toEqual([]);
    });

    it("ignores words shorter than 3 characters", () => {
      const platform = makePrd({ id: "platform", level: "platform" });
      const domain = makePrd({
        id: "domain:labs",
        level: "domain",
        keywords: ["ai"],
        composesFrom: ["platform"],
      });
      registry.register(platform);
      registry.register(domain);

      // "ai" is 2 chars → filtered out, should not match
      const resolved = registry.resolveByKeywords("ai");
      expect(resolved.chain.map((p) => p.id)).not.toContain("domain:labs");
    });

    it("ranks PRDs by keyword hit count", () => {
      const platform = makePrd({ id: "platform", level: "platform" });
      const highRank = makePrd({
        id: "domain:a",
        level: "domain",
        keywords: ["chess", "game", "elo"],
        composesFrom: ["platform"],
      });
      const lowRank = makePrd({
        id: "domain:b",
        level: "domain",
        keywords: ["chess"],
        composesFrom: ["platform"],
      });
      registry.register(platform);
      registry.register(highRank);
      registry.register(lowRank);

      const resolved = registry.resolveByKeywords("chess game elo", 1);
      expect(resolved.chain.map((p) => p.id)).toContain("domain:a");
    });
  });

  describe("duplicate registration", () => {
    it("overwrites existing PRD when same ID is registered twice", () => {
      const original = makePrd({ id: "platform", level: "platform", summary: "Original" });
      const updated = makePrd({ id: "platform", level: "platform", summary: "Updated" });

      registry.register(original);
      registry.register(updated);

      expect(registry.get("platform")?.summary).toBe("Updated");
      // getAll should still return one entry
      expect(registry.getAll()).toHaveLength(1);
    });
  });

  describe("token budget options", () => {
    it("respects custom token budget in constructor", () => {
      const tightRegistry = new PrdRegistry({ tokenBudget: 150 });
      const platform = makePrd({ id: "platform", level: "platform", tokenEstimate: 100 });
      const domain = makePrd({
        id: "domain:d",
        level: "domain",
        composesFrom: ["platform"],
        tokenEstimate: 100,
      });
      const app = makePrd({
        id: "app:a",
        level: "app",
        composesFrom: ["domain:d"],
        routePatterns: ["/apps/a"],
        tokenEstimate: 100,
      });
      tightRegistry.register(platform);
      tightRegistry.register(domain);
      tightRegistry.register(app);

      const resolved = tightRegistry.resolveForRoute("/apps/a");
      expect(resolved.totalTokens).toBeLessThanOrEqual(150);
    });
  });

  describe("compose — multi-leaf merging", () => {
    it("merges tool categories from multiple apps", () => {
      const platform = makePrd({ id: "platform", level: "platform" });
      const app1 = makePrd({
        id: "app:chess",
        level: "app",
        toolCategories: ["chess-game"],
        composesFrom: ["platform"],
      });
      const app2 = makePrd({
        id: "app:image",
        level: "app",
        toolCategories: ["image-gen"],
        composesFrom: ["platform"],
      });
      registry.register(platform);
      registry.register(app1);
      registry.register(app2);

      const resolved = registry.compose(["app:chess", "app:image"]);
      expect(resolved.toolCategories).toContain("chess-game");
      expect(resolved.toolCategories).toContain("image-gen");
    });

    it("deduplicates platform when multiple children reference it", () => {
      const platform = makePrd({ id: "platform", level: "platform" });
      const app1 = makePrd({
        id: "app:a",
        level: "app",
        composesFrom: ["platform"],
      });
      const app2 = makePrd({
        id: "app:b",
        level: "app",
        composesFrom: ["platform"],
      });
      registry.register(platform);
      registry.register(app1);
      registry.register(app2);

      const resolved = registry.compose(["app:a", "app:b"]);
      const platformCount = resolved.chain.filter((p) => p.id === "platform").length;
      expect(platformCount).toBe(1);
    });
  });
});

describe("PrdRegistry — full manifest integration", () => {
  it("resolves chess-arena with full 4-level chain", () => {
    const registry = createPrdRegistry();
    const resolved = registry.resolveForApp("chess-arena");

    const levels = resolved.chain.map((p) => p.level);
    expect(levels).toContain("platform");
    expect(levels).toContain("domain");
    expect(levels).toContain("route");
    expect(levels).toContain("app");
    expect(resolved.tools).toContain("chess_create_game");
  });

  it("resolves image-studio app correctly", () => {
    const registry = createPrdRegistry();
    const resolved = registry.resolveForApp("image-studio");
    const ids = resolved.chain.map((p) => p.id);
    expect(ids).toContain("app:image-studio");
    expect(resolved.toolCategories).toContain("image");
  });

  it("resolves /dashboard route to dashboard chain", () => {
    const registry = createPrdRegistry();
    const resolved = registry.resolveForRoute("/dashboard");
    const ids = resolved.chain.map((p) => p.id);
    expect(ids).toContain("route:/dashboard");
    expect(ids).toContain("platform");
  });

  it("resolves /vibe-code/* wildcard route", () => {
    const registry = createPrdRegistry();
    const resolved = registry.resolveForRoute("/vibe-code/my-project");
    const ids = resolved.chain.map((p) => p.id);
    expect(ids).toContain("route:/vibe-code");
  });

  it("resolves keywords for AI domain", () => {
    const registry = createPrdRegistry();
    const resolved = registry.resolveByKeywords("swarm agent orchestrate");
    const ids = resolved.chain.map((p) => p.id);
    expect(ids).toContain("domain:ai-automation");
  });

  it("resolves keywords for labs domain", () => {
    const registry = createPrdRegistry();
    const resolved = registry.resolveByKeywords("raft consensus distributed");
    const ids = resolved.chain.map((p) => p.id);
    expect(ids).toContain("domain:labs");
  });

  it("resolves tool category 'chess-game' to chess-arena app", () => {
    const registry = createPrdRegistry();
    const resolved = registry.resolveForToolCategory("chess-game");
    const ids = resolved.chain.map((p) => p.id);
    expect(ids).toContain("app:chess-arena");
  });

  it("resolves tool category 'gateway-meta' to platform", () => {
    const registry = createPrdRegistry();
    const resolved = registry.resolveForToolCategory("gateway-meta");
    const ids = resolved.chain.map((p) => p.id);
    expect(ids).toContain("platform");
  });

  it("resolveForApp falls back to route for unregistered app slug", () => {
    const registry = createPrdRegistry();
    // "totally-unknown" is not in the manifest — falls back to /apps/totally-unknown
    // which matches /apps/* route pattern
    const resolved = registry.resolveForApp("totally-unknown");
    const ids = resolved.chain.map((p) => p.id);
    expect(ids).toContain("route:/apps");
  });

  it("registerAllPrds is idempotent when called twice", () => {
    const registry = new PrdRegistry();
    const result1 = registerAllPrds(registry);
    const countAfterFirst = registry.getAll().length;

    const result2 = registerAllPrds(registry);
    const countAfterSecond = registry.getAll().length;

    expect(result1.failedCount).toBe(0);
    expect(result2.failedCount).toBe(0);
    // Second call overwrites, so count should be the same (no duplicates added)
    expect(countAfterSecond).toBe(countAfterFirst);
  });

  it("catalog includes all level groups", () => {
    const registry = createPrdRegistry();
    const catalog = registry.buildCatalog();
    expect(catalog).toContain("## platform");
    expect(catalog).toContain("## domain");
    expect(catalog).toContain("## route");
    expect(catalog).toContain("## app");
  });

  it("catalog lists all app IDs", () => {
    const registry = createPrdRegistry();
    const catalog = registry.buildCatalog();
    expect(catalog).toContain("app:chess-arena");
    expect(catalog).toContain("app:image-studio");
    expect(catalog).toContain("app:beuniq");
    expect(catalog).toContain("app:crdt-lab");
  });
});
