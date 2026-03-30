/**
 * Edge case tests for serializer.ts and composer.ts that complement the
 * existing serializer.test.ts and composer.test.ts.
 */

import { describe, expect, it } from "vitest";
import {
  buildCatalogText,
  estimateTokens,
  resolveFromChain,
  serializeChain,
  serializePrd,
} from "../core-logic/serializer.js";
import { buildChain, trimToBudget } from "../core-logic/composer.js";
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

describe("estimateTokens — edge cases", () => {
  it("returns 0 for whitespace-only string", () => {
    expect(estimateTokens("   \t\n  ")).toBe(0);
  });

  it("handles single word", () => {
    expect(estimateTokens("hello")).toBe(Math.ceil(1 * 1.3));
  });

  it("handles many words correctly", () => {
    const text = Array.from({ length: 100 }, () => "word").join(" ");
    expect(estimateTokens(text)).toBe(Math.ceil(100 * 1.3));
  });

  it("counts multi-space separated words correctly", () => {
    // filter(Boolean) collapses whitespace
    const result = estimateTokens("one  two   three");
    expect(result).toBe(Math.ceil(3 * 1.3));
  });
});

describe("serializePrd — edge cases", () => {
  it("includes purpose field when set", () => {
    const prd = makePrd({ id: "test", level: "domain", purpose: "My purpose" });
    const output = serializePrd(prd);
    expect(output).toContain("Purpose: My purpose");
  });

  it("includes context field when set", () => {
    const prd = makePrd({ id: "test", level: "domain", context: "Some context" });
    const output = serializePrd(prd);
    expect(output).toContain("Context: Some context");
  });

  it("omits purpose when not set", () => {
    const prd = makePrd({ id: "test", level: "domain" });
    const output = serializePrd(prd);
    expect(output).not.toContain("Purpose:");
  });

  it("omits context when not set", () => {
    const prd = makePrd({ id: "test", level: "domain" });
    const output = serializePrd(prd);
    expect(output).not.toContain("Context:");
  });

  it("formats multiple tools with comma separator", () => {
    const prd = makePrd({
      id: "test",
      level: "app",
      tools: ["tool_a", "tool_b", "tool_c"],
    });
    const output = serializePrd(prd);
    expect(output).toContain("Tools: tool_a, tool_b, tool_c");
  });

  it("formats multiple tool categories with comma separator", () => {
    const prd = makePrd({
      id: "test",
      level: "app",
      toolCategories: ["cat-a", "cat-b"],
    });
    const output = serializePrd(prd);
    expect(output).toContain("Tool categories: cat-a, cat-b");
  });

  it("formats multiple constraints with semicolon separator", () => {
    const prd = makePrd({
      id: "test",
      level: "domain",
      constraints: ["must be fast", "must be safe"],
    });
    const output = serializePrd(prd);
    expect(output).toContain("Constraints: must be fast; must be safe");
  });

  it("formats multiple acceptance criteria with semicolon separator", () => {
    const prd = makePrd({
      id: "test",
      level: "domain",
      acceptance: ["tests pass", "coverage > 80%"],
    });
    const output = serializePrd(prd);
    expect(output).toContain("Acceptance: tests pass; coverage > 80%");
  });

  it("produces correct header format for tool-category level", () => {
    const prd = makePrd({ id: "tool-category:chess", level: "tool-category" });
    const output = serializePrd(prd);
    expect(output).toContain("[PRD:tool-category:tool-category:chess]");
  });
});

describe("serializeChain — edge cases", () => {
  it("returns empty string for empty chain", () => {
    expect(serializeChain([])).toBe("");
  });

  it("returns single PRD without separator for single-item chain", () => {
    const chain = [makePrd({ id: "platform", level: "platform" })];
    const output = serializeChain(chain);
    expect(output).not.toContain("---");
    expect(output).toContain("[PRD:platform:platform]");
  });

  it("uses --- separator between multiple PRDs", () => {
    const chain = [
      makePrd({ id: "platform", level: "platform" }),
      makePrd({ id: "domain:d", level: "domain" }),
      makePrd({ id: "app:a", level: "app" }),
    ];
    const output = serializeChain(chain);
    const separators = output.split("---").length - 1;
    expect(separators).toBe(2);
  });
});

describe("buildCatalogText — edge cases", () => {
  it("returns only header for empty PRD list", () => {
    const catalog = buildCatalogText([]);
    expect(catalog).toBe("# PRD Catalog");
  });

  it("skips levels that have no PRDs", () => {
    const prds = [makePrd({ id: "platform", level: "platform" })];
    const catalog = buildCatalogText(prds);
    expect(catalog).not.toContain("## domain");
    expect(catalog).not.toContain("## app");
    expect(catalog).toContain("## platform");
  });

  it("orders levels: platform, domain, route, app, tool-category", () => {
    const prds = [
      makePrd({ id: "app:a", level: "app" }),
      makePrd({ id: "route:/r", level: "route" }),
      makePrd({ id: "platform", level: "platform" }),
      makePrd({ id: "domain:d", level: "domain" }),
    ];
    const catalog = buildCatalogText(prds);
    const platformPos = catalog.indexOf("## platform");
    const domainPos = catalog.indexOf("## domain");
    const routePos = catalog.indexOf("## route");
    const appPos = catalog.indexOf("## app");
    expect(platformPos).toBeLessThan(domainPos);
    expect(domainPos).toBeLessThan(routePos);
    expect(routePos).toBeLessThan(appPos);
  });

  it("includes tool-category level when present", () => {
    const prds = [makePrd({ id: "tc:chess", level: "tool-category" })];
    const catalog = buildCatalogText(prds);
    expect(catalog).toContain("## tool-category");
  });
});

describe("resolveFromChain — edge cases", () => {
  it("returns zero totalTokens for empty chain", () => {
    const resolved = resolveFromChain([]);
    expect(resolved.totalTokens).toBe(0);
    expect(resolved.chain).toEqual([]);
    expect(resolved.constraints).toEqual([]);
    expect(resolved.acceptance).toEqual([]);
    expect(resolved.toolCategories).toEqual([]);
    expect(resolved.tools).toEqual([]);
    expect(resolved.serialized).toBe("");
  });

  it("deduplicates tools across chain", () => {
    const chain = [
      makePrd({ id: "a", level: "platform", tools: ["shared_tool", "tool_a"] }),
      makePrd({ id: "b", level: "domain", tools: ["shared_tool", "tool_b"] }),
    ];
    const resolved = resolveFromChain(chain);
    expect(resolved.tools).toEqual(["shared_tool", "tool_a", "tool_b"]);
  });

  it("preserves order of first occurrence for tool deduplication", () => {
    const chain = [
      makePrd({ id: "a", level: "platform", toolCategories: ["first", "second"] }),
      makePrd({ id: "b", level: "domain", toolCategories: ["second", "third"] }),
    ];
    const resolved = resolveFromChain(chain);
    expect(resolved.toolCategories).toEqual(["first", "second", "third"]);
  });

  it("accumulates constraints in chain order (no deduplication)", () => {
    const chain = [
      makePrd({
        id: "a",
        level: "platform",
        constraints: ["platform constraint"],
      }),
      makePrd({ id: "b", level: "domain", constraints: ["domain constraint"] }),
    ];
    const resolved = resolveFromChain(chain);
    expect(resolved.constraints).toEqual(["platform constraint", "domain constraint"]);
  });

  it("sums tokenEstimates across all chain entries", () => {
    const chain = [
      makePrd({ id: "a", level: "platform", tokenEstimate: 100 }),
      makePrd({ id: "b", level: "domain", tokenEstimate: 250 }),
      makePrd({ id: "c", level: "app", tokenEstimate: 400 }),
    ];
    const resolved = resolveFromChain(chain);
    expect(resolved.totalTokens).toBe(750);
  });
});

describe("buildChain — edge cases", () => {
  it("returns empty array for unknown leaf ID", () => {
    const map = new Map<string, PrdDefinition>();
    const chain = buildChain("nonexistent", map);
    expect(chain).toEqual([]);
  });

  it("returns single PRD for leaf with no composesFrom", () => {
    const map = new Map<string, PrdDefinition>();
    map.set("platform", makePrd({ id: "platform", level: "platform" }));
    const chain = buildChain("platform", map);
    expect(chain).toHaveLength(1);
    expect(chain[0]?.id).toBe("platform");
  });

  it("handles circular references without infinite loop", () => {
    const map = new Map<string, PrdDefinition>();
    // A → B → A (cycle)
    map.set("a", makePrd({ id: "a", level: "domain", composesFrom: ["b"] }));
    map.set("b", makePrd({ id: "b", level: "domain", composesFrom: ["a"] }));
    // Should not throw or hang
    expect(() => buildChain("a", map)).not.toThrow();
    const chain = buildChain("a", map);
    // Both should appear exactly once
    const ids = chain.map((p) => p.id);
    expect(ids.filter((id) => id === "a")).toHaveLength(1);
    expect(ids.filter((id) => id === "b")).toHaveLength(1);
  });
});

describe("trimToBudget — edge cases", () => {
  it("returns empty array for empty chain", () => {
    expect(trimToBudget([], 1000)).toEqual([]);
  });

  it("returns chain unchanged when total equals budget exactly", () => {
    const chain = [
      makePrd({ id: "platform", level: "platform", tokenEstimate: 500 }),
      makePrd({ id: "domain:d", level: "domain", tokenEstimate: 500 }),
    ];
    const trimmed = trimToBudget(chain, 1000);
    expect(trimmed).toHaveLength(2);
  });

  it("trims tool-category level before app level", () => {
    const chain = [
      makePrd({ id: "platform", level: "platform", tokenEstimate: 200 }),
      makePrd({ id: "app:a", level: "app", tokenEstimate: 400 }),
      makePrd({ id: "tc:c", level: "tool-category", tokenEstimate: 400 }),
    ];
    // Budget 600: total 1000 — need to drop 400 tokens
    // tool-category is lowest priority, so it should be dropped first
    const trimmed = trimToBudget(chain, 600);
    expect(trimmed.map((p) => p.level)).not.toContain("tool-category");
  });

  it("respects custom levelPriority", () => {
    const chain = [
      makePrd({ id: "platform", level: "platform", tokenEstimate: 200 }),
      makePrd({ id: "domain:d", level: "domain", tokenEstimate: 400 }),
      makePrd({ id: "app:a", level: "app", tokenEstimate: 400 }),
    ];
    // Custom: drop domain before app (reverse default)
    const trimmed = trimToBudget(chain, 400, ["platform", "app", "domain"]);
    expect(trimmed.map((p) => p.id)).not.toContain("domain:d");
    expect(trimmed.map((p) => p.id)).toContain("platform");
  });

  it("can reduce to only platform when budget is very tight", () => {
    const chain = [
      makePrd({ id: "platform", level: "platform", tokenEstimate: 200 }),
      makePrd({ id: "domain:d", level: "domain", tokenEstimate: 300 }),
      makePrd({ id: "route:/r", level: "route", tokenEstimate: 300 }),
      makePrd({ id: "app:a", level: "app", tokenEstimate: 300 }),
    ];
    const trimmed = trimToBudget(chain, 250);
    // Only platform should remain
    expect(trimmed.map((p) => p.id)).toContain("platform");
    expect(trimmed.map((p) => p.level)).not.toContain("domain");
    expect(trimmed.map((p) => p.level)).not.toContain("route");
    expect(trimmed.map((p) => p.level)).not.toContain("app");
  });
});
