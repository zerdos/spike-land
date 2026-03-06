import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockServer } from "@spike-land-ai/mcp-server-base";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerReportTools } from "../../../src/mcp-tools/google-analytics/mcp/reports.js";
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

describe("ga4_run_report", () => {
  let mockServer: ReturnType<typeof createMockServer>;
  let auth: GoogleAuthClient;

  beforeEach(() => {
    mockServer = createMockServer();
    auth = createMockAuth();
    registerReportTools(mockServer as unknown as McpServer, auth, "123456");
    vi.restoreAllMocks();
    vi.spyOn(auth, "authHeaders").mockResolvedValue({
      Authorization: "Bearer test-token",
      "Content-Type": "application/json",
    });
  });

  it("should make correct API call with dimensions and metrics", async () => {
    const mockResponse = {
      rows: [{ dimensionValues: [{ value: "20260301" }], metricValues: [{ value: "100" }] }],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await mockServer.call("ga4_run_report", {
      dimensions: ["date"],
      metrics: ["sessions"],
      date_range_start: "2026-03-01",
      date_range_end: "2026-03-05",
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.rows).toHaveLength(1);

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    expect(fetchCall[0]).toBe(
      "https://analyticsdata.googleapis.com/v1beta/properties/123456:runReport",
    );
    const body = JSON.parse(fetchCall[1]?.body as string);
    expect(body.dimensions).toEqual([{ name: "date" }]);
    expect(body.metrics).toEqual([{ name: "sessions" }]);
    expect(body.dateRanges).toEqual([{ startDate: "2026-03-01", endDate: "2026-03-05" }]);
    expect(body.limit).toBe(1000);

    vi.unstubAllGlobals();
  });

  it("should handle API errors gracefully", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve("Forbidden"),
      }),
    );

    const result = await mockServer.call("ga4_run_report", {
      dimensions: ["date"],
      metrics: ["sessions"],
      date_range_start: "2026-03-01",
      date_range_end: "2026-03-05",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("GA4_API_ERROR");
    expect(result.content[0].text).toContain("403");

    vi.unstubAllGlobals();
  });

  it("should handle network errors gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failed")));

    const result = await mockServer.call("ga4_run_report", {
      dimensions: ["date"],
      metrics: ["sessions"],
      date_range_start: "2026-03-01",
      date_range_end: "2026-03-05",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("NETWORK_ERROR");

    vi.unstubAllGlobals();
  });

  it("should pass optional limit and offset", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ rows: [] }),
      }),
    );

    await mockServer.call("ga4_run_report", {
      dimensions: ["country"],
      metrics: ["activeUsers"],
      date_range_start: "2026-03-01",
      date_range_end: "2026-03-05",
      limit: 50,
      offset: 100,
    });

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(body.limit).toBe(50);
    expect(body.offset).toBe(100);

    vi.unstubAllGlobals();
  });
});

describe("ga4_batch_report", () => {
  let mockServer: ReturnType<typeof createMockServer>;
  let auth: GoogleAuthClient;

  beforeEach(() => {
    mockServer = createMockServer();
    auth = createMockAuth();
    registerReportTools(mockServer as unknown as McpServer, auth, "123456");
    vi.restoreAllMocks();
    vi.spyOn(auth, "authHeaders").mockResolvedValue({
      Authorization: "Bearer test-token",
      "Content-Type": "application/json",
    });
  });

  it("should batch multiple reports in a single request", async () => {
    const mockResponse = { reports: [{ rows: [] }, { rows: [] }] };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await mockServer.call("ga4_batch_report", {
      reports: [
        {
          dimensions: ["date"],
          metrics: ["sessions"],
          date_range_start: "2026-03-01",
          date_range_end: "2026-03-05",
        },
        {
          dimensions: ["country"],
          metrics: ["activeUsers"],
          date_range_start: "2026-03-01",
          date_range_end: "2026-03-05",
        },
      ],
    });

    expect(result.isError).toBeUndefined();

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    expect(fetchCall[0]).toBe(
      "https://analyticsdata.googleapis.com/v1beta/properties/123456:batchRunReports",
    );
    const body = JSON.parse(fetchCall[1]?.body as string);
    expect(body.requests).toHaveLength(2);

    vi.unstubAllGlobals();
  });

  it("should handle batch API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve("Bad Request"),
      }),
    );

    const result = await mockServer.call("ga4_batch_report", {
      reports: [
        {
          dimensions: ["date"],
          metrics: ["sessions"],
          date_range_start: "2026-03-01",
          date_range_end: "2026-03-05",
        },
      ],
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("GA4_API_ERROR");

    vi.unstubAllGlobals();
  });
});
