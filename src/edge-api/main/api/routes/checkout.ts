/**
 * Checkout Endpoint — Stripe / Creem fallback
 *
 * POST /api/checkout — creates a checkout session for subscription.
 * Requires auth. Uses Stripe if configured, falls back to Creem.
 */

import { Hono } from "hono";
import type { Env, Variables } from "../../core-logic/env.js";
import { createLogger } from "@spike-land-ai/shared";
import { stripePost } from "../../core-logic/stripe-client.js";

const log = createLogger("spike-edge");

const checkout = new Hono<{ Bindings: Env; Variables: Variables }>();

checkout.post("/api/checkout", async (c) => {
  const stripeKey = c.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return c.json({ error: "Payment provider not configured" }, 503);
  }

  const userId = c.get("userId") as string | undefined;
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let body: { tier?: string };
  try {
    body = (await c.req.json()) as { tier?: string };
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const tier = body.tier;
  if (tier !== "pro" && tier !== "business") {
    return c.json({ error: "Invalid tier. Must be 'pro' or 'business'." }, 400);
  }

  const userEmail = c.get("userEmail") as string | undefined;

  // Prevent duplicate subscription: reject if the user already has an
  // active or trialing subscription. Send them to the billing portal
  // to change plans instead of creating a parallel Stripe subscription.
  try {
    const existing = await c.env.DB.prepare(
      "SELECT id, plan FROM subscriptions WHERE user_id = ? AND status IN ('active', 'trialing') LIMIT 1",
    )
      .bind(userId)
      .first<{ id: string; plan: string }>();
    if (existing) {
      return c.json(
        {
          error: "Subscription already active",
          plan: existing.plan,
          manage_url: "/settings?tab=billing",
        },
        409,
      );
    }
  } catch (err) {
    log.error("Active-subscription check failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Create Stripe Checkout Session
  const params: Record<string, string> = {
    mode: "subscription",
    success_url: "https://spike.land/settings?tab=billing&success=1",
    cancel_url: "https://spike.land/pricing",
    "line_items[0][quantity]": "1",
    // Session-level metadata so the webhook can resolve userId from
    // session.metadata (subscription_data.metadata lives on the subscription
    // object, not the session, and is not exposed by checkout.session.completed).
    "metadata[userId]": userId,
    "metadata[tier]": tier,
    "subscription_data[metadata][userId]": userId,
    "subscription_data[metadata][tier]": tier,
    client_reference_id: userId,
  };

  // Use lookup_key to resolve the price dynamically
  params["line_items[0][price_data][currency]"] = "usd";
  params["line_items[0][price_data][product_data][name]"] =
    tier === "pro" ? "spike.land Pro" : "spike.land Business";
  params["line_items[0][price_data][unit_amount]"] = tier === "pro" ? "2900" : "9900";
  params["line_items[0][price_data][recurring][interval]"] = "month";

  if (userEmail) {
    params["customer_email"] = userEmail;
  }

  // Idempotency key bucketed to a 60s window so rapid double-clicks
  // collapse to a single Stripe checkout session. Stripe replays the
  // cached response within 24h, so a legitimate retry after the bucket
  // rolls over still works.
  const idempotencyBucket = Math.floor(Date.now() / 60_000);
  const res = await stripePost(
    stripeKey,
    "/v1/checkout/sessions",
    params,
    `${userId}-${tier}-${idempotencyBucket}`,
  );

  if (!res.ok) {
    log.error("Failed to create Stripe checkout", { data: JSON.stringify(res.data) });
    return c.json({ error: "Failed to create checkout session" }, 502);
  }

  const checkoutUrl = res.data.url as string | undefined;
  if (!checkoutUrl) {
    return c.json({ error: "No checkout URL returned" }, 502);
  }

  return c.json({ url: checkoutUrl });
});

export { checkout };
