/**
 * Support Routes — Blog Engagement, Donations & Migration Checkout
 *
 * GET  /api/support/engagement/:slug     — Fist bump + supporter counts
 * POST /api/support/fistbump             — Record a fist bump
 * POST /api/support/donate               — Create Stripe checkout for blog donation
 * POST /api/support/migration-checkout   — Create Stripe checkout for migration service
 */

import { Hono } from "hono";
import type { Env } from "../../core-logic/env.js";
import { createLogger } from "@spike-land-ai/shared";

const log = createLogger("spike-edge");

const support = new Hono<{ Bindings: Env }>();

const STRIPE_API_VERSION = "2024-06-20";

// ─── Blog Engagement ────────────────────────────────────────────────────────

support.get("/api/support/engagement/:slug", async (c) => {
  const slug = decodeURIComponent(c.req.param("slug"));
  const db = c.env.DB;

  try {
    const bumps = await db
      .prepare("SELECT COUNT(*) as cnt FROM blog_engagement WHERE slug = ? AND type = 'fistbump'")
      .bind(slug)
      .first<{ cnt: number }>();

    const donors = await db
      .prepare(
        "SELECT COUNT(*) as cnt FROM support_donations WHERE slug = ? AND status = 'completed'",
      )
      .bind(slug)
      .first<{ cnt: number }>();

    return c.json({
      fistBumps: bumps?.cnt ?? 0,
      supporters: donors?.cnt ?? 0,
    });
  } catch (err) {
    log.error("engagement fetch error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return c.json({ fistBumps: 0, supporters: 0 });
  }
});

// ─── Fist Bump ──────────────────────────────────────────────────────────────

support.post("/api/support/fistbump", async (c) => {
  let body: { slug?: string; clientId?: string };
  try {
    body = (await c.req.json()) as { slug?: string; clientId?: string };
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const { slug, clientId } = body;
  if (!slug || typeof slug !== "string") {
    return c.json({ error: "slug is required" }, 400);
  }
  if (!clientId || typeof clientId !== "string") {
    return c.json({ error: "clientId is required" }, 400);
  }

  const safeSlug = slug.slice(0, 200);
  const safeClientId = clientId.slice(0, 100);
  const db = c.env.DB;

  try {
    await db
      .prepare(
        "INSERT OR IGNORE INTO blog_engagement (id, slug, client_id, type, created_at) VALUES (?, ?, ?, 'fistbump', ?)",
      )
      .bind(crypto.randomUUID(), safeSlug, safeClientId, Date.now())
      .run();

    const row = await db
      .prepare("SELECT COUNT(*) as cnt FROM blog_engagement WHERE slug = ? AND type = 'fistbump'")
      .bind(safeSlug)
      .first<{ cnt: number }>();

    return c.json({ count: row?.cnt ?? 1 });
  } catch (err) {
    log.error("fistbump error", { error: err instanceof Error ? err.message : String(err) });
    return c.json({ error: "Failed to record fist bump" }, 500);
  }
});

// ─── Blog Donation (Stripe Checkout) ────────────────────────────────────────

support.post("/api/support/donate", async (c) => {
  const stripeKey = c.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return c.json({ error: "Stripe not configured" }, 503);
  }

  let body: { slug?: string; amount?: number; clientId?: string };
  try {
    body = (await c.req.json()) as { slug?: string; amount?: number; clientId?: string };
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const { slug, amount, clientId } = body;
  if (!slug || typeof slug !== "string") {
    return c.json({ error: "slug is required" }, 400);
  }
  if (typeof amount !== "number" || amount < 1 || amount > 1000) {
    return c.json({ error: "amount must be between 1 and 1000" }, 400);
  }

  const safeSlug = slug.slice(0, 200);
  const safeClientId = typeof clientId === "string" ? clientId.slice(0, 100) : "";
  const amountCents = Math.round(amount * 100);

  const params = new URLSearchParams({
    mode: "payment",
    submit_type: "donate",
    "line_items[0][price_data][currency]": "gbp",
    "line_items[0][price_data][unit_amount]": amountCents.toString(),
    "line_items[0][price_data][product_data][name]": "Support spike.land",
    "line_items[0][price_data][product_data][description]": `Blog support for: ${safeSlug}`,
    "line_items[0][quantity]": "1",
    success_url: `https://spike.land/blog/${encodeURIComponent(safeSlug)}?supported`,
    cancel_url: `https://spike.land/blog/${encodeURIComponent(safeSlug)}`,
    "metadata[type]": "blog_support",
    "metadata[slug]": safeSlug,
    "metadata[amount]": amount.toString(),
    "metadata[client_id]": safeClientId,
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": STRIPE_API_VERSION,
    },
    body: params.toString(),
  });

  const data = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    log.error("Stripe donate checkout error", { error: String(data) });
    return c.json({ error: "Failed to create checkout session" }, 502);
  }

  // Record pending donation
  const db = c.env.DB;
  const donationId = crypto.randomUUID();
  const sessionId = data["id"] as string;
  try {
    await db
      .prepare(
        "INSERT INTO support_donations (id, slug, amount_cents, stripe_session_id, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)",
      )
      .bind(donationId, safeSlug, amountCents, sessionId, Date.now())
      .run();
  } catch (err) {
    log.error("donation record error", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return c.json({ url: data["url"] as string });
});

// ─── Migration Checkout (Stripe) ────────────────────────────────────────────

const MIGRATION_TIERS = {
  blog: {
    amountCents: 42000,
    currency: "usd",
    label: "Blog Post",
    description: "Detailed migration blog post covering 8 Next.js projects",
  },
  script: {
    amountCents: 100000,
    currency: "gbp",
    label: "CLI Script",
    description: "Open-source CLI migration script (Next.js → TanStack Start)",
  },
  mcp: {
    amountCents: 1000000,
    currency: "usd",
    label: "MCP Server",
    description: "Production MCP server for automated Next.js migration PRs",
  },
} as const;

type MigrationTier = keyof typeof MIGRATION_TIERS;

support.post("/api/support/migration-checkout", async (c) => {
  const stripeKey = c.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return c.json({ error: "Stripe not configured" }, 503);
  }

  let body: { tier?: string; clientId?: string };
  try {
    body = (await c.req.json()) as { tier?: string; clientId?: string };
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const { tier, clientId } = body;

  if (!tier || !Object.hasOwn(MIGRATION_TIERS, tier)) {
    return c.json({ error: "tier must be one of: blog, script, mcp" }, 400);
  }

  const safeClientId = typeof clientId === "string" ? clientId.slice(0, 100) : "";
  const config = MIGRATION_TIERS[tier as MigrationTier];
  const slug = `migration-${tier}`;

  const params = new URLSearchParams({
    mode: "payment",
    submit_type: "pay",
    "line_items[0][price_data][currency]": config.currency,
    "line_items[0][price_data][unit_amount]": config.amountCents.toString(),
    "line_items[0][price_data][product_data][name]": `Next.js Migration Service — ${config.label}`,
    "line_items[0][price_data][product_data][description]": config.description,
    "line_items[0][quantity]": "1",
    success_url: `https://spike.land/migrate?success=${encodeURIComponent(tier)}`,
    cancel_url: "https://spike.land/migrate",
    "metadata[type]": "migration_service",
    "metadata[tier]": tier,
    "metadata[client_id]": safeClientId,
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": STRIPE_API_VERSION,
    },
    body: params.toString(),
  });

  const data = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    log.error("Stripe migration checkout error", { error: String(data) });
    return c.json({ error: "Failed to create checkout session" }, 502);
  }

  // Record pending migration purchase
  const db = c.env.DB;
  const donationId = crypto.randomUUID();
  const sessionId = data["id"] as string;
  try {
    await db
      .prepare(
        "INSERT INTO support_donations (id, slug, amount_cents, stripe_session_id, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)",
      )
      .bind(donationId, slug, config.amountCents, sessionId, Date.now())
      .run();
  } catch (err) {
    log.error("migration donation record error", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return c.json({ url: data["url"] as string });
});

export { support };
