import { describe, it, expect } from "vitest";
import { getDependencyGroupName, deduplicateDepGroup } from "../../scripts/reorganize-config.js";

describe("getDependencyGroupName", () => {
  it("returns core-logic for empty deps", () => {
    expect(getDependencyGroupName(new Set())).toBe("core-logic");
  });

  it("returns testing for playwright dep", () => {
    expect(getDependencyGroupName(new Set(["playwright"]))).toBe("testing");
  });

  it("returns ai for anthropic sdk dep", () => {
    expect(getDependencyGroupName(new Set(["@anthropic-ai/sdk"]))).toBe("ai");
  });

  it("returns db for drizzle dep", () => {
    expect(getDependencyGroupName(new Set(["drizzle-orm"]))).toBe("db");
  });

  it("returns api for hono dep", () => {
    expect(getDependencyGroupName(new Set(["hono"]))).toBe("api");
  });

  it("returns video for remotion dep", () => {
    expect(getDependencyGroupName(new Set(["remotion"]))).toBe("video");
  });

  it("returns cli for commander dep", () => {
    expect(getDependencyGroupName(new Set(["commander"]))).toBe("cli");
  });

  it("returns auth for better-auth dep", () => {
    expect(getDependencyGroupName(new Set(["better-auth"]))).toBe("auth");
  });

  it("returns payments for stripe dep", () => {
    expect(getDependencyGroupName(new Set(["stripe"]))).toBe("payments");
  });

  it("returns ui for react dep", () => {
    expect(getDependencyGroupName(new Set(["react"]))).toBe("ui");
  });

  it("returns node-sys for node: builtins with no other tags", () => {
    expect(getDependencyGroupName(new Set(["node:fs"]))).toBe("node-sys");
  });

  it("combines multiple tags in priority order (max 3)", () => {
    const result = getDependencyGroupName(new Set(["hono", "drizzle-orm", "better-auth"]));
    expect(result).toBe("db-api-auth");
  });

  it("falls back to semantic name for known packages", () => {
    // chess.js → chess-core
    expect(getDependencyGroupName(new Set(["chess.js"]))).toBe("chess-core");
  });

  it("returns lazy-imports as last resort for unknown deps", () => {
    expect(getDependencyGroupName(new Set(["totally-unknown-package-xyz"]))).toBe("lazy-imports");
  });

  it("does not add ui tag when editor tag already present", () => {
    const result = getDependencyGroupName(new Set(["monaco", "react"]));
    expect(result).toBe("editor");
    expect(result).not.toContain("ui");
  });
});

describe("deduplicateDepGroup", () => {
  it("returns core-logic when depGroup equals category", () => {
    expect(deduplicateDepGroup("cli", "cli")).toBe("core-logic");
    expect(deduplicateDepGroup("frontend", "frontend")).toBe("core-logic");
  });

  it("returns the depGroup unchanged when it does not match category", () => {
    expect(deduplicateDepGroup("api", "edge-api")).toBe("api");
    expect(deduplicateDepGroup("ui", "frontend")).toBe("ui");
  });

  it("handles combined tags that start with the category name", () => {
    // "cli-auth" does not equal "cli", so it should be kept
    expect(deduplicateDepGroup("cli-auth", "cli")).toBe("cli-auth");
  });
});
