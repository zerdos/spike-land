/**
 * Checkout Endpoint — Stripe / Creem fallback
 *
 * POST /api/checkout — creates a checkout session for subscription.
 * Requires auth. Uses Stripe if configured, falls back to Creem.
 */

import { Hono } from "hono";
import type { Env, Variables } from "../../core-logic/env.js";
import { createLogger } from "@spike-land-ai/shared";
import { stripeGet, stripePost } from "../../core-logic/stripe-client.js";

const log = createLogger("spike-edge");

// Launch promo: £20 off first month for Pro & Business until 2026-04-30.
// £20 ≈ $25 at GBP/USD ~1.25. Applied via Stripe coupon (duration: once) so the
// subscription reverts to the normal price from month 2 onwards.
const LAUNCH_PROMO_UNTIL_MS = Date.parse("2026-04-30T23:59:59Z");
const LAUNCH_PROMO_DISCOUNT_CENTS = 2500;
const LAUNCH_PROMO_COUPON_ID = "launch-apr-2026-20off";

function launchPromoActive(nowMs: number = Date.now()): boolean {
  return Number.isFinite(LAUNCH_PROMO_UNTIL_MS) && nowMs <= LAUNCH_PROMO_UNTIL_MS;
}

async function ensureLaunchCoupon(stripeKey: string): Promise<string | null> {
  const existing = await stripeGet(stripeKey, `/v1/coupons/${LAUNCH_PROMO_COUPON_ID}`, {});
  if (existing.ok) return LAUNCH_PROMO_COUPON_ID;
  const created = await stripePost(
    stripeKey,
    "/v1/coupons",
    {
      id: LAUNCH_PROMO_COUPON_ID,
      amount_off: String(LAUNCH_PROMO_DISCOUNT_CENTS),
      currency: "usd",
      duration: "once",
      name: "Launch offer — £20 off first month",
      redeem_by: String(Math.floor(LAUNCH_PROMO_UNTIL_MS / 1000)),
    },
    `create-${LAUNCH_PROMO_COUPON_ID}`,
  );
  if (created.ok) return LAUNCH_PROMO_COUPON_ID;
  log.warn("Failed to create launch coupon", { data: JSON.stringify(created.data) });
  return null;
}

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

  let body: { tier?: string; billing?: string };
  try {
    body = (await c.req.json()) as { tier?: string; billing?: string };
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const tier = body.tier;
  if (tier !== "pro" && tier !== "business") {
    return c.json({ error: "Invalid tier. Must be 'pro' or 'business'." }, 400);
  }
  const billing = body.billing === "annual" ? "annual" : "monthly";

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

  // Price matrix (USD cents). Annual totals = annualPerMonth × 12, billed upfront.
  const PRICES = {
    pro: { monthly: 2900, annualTotal: 27600, label: "spike.land Pro" },
    business: { monthly: 9900, annualTotal: 94800, label: "spike.land Business" },
  } as const;
  const tierPrice = PRICES[tier];
  const isAnnual = billing === "annual";
  const unitAmount = isAnnual ? tierPrice.annualTotal : tierPrice.monthly;
  const interval = isAnnual ? "year" : "month";
  const productName = isAnnual ? `${tierPrice.label} (annual)` : tierPrice.label;

  // Create Stripe Checkout Session
  const params: Record<string, string> = {
    mode: "subscription",
    success_url: "https://spike.land/settings?tab=billing&success=1",
    cancel_url: "https://spike.land/pricing",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(unitAmount),
    "line_items[0][price_data][recurring][interval]": interval,
    "line_items[0][price_data][product_data][name]": productName,
    // Session-level metadata so the webhook can resolve userId from
    // session.metadata (subscription_data.metadata lives on the subscription
    // object, not the session, and is not exposed by checkout.session.completed).
    "metadata[userId]": userId,
    "metadata[tier]": tier,
    "metadata[billing]": billing,
    "subscription_data[metadata][userId]": userId,
    "subscription_data[metadata][tier]": tier,
    "subscription_data[metadata][billing]": billing,
    client_reference_id: userId,
  };

  // Apply launch coupon (£20 off first charge) if within window. Stripe rejects
  // setting both discounts[] and allow_promotion_codes on the same session, so
  // the promo wins when active and promo-code entry is enabled otherwise.
  let couponApplied = false;
  if (launchPromoActive()) {
    const couponId = await ensureLaunchCoupon(stripeKey);
    if (couponId) {
      params["discounts[0][coupon]"] = couponId;
      params["metadata[promo]"] = "launch-apr-2026";
      couponApplied = true;
    }
  }
  if (!couponApplied) {
    params["allow_promotion_codes"] = "true";
  }

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
    `${userId}-${tier}-${billing}-${idempotencyBucket}`,
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
