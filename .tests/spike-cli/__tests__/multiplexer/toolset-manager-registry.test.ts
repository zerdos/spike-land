/**
 * Tests for ToolsetManager registry-backed meta-tools:
 *   spike__tool_search and spike__tool_catalog (lines 234-280)
 *
 * These paths require manager.registry to be set, which the existing tests don't cover.
 */

import { describe, expect, it, vi } from "vitest";
import { ToolsetManager } from "../../../../src/cli/spike-cli/core-logic/multiplexer/toolset-manager.js";
import type { DynamicToolRegistry } from "../../../../src/cli/spike-cli/core-logic/chat/tool-registry.js";
import type { NamespacedTool } from "../../../../src/cli/spike-cli/core-logic/multiplexer/server-manager.js";

function makeTool(name: string, description = ""): NamespacedTool {
  return {
    namespacedName: name,
    originalName: name,
    serverName: "spike",
    description,
    inputSchema: { type: "object", properties: {} },
  };
}

function makeRegistry(overrides: Partial<DynamicToolRegistry> = {}): DynamicToolRegistry {
  return {
    search: vi.fn().mockReturnValue({ query: "q", tools: [], totalMatches: 0 }),
    buildCatalog: vi.fn().mockReturnValue("catalog text"),
    resetToAlwaysOn: vi.fn(),
    activate: vi.fn(),
    getActiveTools: vi.fn().mockReturnValue([]),
    getSnapshot: vi.fn().mockReturnValue({ activatedToolNames: [] }),
    loadSnapshot: vi.fn(),
    ...overrides,
  } as unknown as DynamicToolRegistry;
}

describe("ToolsetManager — spike__tool_search with registry", () => {
  it("returns error when registry is not attached", () => {
    const mgr = new ToolsetManager({});
    const result = mgr.handleMetaTool("spike__tool_search", { query: "chess" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Dynamic tool registry not enabled");
  });

  it("returns error when query is missing", () => {
    const mgr = new ToolsetManager({});
    mgr.registry = makeRegistry();
    const result = mgr.handleMetaTool("spike__tool_search", {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("query is required");
  });

  it("returns empty result when registry finds nothing", () => {
    const mgr = new ToolsetManager({});
    mgr.registry = makeRegistry({
      search: vi.fn().mockReturnValue({ query: "unknown", tools: [], totalMatches: 0 }),
    } as Partial<DynamicToolRegistry>);

    const result = mgr.handleMetaTool("spike__tool_search", { query: "unknown" });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.found).toBe(0);
    expect(parsed.tools).toEqual([]);
  });

  it("returns matching tools with schemas", () => {
    const tool = makeTool("spike__chess_create_game", "Create a chess game");
    const mgr = new ToolsetManager({});
    mgr.registry = makeRegistry({
      search: vi.fn().mockReturnValue({ query: "chess", tools: [tool], totalMatches: 1 }),
    } as Partial<DynamicToolRegistry>);

    const result = mgr.handleMetaTool("spike__tool_search", { query: "chess" });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.found).toBe(1);
    expect(parsed.totalMatches).toBe(1);
    expect(parsed.tools[0].name).toBe("spike__chess_create_game");
    expect(parsed.tools[0].description).toBe("Create a chess game");
    expect(parsed.tools[0].inputSchema).toBeDefined();
  });

  it("passes max_results through to registry.search", () => {
    const searchMock = vi.fn().mockReturnValue({ query: "chess", tools: [], totalMatches: 0 });
    const mgr = new ToolsetManager({});
    mgr.registry = makeRegistry({ search: searchMock } as Partial<DynamicToolRegistry>);

    mgr.handleMetaTool("spike__tool_search", { query: "chess", max_results: 10 });
    expect(searchMock).toHaveBeenCalledWith("chess", 10);
  });

  it("defaults max_results to 5 when not provided", () => {
    const searchMock = vi.fn().mockReturnValue({ query: "chess", tools: [], totalMatches: 0 });
    const mgr = new ToolsetManager({});
    mgr.registry = makeRegistry({ search: searchMock } as Partial<DynamicToolRegistry>);

    mgr.handleMetaTool("spike__tool_search", { query: "chess" });
    expect(searchMock).toHaveBeenCalledWith("chess", 5);
  });
});

describe("ToolsetManager — spike__tool_catalog with registry", () => {
  it("returns error when registry is not attached", () => {
    const mgr = new ToolsetManager({});
    const result = mgr.handleMetaTool("spike__tool_catalog", {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Dynamic tool registry not enabled");
  });

  it("returns catalog text from registry.buildCatalog()", () => {
    const mgr = new ToolsetManager({});
    mgr.registry = makeRegistry({
      buildCatalog: vi.fn().mockReturnValue("## Chess tools\n- create_game"),
    } as Partial<DynamicToolRegistry>);

    const result = mgr.handleMetaTool("spike__tool_catalog", {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Chess tools");
  });
});

describe("ToolsetManager — getMetaTools includes registry tools when registry is set", () => {
  it("lists 5 meta-tools when registry is attached", () => {
    const mgr = new ToolsetManager({});
    mgr.registry = makeRegistry();

    const names = mgr.getMetaTools().map((t) => t.name);
    expect(names).toContain("spike__tool_search");
    expect(names).toContain("spike__tool_catalog");
    expect(names).toHaveLength(5);
  });

  it("isMetaTool returns true for registry meta-tool names", () => {
    const mgr = new ToolsetManager({});
    expect(mgr.isMetaTool("spike__tool_search")).toBe(true);
    expect(mgr.isMetaTool("spike__tool_catalog")).toBe(true);
  });
});
