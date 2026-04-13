import { createLogger } from "@spike-land-ai/shared";
import type { Env } from "../core-logic/env.js";
import { captureWorkerException } from "../../common/core-logic/sentry.js";

const log = createLogger("spike-edge-cron");

// Alert thresholds. Payment errors have a *much* lower threshold than the
// general error rate because a single failed webhook can mean lost revenue
// or a user who paid but wasn't upgraded.
const GENERAL_WINDOW_MS = 15 * 60 * 1000;
const GENERAL_THRESHOLD = 50;
const PAYMENT_WINDOW_MS = 15 * 60 * 1000;
const PAYMENT_THRESHOLD = 3;
const ALERT_COOLDOWN_MS = 60 * 60 * 1000;

async function wasAlertedRecently(
  db: D1Database,
  alertKey: string,
  nowMs: number,
): Promise<boolean> {
  const row = await db
    .prepare("SELECT created_at FROM error_logs WHERE message = ? ORDER BY created_at DESC LIMIT 1")
    .bind(alertKey)
    .first<{ created_at: number }>();
  return !!row && row.created_at >= nowMs - ALERT_COOLDOWN_MS;
}

async function recordAlertSent(db: D1Database, alertKey: string): Promise<void> {
  await db
    .prepare(
      "INSERT INTO error_logs (service_name, error_code, message, severity) VALUES (?, ?, ?, ?)",
    )
    .bind("cron", "ALERT", alertKey, "info")
    .run();
}

async function checkGeneralErrorRate(db: D1Database, nowMs: number): Promise<void> {
  const since = nowMs - GENERAL_WINDOW_MS;
  const result = await db
    .prepare(
      "SELECT COUNT(*) as count FROM error_logs WHERE created_at >= ? AND severity IN ('error', 'fatal')",
    )
    .bind(since)
    .first<{ count: number }>();

  const count = result?.count ?? 0;
  log.info("General error rate check", { count, since });

  if (count <= GENERAL_THRESHOLD) return;
  if (await wasAlertedRecently(db, "ERROR_RATE_ALERT_SENT", nowMs)) return;

  log.error("General error rate spike", { count, threshold: GENERAL_THRESHOLD });
  captureWorkerException(
    "spike-edge-cron",
    new Error(`Error rate spike: ${count} errors in last 15m (threshold ${GENERAL_THRESHOLD})`),
    { level: "warning", tags: { alert: "error_rate" }, extras: { count } },
  );
  await recordAlertSent(db, "ERROR_RATE_ALERT_SENT");
}

async function checkPaymentErrorRate(db: D1Database, nowMs: number): Promise<void> {
  const since = nowMs - PAYMENT_WINDOW_MS;
  // Payment-critical services: any webhook-level failure or billing-route
  // 500 counts. We deliberately exclude 'info' severity so routine 503s
  // during maintenance don't page.
  const result = await db
    .prepare(
      `SELECT COUNT(*) as count
       FROM error_logs
       WHERE created_at >= ?
         AND severity IN ('error', 'fatal')
         AND (
           service_name IN ('creem-webhook', 'stripe-webhook')
           OR error_code LIKE '%subscription%'
           OR error_code LIKE '%checkout%'
           OR error_code LIKE '%dispute%'
           OR error_code LIKE '%refund%'
         )`,
    )
    .bind(since)
    .first<{ count: number }>();

  const count = result?.count ?? 0;
  log.info("Payment error rate check", { count, since });

  if (count < PAYMENT_THRESHOLD) return;
  if (await wasAlertedRecently(db, "PAYMENT_ERROR_ALERT_SENT", nowMs)) return;

  log.error("Payment error rate spike", { count, threshold: PAYMENT_THRESHOLD });
  captureWorkerException(
    "spike-edge-cron",
    new Error(
      `Payment error spike: ${count} webhook/billing errors in last 15m (threshold ${PAYMENT_THRESHOLD})`,
    ),
    { level: "error", tags: { alert: "payment_error_rate" }, extras: { count } },
  );
  await recordAlertSent(db, "PAYMENT_ERROR_ALERT_SENT");
}

export async function handleScheduled(env: Env): Promise<void> {
  const nowMs = Date.now();

  // Run both checks independently — a failure in one must not skip the other.
  const results = await Promise.allSettled([
    checkGeneralErrorRate(env.DB, nowMs),
    checkPaymentErrorRate(env.DB, nowMs),
  ]);
  for (const r of results) {
    if (r.status === "rejected") {
      log.error("Cron check failed", { error: String(r.reason) });
    }
  }
}
