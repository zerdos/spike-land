/**
 * Test utilities for google-ads-mcp.
 */

import { vi } from "vitest";
import {
  type CallToolResult,
  createMockServer as createBaseServer,
  type ToolHandler,
} from "@spike-land-ai/mcp-server-base";

export interface MockMcpServer {
  tool: ReturnType<typeof vi.fn>;
  handlers: Map<string, ToolHandler>;
  call: (name: string, args: Record<string, unknown>) => Promise<CallToolResult>;
}

export function createMockServer(): MockMcpServer {
  const base = createBaseServer();
  const toolFn = vi.fn(base.tool);
  return { ...base, tool: toolFn };
}

export function createMockAdsClient(overrides: {
  search?: (query: string) => Promise<unknown[]>;
  mutate?: (ops: unknown[]) => Promise<unknown>;
  getCustomerId?: () => string;
} = {}) {
  return {
    search: overrides.search ?? vi.fn().mockResolvedValue([]),
    mutate: overrides.mutate ?? vi.fn().mockResolvedValue({ results: [] }),
    getCustomerId: overrides.getCustomerId ?? vi.fn().mockReturnValue("1234567890"),
  };
}
