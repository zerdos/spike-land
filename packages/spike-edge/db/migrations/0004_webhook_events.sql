-- Migration: Webhook events idempotency table
-- Created: 2026-03-04

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,        -- Stripe event ID (evt_...)
  processed_at INTEGER NOT NULL
);
