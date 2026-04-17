import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ENV_VAR_NAMES,
  clientFromEnv,
  parseGoogleAdsEnv,
} from "../../src/mcp-tools/google-ads/core-logic/env.js";
import { createGoogleAdsMcpServer } from "../../src/mcp-tools/google-ads/mcp/index.js";

const fullEnv = {
  GOOGLE_ADS_DEVELOPER_TOKEN: "dev-token",
  GOOGLE_ADS_REFRESH_TOKEN: "refresh-token",
  GOOGLE_ADS_CLIENT_ID: "client-id",
  GOOGLE_ADS_CLIENT_SECRET: "client-secret",
  GOOGLE_ADS_CUSTOMER_ID: "123-456-7890",
};

describe("parseGoogleAdsEnv", () => {
  it("returns ok=true with all required vars present", () => {
    const result = parseGoogleAdsEnv(fullEnv);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.env.GOOGLE_ADS_DEVELOPER_TOKEN).toBe("dev-token");
      expect(result.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID).toBeUndefined();
    }
  });

  it("accepts optional GOOGLE_ADS_LOGIN_CUSTOMER_ID", () => {
    const result = parseGoogleAdsEnv({
      ...fullEnv,
      GOOGLE_ADS_LOGIN_CUSTOMER_ID: "111-222-3333",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID).toBe("111-222-3333");
    }
  });

  it("returns ok=false with the list of missing vars when env is empty", () => {
    const result = parseGoogleAdsEnv({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toEqual(ENV_VAR_NAMES);
      expect(result.error).toMatch(/GOOGLE_ADS_\* env vars not configured/);
    }
  });

  it("flags only the keys that are missing", () => {
    const partial = { ...fullEnv };
    delete (partial as Record<string, string | undefined>).GOOGLE_ADS_REFRESH_TOKEN;
    const result = parseGoogleAdsEnv(partial);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toContain("GOOGLE_ADS_REFRESH_TOKEN");
      expect(result.missing).not.toContain("GOOGLE_ADS_DEVELOPER_TOKEN");
    }
  });

  it("treats empty strings as missing", () => {
    const result = parseGoogleAdsEnv({ ...fullEnv, GOOGLE_ADS_CLIENT_ID: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toContain("GOOGLE_ADS_CLIENT_ID");
    }
  });
});

describe("clientFromEnv", () => {
  it("strips dashes from customer IDs (Google Ads API requires numeric only)", () => {
    const parsed = parseGoogleAdsEnv({
      ...fullEnv,
      GOOGLE_ADS_LOGIN_CUSTOMER_ID: "111-222-3333",
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const client = clientFromEnv(parsed.env);
    expect(client.getCustomerId()).toBe("1234567890");
  });
});

describe("createGoogleAdsMcpServer (env-missing path)", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network call not allowed in tests"));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts even when env is missing and exposes NOT_CONFIGURED tools", () => {
    const server = createGoogleAdsMcpServer({});
    expect(server).toBeDefined();
    expect(typeof (server as unknown as { tool: unknown }).tool).toBe("function");
  });

  it("starts with full env without contacting the network", () => {
    const server = createGoogleAdsMcpServer(fullEnv);
    expect(server).toBeDefined();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
