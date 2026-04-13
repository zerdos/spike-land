/**
 * Creem.io Webhook Handler
 *
 * POST /creem/webhook — receives Creem payment/subscription events.
 * Verifies HMAC-SHA256 signature, dispatches to subscription service.
 */

import { Hono } from "hono";
import type { Env } from "../../core-logic/env.js";
import { createLogger } from "@spike-land-ai/shared";
import { verifyCreemSignature } from "../../core-logic/creem-client.js";

const log = createLogger("spike-edge");

const creemWebhook = new Hono<{ Bindings: Env }>();

// ─── Creem Event Types ─────────────────────────────────────────────────────

interface CreemSubscription {
  id: string;
  status: string;
  current_period_start_date?: string;
  current_period_end_date?: string;
  metadata?: Record<string, string>;
}

interface CreemCustomer {
  id: string;
  email?: string;
  name?: string;
}

interface CreemProduct {
  id: string;
  name: string;
  billing_type: string;
}

interface CreemEventObject {
  id: string;
  request_id?: string;
  status?: string;
  metadata?: Record<string, string>;
  customer?: CreemCustomer;
  subscription?: CreemSubscription;
  product?: CreemProduct;
}

interface CreemEvent {
  id: string;
  eventType: string;
  created_at: number;
  object: CreemEventObject;
}

// ─── Replay Protection ─────────────────────────────────────────────────────

// 10-minute window. Wider than Stripe's 5-min default because Creem does not
// sign the timestamp in the header (only the body), so clock skew tolerance
// matters more. created_at is trusted only AFTER HMAC signature verification.
const REPLAY_WINDOW_MS = 10 * 60 * 1000;

/**
 * Validates the event.created_at timestamp is within an acceptable window
 * of the current time. Returns `null` if valid, or an error string if not.
 *
 * Accepts both unix-seconds (< 1e11) and unix-millis; auto-detects by
 * magnitude. Rejects non-finite, non-positive, and out-of-window values.
 */
function validateEventTimestamp(createdAt: unknown): string | null {
  if (typeof createdAt !== "number" || !Number.isFinite(createdAt) || createdAt <= 0) {
    return "Missing or invalid created_at timestamp";
  }
  // Magnitude heuristic: values below 1e11 are seconds (~year 5138 in sec),
  // values above are milliseconds.
  const createdMs = createdAt < 1e11 ? createdAt * 1000 : createdAt;
  const ageMs = Date.now() - createdMs;
  if (ageMs > REPLAY_WINDOW_MS) {
    return `Event timestamp too old (age ${Math.round(ageMs / 1000)}s)`;
  }
  if (ageMs < -REPLAY_WINDOW_MS) {
    return `Event timestamp too far in future (skew ${Math.round(-ageMs / 1000)}s)`;
  }
  return null;
}

// ─── Idempotency ───────────────────────────────────────────────────────────

async function checkIdempotency(db: D1Database, eventId: string): Promise<boolean> {
  try {
    const existing = await db
      .prepare("SELECT id FROM webhook_events WHERE id = ? LIMIT 1")
      .bind(eventId)
      .first<{ id: string }>();

    if (existing) return true;

    await db
      .prepare("INSERT INTO webhook_events (id, processed_at) VALUES (?, ?)")
      .bind(eventId, Date.now())
      .run();
  } catch (err) {
    log.error("Creem idempotency check failed", {
      error: err instanceof Error ? err.message : "Unknown",
    });
  }
  return false;
}

// ─── Webhook Route ─────────────────────────────────────────────────────────

creemWebhook.post("/creem/webhook", async (c) => {
  const webhookSecret = c.env.CREEM_WEBHOOK_SECRET;
  if (!webhookSecret) {
    log.error("CREEM_WEBHOOK_SECRET not configured");
    return c.json({ error: "Webhook not configured" }, 503);
  }

  const signature = c.req.header("creem-signature");
  if (!signature) {
    return c.json({ error: "Missing creem-signature header" }, 400);
  }

  // Read raw body BEFORE parsing for signature verification
  const rawBody = await c.req.text();
  const valid = await verifyCreemSignature(rawBody, signature, webhookSecret);
  if (!valid) {
    return c.json({ error: "Invalid signature" }, 400);
  }

  let event: CreemEvent;
  try {
    event = JSON.parse(rawBody) as CreemEvent;
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  // Replay-attack protection. Signature covers the body, so created_at is
  // tamper-proof post-verification: an attacker replaying an old valid body
  // cannot update the timestamp without breaking the HMAC.
  const tsError = validateEventTimestamp(event.created_at);
  if (tsError) {
    log.warn("Creem webhook rejected", { reason: tsError, eventId: event.id });
    return c.json({ error: tsError }, 400);
  }

  const db = c.env.DB;

  // Idempotency
  const duplicate = await checkIdempotency(db, event.id);
  if (duplicate) {
    return c.json({ received: true, duplicate: true });
  }

  try {
    switch (event.eventType) {
      case "checkout.completed":
        await handleCheckoutCompleted(db, event);
        break;
      case "subscription.active":
        await handleSubscriptionActive(db, event);
        break;
      case "subscription.paid":
        await handleSubscriptionPaid(db, event);
        break;
      case "subscription.canceled":
      case "subscription.expired":
        await handleSubscriptionCanceled(db, event);
        break;
      case "subscription.past_due":
        await handleSubscriptionPastDue(db, event);
        break;
      case "subscription.scheduled_cancel":
        await handleSubscriptionScheduledCancel(db, event);
        break;
      case "refund.created":
        await handleRefund(db, event);
        break;
      case "dispute.created":
        await handleDispute(db, event);
        break;
      default:
        log.info(`Unhandled Creem event: ${event.eventType}`);
        break;
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    log.error(`Error handling Creem ${event.eventType}`, { error: msg });
    logWebhookError(db, c.executionCtx, event.eventType, msg);
  }

  return c.json({ received: true });
});

creemWebhook.get("/creem/webhook/health", (c) => {
  return c.json({ ok: true });
});

// ─── Event Handlers ────────────────────────────────────────────────────────

async function handleCheckoutCompleted(db: D1Database, event: CreemEvent): Promise<void> {
  const obj = event.object;
  const userId = obj.metadata?.["userId"];
  if (!userId) {
    log.warn("Creem checkout.completed without userId in metadata");
    return;
  }

  const tier = obj.metadata?.["tier"] ?? "pro";
  const creemCustomerId = obj.customer?.id ?? null;
  const creemSubscriptionId = obj.subscription?.id ?? null;
  const periodEnd = obj.subscription?.current_period_end_date
    ? new Date(obj.subscription.current_period_end_date).getTime()
    : null;
  const now = Date.now();

  const existing = await db
    .prepare("SELECT id FROM subscriptions WHERE user_id = ? LIMIT 1")
    .bind(userId)
    .first<{ id: string }>();

  if (existing) {
    await db
      .prepare(
        `UPDATE subscriptions
         SET creem_customer_id = ?, creem_subscription_id = ?, status = 'active',
             plan = ?, current_period_end = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(creemCustomerId, creemSubscriptionId, tier, periodEnd, now, existing.id)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO subscriptions
         (id, user_id, creem_customer_id, creem_subscription_id, status, plan, current_period_end, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        userId,
        creemCustomerId,
        creemSubscriptionId,
        tier,
        periodEnd,
        now,
        now,
      )
      .run();
  }

  // Update user email if available
  const customerEmail = obj.customer?.email;
  if (customerEmail) {
    await db
      .prepare("UPDATE users SET email = ?, updated_at = ? WHERE id = ? AND email != ?")
      .bind(customerEmail, now, userId, customerEmail)
      .run();
  }

  // Analytics
  await db
    .prepare(
      `INSERT INTO analytics_events (source, event_type, metadata, client_id)
       VALUES ('creem', 'upgrade_completed', ?, ?)`,
    )
    .bind(JSON.stringify({ plan: tier, userId }), `user_${userId}`)
    .run()
    // Expected: analytics write failure — best-effort, must not block the payment flow
    .catch(() => {});
}

async function handleSubscriptionActive(db: D1Database, event: CreemEvent): Promise<void> {
  const sub = event.object.subscription;
  if (!sub) return;

  const periodEnd = sub.current_period_end_date
    ? new Date(sub.current_period_end_date).getTime()
    : null;

  await db
    .prepare(
      `UPDATE subscriptions SET status = 'active', current_period_end = ?, updated_at = ?
       WHERE creem_subscription_id = ?`,
    )
    .bind(periodEnd, Date.now(), sub.id)
    .run();
}

async function handleSubscriptionPaid(db: D1Database, event: CreemEvent): Promise<void> {
  const sub = event.object.subscription;
  if (!sub) return;

  const periodEnd = sub.current_period_end_date
    ? new Date(sub.current_period_end_date).getTime()
    : null;

  await db
    .prepare(
      `UPDATE subscriptions SET status = 'active', current_period_end = ?, updated_at = ?
       WHERE creem_subscription_id = ?`,
    )
    .bind(periodEnd, Date.now(), sub.id)
    .run();
}

async function handleSubscriptionCanceled(db: D1Database, event: CreemEvent): Promise<void> {
  const sub = event.object.subscription;
  if (!sub) return;

  await db
    .prepare(
      `UPDATE subscriptions SET status = 'canceled', plan = 'free', updated_at = ?
       WHERE creem_subscription_id = ?`,
    )
    .bind(Date.now(), sub.id)
    .run();
}

async function handleSubscriptionPastDue(db: D1Database, event: CreemEvent): Promise<void> {
  const sub = event.object.subscription;
  if (!sub) return;

  await db
    .prepare(
      `UPDATE subscriptions SET status = 'past_due', updated_at = ?
       WHERE creem_subscription_id = ?`,
    )
    .bind(Date.now(), sub.id)
    .run();
}

async function handleSubscriptionScheduledCancel(db: D1Database, event: CreemEvent): Promise<void> {
  const sub = event.object.subscription;
  if (!sub) return;

  // Keep active until period end, but note the scheduled cancellation
  await db
    .prepare(
      `UPDATE subscriptions SET status = 'scheduled_cancel', updated_at = ?
       WHERE creem_subscription_id = ?`,
    )
    .bind(Date.now(), sub.id)
    .run();
}

async function handleRefund(db: D1Database, event: CreemEvent): Promise<void> {
  const obj = event.object;

  await db
    .prepare(
      `INSERT INTO analytics_events (source, event_type, metadata, client_id)
       VALUES ('creem', 'refund_created', ?, ?)`,
    )
    .bind(
      JSON.stringify({ checkoutId: obj.id, customerId: obj.customer?.id }),
      obj.customer?.id ? `customer_${obj.customer.id}` : "unknown",
    )
    .run()
    // Expected: analytics write failure — best-effort, must not block the refund acknowledgment
    .catch(() => {});
}

async function handleDispute(db: D1Database, event: CreemEvent): Promise<void> {
  const obj = event.object;

  await db
    .prepare(
      `INSERT INTO error_logs (service_name, error_code, message, stack_trace, metadata, client_id, severity)
       VALUES ('creem-webhook', 'dispute.created', ?, NULL, ?, ?, 'error')`,
    )
    .bind(
      `Dispute opened for checkout ${obj.id}`,
      JSON.stringify({ checkoutId: obj.id, customerId: obj.customer?.id }),
      obj.customer?.id ? `customer_${obj.customer.id}` : null,
    )
    .run()
    // Expected: error log write failure — best-effort, must not block webhook acknowledgment
    .catch(() => {});
}

// ─── Error Logging ─────────────────────────────────────────────────────────

function logWebhookError(
  db: D1Database,
  ctx: ExecutionContext | undefined,
  eventType: string,
  message: string,
) {
  try {
    const work = db
      .prepare(
        "INSERT INTO error_logs (service_name, error_code, message, stack_trace, metadata, client_id, severity) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind("creem-webhook", eventType, message, null, null, null, "error")
      .run()
      // Expected: DB unavailable during error logging — must not throw inside logWebhookError
      .catch(() => {});
    try {
      ctx?.waitUntil(work);
    } catch {
      /* no ctx in tests */
    }
  } catch {
    /* DB unavailable */
  }
}

export { creemWebhook };
