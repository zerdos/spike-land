import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { checkout } from "../../../src/edge-api/main/api/routes/checkout.js";
import type { Env } from "../../../src/edge-api/main/core-logic/env.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function createApp(envOverrides: Partial<Env> = {}, userId?: string, userEmail?: string) {
  const app = new Hono<{ Bindings: Env }>();

  app.use("*", async (c, next) => {
    Object.assign(c.env, envOverrides);
    if (userId !== undefined) {
      c.set("userId" as never, userId);
    }
    if (userEmail !== undefined) {
      c.set("userEmail" as never, userEmail);
    }
    await next();
  });

  app.route("/", checkout);
  return app;
}

function mockFetch(responses: Array<{ ok: boolean; status?: number; data: unknown }>) {
  let callIndex = 0;
  return vi.fn().mockImplementation(() => {
    const response = responses[callIndex++] ?? { ok: false, status: 500, data: {} };
    return Promise.resolve({
      ok: response.ok,
      status: response.status ?? (response.ok ? 200 : 400),
      json: () => Promise.resolve(response.data),
    });
  });
}

const DEFAULT_ENV: Partial<Env> = {
  CREEM_API_KEY: "creem_test_mock",
  CREEM_PRO_PRODUCT_ID: "prod_pro_123",
  CREEM_BUSINESS_PRODUCT_ID: "prod_biz_456",
};

const CHECKOUT_SUCCESS = {
  ok: true,
  data: {
    id: "ch_test_abc",
    checkout_url: "https://checkout.creem.io/session/abc123",
    product_id: "prod_pro_123",
    status: "active",
  },
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
      globalThis.fetch = mockFetch([CHECKOUT_SUCCESS]);
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
      const checkoutCall = calls[0];
      const sentBody = JSON.parse(checkoutCall[1].body as string) as Record<string, unknown>;
      expect((sentBody.metadata as Record<string, unknown>)["userId"]).toBe("user-from-middleware");
    });
  });

  describe("Creem configuration", () => {
    it("returns 503 when CREEM_API_KEY is not configured", async () => {
      const app = createApp(
        { CREEM_PRO_PRODUCT_ID: "prod_pro_123", CREEM_BUSINESS_PRODUCT_ID: "prod_biz_456" },
        "user-123",
      );

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
      expect(body).toEqual({ error: "Payment provider not configured" });
    });

    it("returns 503 when product ID is not configured for tier", async () => {
      const app = createApp({ CREEM_API_KEY: "creem_test_mock" }, "user-123");

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
      expect(body.error).toContain("Product not configured for tier");
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
      globalThis.fetch = mockFetch([CHECKOUT_SUCCESS]);
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
        {
          ok: true,
          data: {
            id: "ch_test_biz",
            checkout_url: "https://checkout.creem.io/session/biz123",
            product_id: "prod_biz_456",
            status: "active",
          },
        },
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

  describe("Creem product ID mapping", () => {
    it("sends CREEM_PRO_PRODUCT_ID for pro tier", async () => {
      globalThis.fetch = mockFetch([CHECKOUT_SUCCESS]);
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

      const checkoutCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const sentBody = JSON.parse(checkoutCall[1].body as string) as Record<string, unknown>;
      expect(sentBody.product_id).toBe("prod_pro_123");
    });

    it("sends CREEM_BUSINESS_PRODUCT_ID for business tier", async () => {
      globalThis.fetch = mockFetch([
        {
          ok: true,
          data: {
            id: "ch_test_biz",
            checkout_url: "https://checkout.creem.io/session/biz123",
            product_id: "prod_biz_456",
            status: "active",
          },
        },
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

      const checkoutCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const sentBody = JSON.parse(checkoutCall[1].body as string) as Record<string, unknown>;
      expect(sentBody.product_id).toBe("prod_biz_456");
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

  describe("Creem API error handling", () => {
    it("returns 502 when checkout creation fails", async () => {
      globalThis.fetch = mockFetch([{ ok: false, status: 400, data: { message: "API error" } }]);
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

    it("returns 502 when checkout response has no URL", async () => {
      globalThis.fetch = mockFetch([
        { ok: true, data: { id: "ch_test_abc", status: "active" } }, // no checkout_url field
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
      globalThis.fetch = mockFetch([CHECKOUT_SUCCESS]);
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
      expect(body).toEqual({ url: "https://checkout.creem.io/session/abc123" });
    });

    it("includes userId and tier in session metadata", async () => {
      globalThis.fetch = mockFetch([CHECKOUT_SUCCESS]);
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

      const checkoutCallBody = JSON.parse(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
      ) as Record<string, unknown>;
      expect((checkoutCallBody.metadata as Record<string, unknown>)["userId"]).toBe("user-xyz");
      expect((checkoutCallBody.metadata as Record<string, unknown>)["tier"]).toBe("pro");
    });

    it("includes customer email when available", async () => {
      globalThis.fetch = mockFetch([CHECKOUT_SUCCESS]);
      const app = createApp(DEFAULT_ENV, "user-123", "user@example.com");

      await app.request(
        "/api/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: "pro" }),
        },
        DEFAULT_ENV as unknown as Env,
      );

      const checkoutCallBody = JSON.parse(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
      ) as Record<string, unknown>;
      expect((checkoutCallBody.customer as Record<string, unknown>)["email"]).toBe(
        "user@example.com",
      );
    });
  });
});
