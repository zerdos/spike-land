/**
 * Smoke tests for the GoogleAdsClient REST plumbing — uses a mocked `fetch`
 * so no real Google Ads API call is made.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GoogleAdsClient } from "../../src/mcp-tools/google-ads/core-logic/ads-client.js";
import { GoogleAdsAuthClient } from "../../src/mcp-tools/google-ads/core-logic/google-oauth.js";

function makeAuth() {
  return new GoogleAdsAuthClient({
    clientId: "cid",
    clientSecret: "csecret",
    refreshToken: "rtoken",
    developerToken: "dtoken",
    customerId: "111-222-3333",
    loginCustomerId: "444-555-6666",
  });
}

const TOKEN_RESPONSE = { access_token: "fake-access", expires_in: 3600, token_type: "Bearer" };

describe("GoogleAdsClient (mocked fetch)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("strips dashes from customer IDs before building the search URL", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => TOKEN_RESPONSE })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ results: [{ campaign: { id: "1" } }] }],
      });

    const client = new GoogleAdsClient(makeAuth());
    const rows = await client.search("SELECT campaign.id FROM campaign");
    expect(rows).toEqual([{ campaign: { id: "1" } }]);

    const [searchUrl, searchInit] = fetchMock.mock.calls[1] as [
      string,
      { headers: Record<string, string>; body: string; method: string },
    ];
    expect(searchUrl).toContain("/customers/1112223333/googleAds:searchStream");
    expect(searchInit.method).toBe("POST");
    expect(searchInit.headers["Authorization"]).toBe("Bearer fake-access");
    expect(searchInit.headers["developer-token"]).toBe("dtoken");
    expect(searchInit.headers["login-customer-id"]).toBe("4445556666");
    expect(JSON.parse(searchInit.body)).toEqual({ query: "SELECT campaign.id FROM campaign" });
  });

  it("posts mutate operations to the mutate URL", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => TOKEN_RESPONSE })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ mutateOperationResponses: [] }) });

    const client = new GoogleAdsClient(makeAuth());
    const ops = [{ campaignOperation: { update: { resourceName: "x" } } }];
    const result = await client.mutate(ops);
    expect(result).toEqual({ mutateOperationResponses: [] });

    const [mutateUrl, init] = fetchMock.mock.calls[1] as [string, { body: string; method: string }];
    expect(mutateUrl).toContain("/customers/1112223333/googleAds:mutate");
    expect(JSON.parse(init.body)).toEqual({ mutateOperations: ops });
  });

  it("throws a descriptive error on non-2xx search response", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => TOKEN_RESPONSE })
      .mockResolvedValueOnce({ ok: false, status: 403, text: async () => "forbidden" });

    const client = new GoogleAdsClient(makeAuth());
    await expect(client.search("SELECT 1")).rejects.toThrow(/Google Ads API error \(403\)/);
  });
});
