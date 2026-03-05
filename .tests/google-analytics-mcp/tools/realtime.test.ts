import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockServer } from "@spike-land-ai/mcp-server-base";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerRealtimeTool } from "../../../src/google-analytics-mcp/tools/realtime.js";
import { GoogleAuthClient } from "../../../src/google-analytics-mcp/auth/google-oauth.js";

function createMockAuth(): GoogleAuthClient {
  const auth = new GoogleAuthClient({
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    refreshToken: "test-refresh-token",
  });
  vi.spyOn(auth, "authHeaders").mockResolvedValue({
    Authorization: "Bearer test-token",
    "Content-Type": "application/json",
  });
  return auth;
}

describe("ga4_realtime_report", () => {
  let mockServer: ReturnType<typeof createMockServer>;
  let auth: GoogleAuthClient;

  beforeEach(() => {
    mockServer = createMockServer();
    auth = createMockAuth();
    registerRealtimeTool(mockServer as unknown as McpServer, auth, "123456");
    vi.restoreAllMocks();
    vi.spyOn(auth, "authHeaders").mockResolvedValue({
      Authorization: "Bearer test-token",
      "Content-Type": "application/json",
    });
  });

  it("should make correct realtime API call", async () => {
    const mockResponse = {
      rows: [{ metricValues: [{ value: "42" }] }],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await mockServer.call("ga4_realtime_report", {
      metrics: ["activeUsers"],
      limit: 100,
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.rows[0].metricValues[0].value).toBe("42");

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    expect(fetchCall[0]).toBe(
      "https://analyticsdata.googleapis.com/v1beta/properties/123456:runRealtimeReport",
    );
    const body = JSON.parse(fetchCall[1]?.body as string);
    expect(body.metrics).toEqual([{ name: "activeUsers" }]);
    expect(body.limit).toBe(100);
    expect(body.dimensions).toBeUndefined();

    vi.unstubAllGlobals();
  });

  it("should include dimensions when provided", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ rows: [] }),
      }),
    );

    await mockServer.call("ga4_realtime_report", {
      dimensions: ["country", "deviceCategory"],
      metrics: ["activeUsers"],
      limit: 50,
    });

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(body.dimensions).toEqual([{ name: "country" }, { name: "deviceCategory" }]);

    vi.unstubAllGlobals();
  });

  it("should handle API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve("Rate limit exceeded"),
      }),
    );

    const result = await mockServer.call("ga4_realtime_report", {
      metrics: ["activeUsers"],
      limit: 100,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("GA4_API_ERROR");
    expect(result.content[0].text).toContain("429");

    vi.unstubAllGlobals();
  });

  it("should handle network errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Connection refused")));

    const result = await mockServer.call("ga4_realtime_report", {
      metrics: ["activeUsers"],
      limit: 100,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("NETWORK_ERROR");

    vi.unstubAllGlobals();
  });
});
