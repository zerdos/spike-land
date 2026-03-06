import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockServer } from "@spike-land-ai/mcp-server-base";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMetadataTools } from "../../../src/mcp-tools/google-analytics/mcp/metadata.js";
import { GoogleAuthClient } from "../../../src/mcp-tools/google-analytics/core-logic/google-oauth.js";

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

describe("ga4_metadata", () => {
  let mockServer: ReturnType<typeof createMockServer>;
  let auth: GoogleAuthClient;

  beforeEach(() => {
    mockServer = createMockServer();
    auth = createMockAuth();
    registerMetadataTools(mockServer as unknown as McpServer, auth, "123456");
    vi.restoreAllMocks();
    vi.spyOn(auth, "authHeaders").mockResolvedValue({
      Authorization: "Bearer test-token",
      "Content-Type": "application/json",
    });
  });

  it("should fetch metadata for the property", async () => {
    const mockMetadata = {
      dimensions: [{ apiName: "date", uiName: "Date" }],
      metrics: [{ apiName: "sessions", uiName: "Sessions" }],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMetadata),
      }),
    );

    const result = await mockServer.call("ga4_metadata", {});

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.dimensions).toHaveLength(1);
    expect(data.metrics).toHaveLength(1);

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    expect(fetchCall[0]).toBe(
      "https://analyticsdata.googleapis.com/v1beta/properties/123456/metadata",
    );
    expect(fetchCall[1]?.method).toBe("GET");

    vi.unstubAllGlobals();
  });

  it("should handle metadata API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve("Not Found"),
      }),
    );

    const result = await mockServer.call("ga4_metadata", {});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("GA4_API_ERROR");

    vi.unstubAllGlobals();
  });
});

describe("ga4_list_properties", () => {
  let mockServer: ReturnType<typeof createMockServer>;
  let auth: GoogleAuthClient;

  beforeEach(() => {
    mockServer = createMockServer();
    auth = createMockAuth();
    registerMetadataTools(mockServer as unknown as McpServer, auth, "123456");
    vi.restoreAllMocks();
    vi.spyOn(auth, "authHeaders").mockResolvedValue({
      Authorization: "Bearer test-token",
      "Content-Type": "application/json",
    });
  });

  it("should list properties without filter", async () => {
    const mockProperties = {
      properties: [{ name: "properties/123456", displayName: "My Site" }],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProperties),
      }),
    );

    const result = await mockServer.call("ga4_list_properties", {});

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.properties).toHaveLength(1);

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    expect(fetchCall[0]).toBe(
      "https://analyticsadmin.googleapis.com/v1beta/properties",
    );

    vi.unstubAllGlobals();
  });

  it("should pass filter parameter when provided", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ properties: [] }),
      }),
    );

    await mockServer.call("ga4_list_properties", {
      filter: "parent:accounts/999",
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    expect(fetchCall[0]).toBe(
      "https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent%3Aaccounts%2F999",
    );

    vi.unstubAllGlobals();
  });

  it("should handle admin API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve("Permission denied"),
      }),
    );

    const result = await mockServer.call("ga4_list_properties", {});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("GA4_ADMIN_API_ERROR");

    vi.unstubAllGlobals();
  });

  it("should handle network errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("DNS resolution failed")));

    const result = await mockServer.call("ga4_list_properties", {});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("NETWORK_ERROR");

    vi.unstubAllGlobals();
  });
});
