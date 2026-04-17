import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import type { Env } from "../../../src/edge-api/main/core-logic/env.js";
import { analyticsMiddleware } from "../../../src/edge-api/main/api/middleware/analytics.js";

interface DataPoint {
  blobs?: string[];
  doubles?: number[];
  indexes?: string[];
}

function createMockAnalytics(): {
  binding: AnalyticsEngineDataset;
  writeDataPoint: ReturnType<typeof vi.fn>;
} {
  const writeDataPoint = vi.fn();
  const binding = { writeDataPoint } as unknown as AnalyticsEngineDataset;
  return { binding, writeDataPoint };
}

function createMockEnv(analytics: AnalyticsEngineDataset | undefined): Env {
  return {
    ANALYTICS: analytics as AnalyticsEngineDataset,
    R2: {} as R2Bucket,
    SPA_ASSETS: {} as R2Bucket,
    DB: {} as D1Database,
    STATUS_DB: {} as D1Database,
    LIMITERS: {} as DurableObjectNamespace,
    SPIKE_CHAT_SESSIONS: {} as DurableObjectNamespace,
    AUTH_MCP: {} as Fetcher,
    MCP_SERVICE: {} as Fetcher,
    STRIPE_SECRET_KEY: "",
    STRIPE_WEBHOOK_SECRET: "",
    CREEM_API_KEY: "",
    CREEM_WEBHOOK_SECRET: "",
    CREEM_PRO_PRODUCT_ID: "",
    CREEM_BUSINESS_PRODUCT_ID: "",
    GEMINI_API_KEY: "",
    CLAUDE_OAUTH_TOKEN: "",
    GITHUB_TOKEN: "",
    ALLOWED_ORIGINS: "https://spike.land",
    QUIZ_BADGE_SECRET: "",
    GA_MEASUREMENT_ID: "",
    GA_API_SECRET: "",
    INTERNAL_SERVICE_SECRET: "",
    WHATSAPP_APP_SECRET: "",
    WHATSAPP_ACCESS_TOKEN: "",
    WHATSAPP_PHONE_NUMBER_ID: "",
    WHATSAPP_VERIFY_TOKEN: "",
    MCP_INTERNAL_SECRET: "",
    CF_ZONE_ID: "",
    CF_CACHE_PURGE_TOKEN: "",
    XAI_API_KEY: "",
    ELEVENLABS_API_KEY: "",
    GOOGLE_CLIENT_ID: "",
    GOOGLE_CLIENT_SECRET: "",
    GOOGLE_REFRESH_TOKEN: "",
    GA_PROPERTY_ID: "",
  } as Env;
}

function makeApp(env: Env) {
  const app = new Hono<{ Bindings: Env }>();
  app.use("*", analyticsMiddleware);
  app.get("/api/foo", (c) => c.json({ ok: true }));
  app.get("/boom", () => {
    throw new Error("kaboom");
  });
  app.onError((_err, c) => c.json({ error: "Internal Server Error" }, 500));
  return { app, env };
}

describe("analyticsMiddleware", () => {
  it("writes a data point with the expected shape on a successful request", async () => {
    const { binding, writeDataPoint } = createMockAnalytics();
    const env = createMockEnv(binding);
    const { app } = makeApp(env);

    const res = await app.request(
      "http://edge.spike.land/api/foo",
      { method: "GET", headers: { host: "edge.spike.land" } },
      env,
    );

    expect(res.status).toBe(200);
    expect(writeDataPoint).toHaveBeenCalledTimes(1);

    const arg = writeDataPoint.mock.calls[0]?.[0] as DataPoint;
    expect(arg.blobs).toEqual(["/api/foo", "GET", "2xx"]);
    expect(arg.indexes).toEqual(["edge.spike.land"]);
    expect(arg.doubles).toBeDefined();
    expect(arg.doubles).toHaveLength(2);
    const [duration, statusCode] = arg.doubles ?? [];
    expect(typeof duration).toBe("number");
    expect(duration).toBeGreaterThanOrEqual(0);
    expect(statusCode).toBe(200);
  });

  it("records a 5xx data point even when the handler throws", async () => {
    const { binding, writeDataPoint } = createMockAnalytics();
    const env = createMockEnv(binding);
    const { app } = makeApp(env);

    const res = await app.request(
      "http://edge.spike.land/boom",
      { method: "GET", headers: { host: "edge.spike.land" } },
      env,
    );

    expect(res.status).toBe(500);
    expect(writeDataPoint).toHaveBeenCalledTimes(1);
    const arg = writeDataPoint.mock.calls[0]?.[0] as DataPoint;
    expect(arg.blobs?.[2]).toBe("5xx");
    expect(arg.doubles?.[1]).toBe(500);
  });

  it("is a no-op when the ANALYTICS binding is missing", async () => {
    const env = createMockEnv(undefined);
    const { app } = makeApp(env);

    const res = await app.request(
      "http://edge.spike.land/api/foo",
      { method: "GET", headers: { host: "edge.spike.land" } },
      env,
    );

    expect(res.status).toBe(200);
    // No binding => nothing to assert except no exceptions thrown above.
  });

  it("does not throw when writeDataPoint itself throws", async () => {
    const writeDataPoint = vi.fn(() => {
      throw new Error("analytics offline");
    });
    const binding = { writeDataPoint } as unknown as AnalyticsEngineDataset;
    const env = createMockEnv(binding);
    const { app } = makeApp(env);

    const res = await app.request(
      "http://edge.spike.land/api/foo",
      { method: "GET", headers: { host: "edge.spike.land" } },
      env,
    );

    expect(res.status).toBe(200);
    expect(writeDataPoint).toHaveBeenCalledTimes(1);
  });
});
