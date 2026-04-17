import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockServer, createMockAdsClient } from "../__test-utils__/index.js";
import type { MockMcpServer } from "../__test-utils__/index.js";
import { registerLifecycleTools } from "../../../src/mcp-tools/google-ads/mcp/lifecycle.js";
import type { GoogleAdsClient } from "../../../src/mcp-tools/google-ads/core-logic/ads-client.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

describe("lifecycle tools (destructive)", () => {
  let server: MockMcpServer;
  let mockClient: ReturnType<typeof createMockAdsClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    server = createMockServer();
    mockClient = createMockAdsClient();
    registerLifecycleTools(
      server as unknown as McpServer,
      mockClient as unknown as GoogleAdsClient,
    );
  });

  it("registers both pause and resume tools", () => {
    expect(server.tool).toHaveBeenCalledTimes(2);
    const toolNames = server.tool.mock.calls.map((c: unknown[]) => c[0]);
    expect(toolNames).toContain("ads_pause_campaign");
    expect(toolNames).toContain("ads_resume_campaign");
  });

  it("flags both tools as DESTRUCTIVE in description", () => {
    const calls = server.tool.mock.calls as unknown[][];
    for (const call of calls) {
      expect(String(call[1])).toMatch(/DESTRUCTIVE/);
    }
  });

  describe("ads_pause_campaign", () => {
    it("declares a non-empty campaign_id in its Zod schema", () => {
      const call = server.tool.mock.calls.find((c: unknown[]) => c[0] === "ads_pause_campaign");
      expect(call).toBeDefined();
      const schema = (call as unknown as unknown[])[2] as Record<
        string,
        { safeParse(v: unknown): { success: boolean } }
      >;
      expect(schema.campaign_id.safeParse("").success).toBe(false);
      expect(schema.campaign_id.safeParse("123").success).toBe(true);
    });

    it("issues a status=PAUSED mutate operation", async () => {
      mockClient.mutate = vi.fn().mockResolvedValue({ mutateOperationResponses: [] });
      const result = await server.call("ads_pause_campaign", { campaign_id: "123" });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.new_status).toBe("PAUSED");
      const ops = (mockClient.mutate as ReturnType<typeof vi.fn>).mock.calls[0][0] as Array<{
        campaignOperation: { update: { status: string; resourceName: string }; updateMask: string };
      }>;
      expect(ops[0].campaignOperation.update.status).toBe("PAUSED");
      expect(ops[0].campaignOperation.update.resourceName).toContain("/campaigns/123");
      expect(ops[0].campaignOperation.updateMask).toBe("status");
    });

    it("returns retryable API_ERROR on mutate failure", async () => {
      mockClient.mutate = vi.fn().mockRejectedValue(new Error("rate limited"));
      const result = await server.call("ads_pause_campaign", { campaign_id: "123" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("API_ERROR");
      expect(result.content[0].text).toContain("**Retryable:** true");
    });
  });

  describe("ads_resume_campaign", () => {
    it("issues a status=ENABLED mutate operation", async () => {
      mockClient.mutate = vi.fn().mockResolvedValue({ mutateOperationResponses: [] });
      const result = await server.call("ads_resume_campaign", { campaign_id: "456" });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.new_status).toBe("ENABLED");
      const ops = (mockClient.mutate as ReturnType<typeof vi.fn>).mock.calls[0][0] as Array<{
        campaignOperation: { update: { status: string } };
      }>;
      expect(ops[0].campaignOperation.update.status).toBe("ENABLED");
    });
  });
});
