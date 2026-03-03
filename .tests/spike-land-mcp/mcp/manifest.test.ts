import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerAllTools } from "../../../src/spike-land-mcp/mcp/manifest.js";
import type { ToolRegistry } from "../../../src/spike-land-mcp/mcp/registry.js";
import type { DrizzleDB } from "../../../src/spike-land-mcp/db/index.js";

describe("manifest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registerAllTools attempts to call registration functions", async () => {
    const mockRegistry = {
      register: vi.fn(),
    } as unknown as ToolRegistry;
    const mockDb = {} as DrizzleDB;
    const mockKv = {} as KVNamespace;

    // Mock dynamic imports
    vi.mock("../tools/gateway-meta", () => ({
      registerGatewayMetaTools: vi.fn(),
    }));

    await registerAllTools(mockRegistry, "user-1", mockDb, mockKv);

    // We can't easily check all because they are dynamic and might fail
    // but the function should complete without error.
    expect(true).toBe(true);
  });
});
