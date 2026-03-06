import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { checkout } from "../../../src/edge-api/main/api/routes/checkout.js";
import type { Env } from "../../../src/edge-api/main/core-logic/env.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function createApp(envOverrides: Partial<Env> = {}, userId?: string) {
  const app = new Hono<{ Bindings: Env }>();

  app.use("*", async (c, next) => {
    Object.assign(c.env, envOverrides);
    if (userId !== undefined) {
      c.set("userId" as never, userId);
    }
    await next();
  });

  app.route("/", checkout);
  return app;
}

function mockFetch(responses: Array<{ ok: boolean; data: unknown }>) {
  let callIndex = 0;
  return vi.fn().mockImplementation(() => {
    const response = responses[callIndex++] ?? { ok: false, data: {} };
    return Promise.resolve({
      ok: response.ok,
      json: () => Promise.resolve(response.data),
    });
  });
}

const DEFAULT_ENV: Partial<Env> = {
  STRIPE_SECRET_KEY: "sk_test_mock",
};

const PRICE_LOOKUP_SUCCESS = {
  ok: true,
  data: { data: [{ id: "price_pro_monthly_123" }] },
};

const SESSION_CREATED_SUCCESS = {
  ok: true,
  data: { url: "https://checkout.stripe.com/session/abc123" },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/checkout", () => {
  let globalFetch: typeof fetch;

  beforeEach(() => {
    globalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = globalFetch;
    vi.restoreAllMocks();
  });

  describe("authentication", () => {
    it("returns 401 when userId is not set", async () => {
      const app = createApp(DEFAULT_ENV, undefined);

      const res = await app.request(
        "/api/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: "pro" }),
        },
        DEFAULT_ENV as unknown as Env,
      );

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: "Unauthorized" });
    });

    it("reads userId from c.get(userId) set by auth middleware, not headers", async () => {
      globalThis.fetch = mockFetch([PRICE_LOOKUP_SUCCESS, SESSION_CREATED_SUCCESS]);
      const app = createApp(DEFAULT_ENV, "user-from-middleware");

      const res = await app.request(
        "/api/checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": "user-from-header",
          },
          body: JSON.stringify({ tier: "pro" }),
        },
        DEFAULT_ENV as unknown as Env,
      );

      expect(res.status).toBe(200);
      // Verify the session was created with userId from middleware context
      const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const sessionCall = calls[1];
      expect(sessionCall[1].body).toContain("client_reference_id=user-from-middleware");
      expect(sessionCall[1].body).toContain("metadata%5BuserId%5D=user-from-middleware");
    });
  });

  describe("Stripe configuration", () => {
    it("returns 503 when STRIPE_SECRET_KEY is not configured", async () => {
      const app = createApp({}, "user-123");

      const res = await app.request(
        "/api/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: "pro" }),
        },
        {} as unknown as Env,
      );

      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body).toEqual({ error: "Stripe not configured" });
    });
  });

  describe("tier validation", () => {
    it("returns 400 for invalid tier 'free'", async () => {
      const app = createApp(DEFAULT_ENV, "user-123");

      const res = await app.request(
        "/api/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: "free" }),
        },
        DEFAULT_ENV as unknown as Env,
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("Invalid tier");
    });

    it("returns 400 for invalid tier 'elite'", async () => {
      const app = createApp(DEFAULT_ENV, "user-123");

      const res = await app.request(
        "/api/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: "elite" }),
        },
        DEFAULT_ENV as unknown as Env,
      );

      expect(res.status).toBe(400);
    });

    it("returns 400 when tier is missing", async () => {
      const app = createApp(DEFAULT_ENV, "user-123");

      const res = await app.request(
        "/api/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
        DEFAULT_ENV as unknown as Env,
      );

      expect(res.status).toBe(400);
    });

    it("accepts 'pro' tier", async () => {
      globalThis.fetch = mockFetch([PRICE_LOOKUP_SUCCESS, SESSION_CREATED_SUCCESS]);
      const app = createApp(DEFAULT_ENV, "user-123");

      const res = await app.request(
        "/api/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: "pro" }),
        },
        DEFAULT_ENV as unknown as Env,
      );

      expect(res.status).toBe(200);
    });

    it("accepts 'business' tier", async () => {
      globalThis.fetch = mockFetch([
        { ok: true, data: { data: [{ id: "price_biz_monthly_456" }] } },
        SESSION_CREATED_SUCCESS,
      ]);
      const app = createApp(DEFAULT_ENV, "user-123");

      const res = await app.request(
        "/api/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: "business" }),
        },
        DEFAULT_ENV as unknown as Env,
      );

      expect(res.status).toBe(200);
    });
  });

  describe("Stripe lookup_key mapping", () => {
    it("uses pro_monthly lookup_key for pro tier", async () => {
      globalThis.fetch = mockFetch([PRICE_LOOKUP_SUCCESS, SESSION_CREATED_SUCCESS]);
      const app = createApp(DEFAULT_ENV, "user-123");

      await app.request(
        "/api/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: "pro" }),
        },
        DEFAULT_ENV as unknown as Env,
      );

      const priceLookupCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(priceLookupCall[0]).toContain("lookup_keys%5B%5D=pro_monthly");
    });

    it("uses business_monthly lookup_key for business tier", async () => {
      globalThis.fetch = mockFetch([
        { ok: true, data: { data: [{ id: "price_biz" }] } },
        SESSION_CREATED_SUCCESS,
      ]);
      const app = createApp(DEFAULT_ENV, "user-123");

      await app.request(
        "/api/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: "business" }),
        },
        DEFAULT_ENV as unknown as Env,
      );

      const priceLookupCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(priceLookupCall[0]).toContain("lookup_keys%5B%5D=business_monthly");
    });
  });

  describe("request body validation", () => {
    it("returns 400 for invalid JSON body", async () => {
      const app = createApp(DEFAULT_ENV, "user-123");

      const res = await app.request(
        "/api/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "not-json{{{",
        },
        DEFAULT_ENV as unknown as Env,
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("Invalid JSON");
    });
  });

  describe("Stripe API error handling", () => {
    it("returns 502 when price lookup fails", async () => {
      globalThis.fetch = mockFetch([{ ok: false, data: { error: { message: "API error" } } }]);
      const app = createApp(DEFAULT_ENV, "user-123");

      const res = await app.request(
        "/api/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: "pro" }),
        },
        DEFAULT_ENV as unknown as Env,
      );

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.error).toContain("Failed to look up price");
    });

    it("returns 404 when no price found for tier", async () => {
      globalThis.fetch = mockFetch([{ ok: true, data: { data: [] } }]);
      const app = createApp(DEFAULT_ENV, "user-123");

      const res = await app.request(
        "/api/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: "pro" }),
        },
        DEFAULT_ENV as unknown as Env,
      );

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toContain("No price found for tier 'pro'");
    });

    it("returns 502 when session creation fails", async () => {
      globalThis.fetch = mockFetch([
        PRICE_LOOKUP_SUCCESS,
        { ok: false, data: { error: { message: "Session creation failed" } } },
      ]);
      const app = createApp(DEFAULT_ENV, "user-123");

      const res = await app.request(
        "/api/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: "pro" }),
        },
        DEFAULT_ENV as unknown as Env,
      );

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.error).toContain("Failed to create checkout session");
    });

    it("returns 502 when session has no URL", async () => {
      globalThis.fetch = mockFetch([
        PRICE_LOOKUP_SUCCESS,
        { ok: true, data: { id: "cs_test_abc" } }, // no url field
      ]);
      const app = createApp(DEFAULT_ENV, "user-123");

      const res = await app.request(
        "/api/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: "pro" }),
        },
        DEFAULT_ENV as unknown as Env,
      );

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.error).toContain("No checkout URL returned");
    });
  });

  describe("successful checkout", () => {
    it("returns checkout URL on success", async () => {
      globalThis.fetch = mockFetch([PRICE_LOOKUP_SUCCESS, SESSION_CREATED_SUCCESS]);
      const app = createApp(DEFAULT_ENV, "user-123");

      const res = await app.request(
        "/api/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: "pro" }),
        },
        DEFAULT_ENV as unknown as Env,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ url: "https://checkout.stripe.com/session/abc123" });
    });

    it("includes userId and tier in session metadata", async () => {
      globalThis.fetch = mockFetch([PRICE_LOOKUP_SUCCESS, SESSION_CREATED_SUCCESS]);
      const app = createApp(DEFAULT_ENV, "user-xyz");

      await app.request(
        "/api/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: "pro" }),
        },
        DEFAULT_ENV as unknown as Env,
      );

      const sessionCallBody = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].body;
      expect(sessionCallBody).toContain("metadata%5BuserId%5D=user-xyz");
      expect(sessionCallBody).toContain("metadata%5Btier%5D=pro");
    });
  });
});
