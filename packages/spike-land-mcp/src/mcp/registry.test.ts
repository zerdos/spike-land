import { describe, it, expect, vi } from "vitest";
import { ToolRegistry, validateSchemaDescriptions } from "./registry";
import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

function createMockMcpServer(): McpServer {
  return {
    registerTool: vi.fn((_name: string, _config: unknown, handler: unknown): RegisteredTool => {
      let isEnabled = true;
      return {
        enable: () => { isEnabled = true; },
        disable: () => { isEnabled = false; },
        get enabled() { return isEnabled; },
        update: vi.fn(),
        remove: vi.fn(),
        handler: handler as RegisteredTool["handler"],
      };
    }),
  } as unknown as McpServer;
}

describe("validateSchemaDescriptions", () => {
  it("returns empty for undefined schema", () => {
    expect(validateSchemaDescriptions(undefined)).toEqual([]);
  });

  it("returns missing fields", () => {
    const schema = {
      name: z.string().describe("A name"),
      age: z.number(), // missing describe
    };
    const missing = validateSchemaDescriptions(schema);
    expect(missing).toEqual(["age"]);
  });

  it("returns empty when all fields have descriptions", () => {
    const schema = {
      name: z.string().describe("A name"),
      age: z.number().describe("An age"),
    };
    expect(validateSchemaDescriptions(schema)).toEqual([]);
  });
});

describe("ToolRegistry", () => {
  it("registers a tool and tracks it", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registry.register({
      name: "test_tool",
      description: "A test tool",
      category: "test-cat",
      tier: "free",
      handler: () => ({ content: [{ type: "text" as const, text: "ok" }] }),
    });

    expect(registry.getToolCount()).toBe(1);
    expect(server.registerTool).toHaveBeenCalledOnce();
  });

  it("disables non-alwaysEnabled tools by default", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registry.register({
      name: "test_tool",
      description: "A test tool",
      category: "test-cat",
      tier: "free",
      handler: () => ({ content: [{ type: "text" as const, text: "ok" }] }),
    });

    // Tool should be disabled (not always-enabled)
    expect(registry.getEnabledCount()).toBe(0);
  });

  it("keeps alwaysEnabled tools enabled", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registry.register({
      name: "search_tools",
      description: "Search tools",
      category: "gateway-meta",
      tier: "free",
      alwaysEnabled: true,
      handler: () => ({ content: [{ type: "text" as const, text: "ok" }] }),
    });

    expect(registry.getEnabledCount()).toBe(1);
  });

  it("enableCategory enables all tools in that category", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registry.register({
      name: "tool_a",
      description: "Tool A",
      category: "storage",
      tier: "free",
      handler: () => ({ content: [{ type: "text" as const, text: "a" }] }),
    });
    registry.register({
      name: "tool_b",
      description: "Tool B",
      category: "storage",
      tier: "free",
      handler: () => ({ content: [{ type: "text" as const, text: "b" }] }),
    });
    registry.register({
      name: "tool_c",
      description: "Tool C",
      category: "auth",
      tier: "free",
      handler: () => ({ content: [{ type: "text" as const, text: "c" }] }),
    });

    const enabled = registry.enableCategory("storage");
    expect(enabled).toEqual(["tool_a", "tool_b"]);
    expect(registry.getEnabledCount()).toBe(2);
  });

  it("disableCategory disables tools but not alwaysEnabled ones", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registry.register({
      name: "search_tools",
      description: "Search",
      category: "gateway-meta",
      tier: "free",
      alwaysEnabled: true,
      handler: () => ({ content: [{ type: "text" as const, text: "ok" }] }),
    });
    registry.register({
      name: "tool_a",
      description: "Tool A",
      category: "storage",
      tier: "free",
      handler: () => ({ content: [{ type: "text" as const, text: "a" }] }),
    });

    registry.enableCategory("storage");
    expect(registry.getEnabledCount()).toBe(2);

    registry.disableCategory("storage");
    // search_tools should remain enabled (alwaysEnabled)
    expect(registry.getEnabledCount()).toBe(1);
  });

  it("searchTools finds tools by keyword", async () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registry.register({
      name: "upload_file",
      description: "Upload a file to storage",
      category: "storage",
      tier: "free",
      handler: () => ({ content: [{ type: "text" as const, text: "ok" }] }),
    });
    registry.register({
      name: "send_message",
      description: "Send a chat message",
      category: "chat",
      tier: "free",
      handler: () => ({ content: [{ type: "text" as const, text: "ok" }] }),
    });

    const results = await registry.searchTools("storage");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some(r => r.name === "upload_file")).toBe(true);
  });

  it("listCategories returns correct structure", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registry.register({
      name: "tool_a",
      description: "Tool A",
      category: "storage",
      tier: "free",
      handler: () => ({ content: [{ type: "text" as const, text: "a" }] }),
    });
    registry.register({
      name: "tool_b",
      description: "Tool B",
      category: "storage",
      tier: "free",
      handler: () => ({ content: [{ type: "text" as const, text: "b" }] }),
    });

    const categories = registry.listCategories();
    expect(categories).toHaveLength(1);
    expect(categories[0]!.name).toBe("storage");
    expect(categories[0]!.toolCount).toBe(2);
    expect(categories[0]!.tools).toEqual(["tool_a", "tool_b"]);
  });

  it("getEnabledCategories returns only non-gateway enabled categories", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registry.register({
      name: "search_tools",
      description: "Search",
      category: "gateway-meta",
      tier: "free",
      alwaysEnabled: true,
      handler: () => ({ content: [{ type: "text" as const, text: "ok" }] }),
    });
    registry.register({
      name: "tool_a",
      description: "Tool A",
      category: "storage",
      tier: "free",
      handler: () => ({ content: [{ type: "text" as const, text: "a" }] }),
    });

    registry.enableCategory("storage");
    const enabled = registry.getEnabledCategories();
    expect(enabled).toEqual(["storage"]);
    expect(enabled).not.toContain("gateway-meta");
  });

  it("restoreCategories enables multiple categories", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registry.register({
      name: "tool_a",
      description: "Tool A",
      category: "storage",
      tier: "free",
      handler: () => ({ content: [{ type: "text" as const, text: "a" }] }),
    });
    registry.register({
      name: "tool_b",
      description: "Tool B",
      category: "chat",
      tier: "free",
      handler: () => ({ content: [{ type: "text" as const, text: "b" }] }),
    });

    registry.restoreCategories(["storage", "chat"]);
    expect(registry.getEnabledCount()).toBe(2);
  });

  it("callToolDirect returns error for unknown tool", async () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    const result = await registry.callToolDirect("nonexistent", {});
    expect(result.isError).toBe(true);
  });

  it("callToolDirect returns error for disabled tool", async () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registry.register({
      name: "tool_a",
      description: "Tool A",
      category: "storage",
      tier: "free",
      handler: () => ({ content: [{ type: "text" as const, text: "a" }] }),
    });

    const result = await registry.callToolDirect("tool_a", {});
    expect(result.isError).toBe(true);
    expect(result.content[0]).toEqual({ type: "text", text: "Tool disabled: tool_a" });
  });

  it("callToolDirect executes handler for enabled tool", async () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registry.register({
      name: "tool_a",
      description: "Tool A",
      category: "storage",
      tier: "free",
      handler: () => ({ content: [{ type: "text" as const, text: "success" }] }),
    });

    registry.enableCategory("storage");
    const result = await registry.callToolDirect("tool_a", {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0]).toEqual({ type: "text", text: "success" });
  });

  it("enableAll enables all tools", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registry.register({
      name: "tool_a",
      description: "A",
      category: "storage",
      tier: "free",
      handler: () => ({ content: [{ type: "text" as const, text: "a" }] }),
    });
    registry.register({
      name: "tool_b",
      description: "B",
      category: "chat",
      tier: "free",
      handler: () => ({ content: [{ type: "text" as const, text: "b" }] }),
    });

    const count = registry.enableAll();
    expect(count).toBe(2);
    expect(registry.getEnabledCount()).toBe(2);
  });
});
