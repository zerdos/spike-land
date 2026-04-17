import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import type { Env } from "../../../src/edge-api/main/core-logic/env.js";
import { health } from "../../../src/edge-api/main/api/routes/health.js";
import {
  __resetLatencyBuffersForTests,
  getLatencyBuffer,
} from "../../../src/edge-api/common/core-logic/latency-buffer.js";

interface HealthBody {
  status: "ok" | "degraded";
  service: string;
  checks: Record<string, { status: "ok" | "degraded"; latency_ms: number; detail?: string }>;
  latency_summary: {
    p50_ms: number | null;
    p99_ms: number | null;
    sample_count: number;
    window_seconds: number;
  };
  degraded?: boolean;
}

function createMockEnv(overrides: Partial<Env> = {}): Env {
  return {
    R2: {
      head: vi.fn().mockResolvedValue(null),
    } as unknown as R2Bucket,
    SPA_ASSETS: {} as R2Bucket,
    DB: {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockResolvedValue({ success: true }),
        first: vi.fn().mockResolvedValue({ "1": 1 }),
      }),
      batch: vi.fn().mockResolvedValue([]),
    } as unknown as D1Database,
    STATUS_DB: {} as D1Database,
    LIMITERS: {} as DurableObjectNamespace,
    SPIKE_CHAT_SESSIONS: {} as DurableObjectNamespace,
    AUTH_MCP: {
      fetch: vi.fn().mockResolvedValue(new Response("{}", { status: 200 })),
    } as unknown as Fetcher,
    MCP_SERVICE: {
      fetch: vi.fn().mockResolvedValue(new Response("{}", { status: 200 })),
    } as unknown as Fetcher,
    STRIPE_SECRET_KEY: "sk_test",
    STRIPE_WEBHOOK_SECRET: "whsec",
    CREEM_API_KEY: "x",
    CREEM_WEBHOOK_SECRET: "x",
    CREEM_PRO_PRODUCT_ID: "x",
    CREEM_BUSINESS_PRODUCT_ID: "x",
    GEMINI_API_KEY: "x",
    CLAUDE_OAUTH_TOKEN: "x",
    GITHUB_TOKEN: "x",
    ALLOWED_ORIGINS: "https://spike.land",
    QUIZ_BADGE_SECRET: "x",
    GA_MEASUREMENT_ID: "x",
    GA_API_SECRET: "x",
    INTERNAL_SERVICE_SECRET: "x",
    WHATSAPP_APP_SECRET: "x",
    WHATSAPP_ACCESS_TOKEN: "x",
    WHATSAPP_PHONE_NUMBER_ID: "x",
    WHATSAPP_VERIFY_TOKEN: "x",
    MCP_INTERNAL_SECRET: "x",
    CF_ZONE_ID: "x",
    CF_CACHE_PURGE_TOKEN: "x",
    XAI_API_KEY: "x",
    ELEVENLABS_API_KEY: "x",
    GOOGLE_CLIENT_ID: "x",
    GOOGLE_CLIENT_SECRET: "x",
    GOOGLE_REFRESH_TOKEN: "x",
    GA_PROPERTY_ID: "x",
    ANALYTICS: {
      writeDataPoint: vi.fn(),
    } as unknown as AnalyticsEngineDataset,
    ...overrides,
  };
}

function makeApp(): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();
  app.route("/", health);
  return app;
}

describe("/health latency metrics (BUG-S6-18)", () => {
  beforeEach(() => {
    __resetLatencyBuffersForTests();
  });

  it("empty buffer → percentiles null, status 200, sample_count 0", async () => {
    const app = makeApp();
    const env = createMockEnv();

    const res = await app.request("/health", {}, env);
    expect(res.status).toBe(200);

    const body = (await res.json()) as HealthBody;
    expect(body.status).toBe("ok");
    expect(body.latency_summary).toEqual({
      p50_ms: null,
      p99_ms: null,
      sample_count: 0,
      window_seconds: 0,
    });
    expect(body.degraded).toBeUndefined();
  });

  it("populated buffer with known values → p50/p99 match expectations", async () => {
    const app = makeApp();
    const env = createMockEnv();

    const buf = getLatencyBuffer("spike-edge");
    for (let i = 1; i <= 100; i += 1) {
      buf.record(i);
    }

    const res = await app.request("/health", {}, env);
    expect(res.status).toBe(200);

    const body = (await res.json()) as HealthBody;
    expect(body.latency_summary.sample_count).toBe(100);
    expect(body.latency_summary.p50_ms).toBeCloseTo(50.5, 5);
    expect(body.latency_summary.p99_ms).toBeCloseTo(99.01, 5);
  });

  it("all deps healthy + p99 below threshold → 200, degraded false", async () => {
    const app = makeApp();
    const env = createMockEnv({ HEALTH_P99_THRESHOLD_MS: "5000" });

    const buf = getLatencyBuffer("spike-edge");
    for (let i = 0; i < 50; i += 1) {
      buf.record(50);
    }

    const res = await app.request("/health", {}, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as HealthBody;
    expect(body.status).toBe("ok");
    expect(body.degraded).toBeUndefined();
    expect(body.latency_summary.p99_ms).toBe(50);
  });

  it("failing dep → 503", async () => {
    const failingDb = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockRejectedValue(new Error("D1 unreachable")),
      }),
      batch: vi.fn(),
    } as unknown as D1Database;

    const app = makeApp();
    const env = createMockEnv({ DB: failingDb });

    const res = await app.request("/health", {}, env);
    expect(res.status).toBe(503);
    const body = (await res.json()) as HealthBody;
    expect(body.status).toBe("degraded");
    expect(body.checks.d1.status).toBe("degraded");
    expect(body.checks.d1.detail).toBe("D1 unreachable");
  });

  it("all deps healthy + p99 above threshold → 200 with degraded:true", async () => {
    const app = makeApp();
    const env = createMockEnv({ HEALTH_P99_THRESHOLD_MS: "100" });

    const buf = getLatencyBuffer("spike-edge");
    // 50 fast samples + 50 slow samples → p99 lands deep in the slow tail
    for (let i = 0; i < 50; i += 1) {
      buf.record(10);
    }
    for (let i = 0; i < 50; i += 1) {
      buf.record(500);
    }

    const res = await app.request("/health", {}, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as HealthBody;
    expect(body.status).toBe("ok");
    expect(body.degraded).toBe(true);
    expect(body.latency_summary.p99_ms).toBeGreaterThan(100);
  });

  it("falls back to default threshold (2000ms) when env var unset", async () => {
    const app = makeApp();
    const env = createMockEnv(); // HEALTH_P99_THRESHOLD_MS undefined

    const buf = getLatencyBuffer("spike-edge");
    // Half fast, half >2000ms — guarantees p99 > 2000
    for (let i = 0; i < 50; i += 1) {
      buf.record(50);
    }
    for (let i = 0; i < 50; i += 1) {
      buf.record(2500);
    }

    const res = await app.request("/health", {}, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as HealthBody;
    expect(body.degraded).toBe(true);
  });

  it("preserves legacy {status:'ok'} contract for existing consumers", async () => {
    const app = makeApp();
    const env = createMockEnv();

    const res = await app.request("/health", {}, env);
    const body = (await res.json()) as HealthBody;
    expect(body.status).toBe("ok");
    expect(body.service).toBe("spike-edge");
    // Legacy + new fields both present
    expect(body.checks).toBeDefined();
    expect(body.latency_summary).toBeDefined();
  });
});
