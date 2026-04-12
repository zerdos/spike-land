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

// Stripe Price IDs — set these via wrangler secret or vars
// For now, use lookup_key-based pricing which auto-resolves
const STRIPE_PRICE_LOOKUP: Record<string, string> = {
  pro: "pro_monthly",
  business: "business_monthly",
};

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
  const lookupKey = STRIPE_PRICE_LOOKUP[tier];

  // Create Stripe Checkout Session
  const params: Record<string, string> = {
    mode: "subscription",
    success_url: "https://spike.land/settings?tab=billing&success=1",
    cancel_url: "https://spike.land/pricing",
    "line_items[0][quantity]": "1",
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

  const res = await stripePost(
    stripeKey,
    "/v1/checkout/sessions",
    params,
    `${userId}-${tier}-${Date.now()}`,
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
