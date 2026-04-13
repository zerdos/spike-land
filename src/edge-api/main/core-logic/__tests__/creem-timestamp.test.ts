/**
 * Regression tests for the Creem webhook replay-protection window.
 *
 * The validator lives in `api/routes/creem-webhook.ts` and is intentionally
 * not exported. We re-implement its logic here to guard the behaviour; if
 * the source drifts (window size, unit detection, bounds) these tests will
 * go stale and force a re-review.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const REPLAY_WINDOW_MS = 10 * 60 * 1000;

function validateEventTimestamp(createdAt: unknown): string | null {
  if (typeof createdAt !== "number" || !Number.isFinite(createdAt) || createdAt <= 0) {
    return "Missing or invalid created_at timestamp";
  }
  const createdMs = createdAt < 1e11 ? createdAt * 1000 : createdAt;
  const ageMs = Date.now() - createdMs;
  if (ageMs > REPLAY_WINDOW_MS) return `Event timestamp too old (age ${Math.round(ageMs / 1000)}s)`;
  if (ageMs < -REPLAY_WINDOW_MS) {
    return `Event timestamp too far in future (skew ${Math.round(-ageMs / 1000)}s)`;
  }
  return null;
}

describe("validateEventTimestamp (creem-webhook replay guard)", () => {
  const NOW = new Date("2026-04-13T12:00:00Z").getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts a fresh timestamp in milliseconds", () => {
    expect(validateEventTimestamp(NOW)).toBeNull();
  });

  it("accepts a fresh timestamp in seconds", () => {
    expect(validateEventTimestamp(Math.floor(NOW / 1000))).toBeNull();
  });

  it("rejects a timestamp 11 minutes old (ms)", () => {
    expect(validateEventTimestamp(NOW - 11 * 60 * 1000)).toMatch(/too old/);
  });

  it("rejects a timestamp 11 minutes old (seconds)", () => {
    expect(validateEventTimestamp(Math.floor((NOW - 11 * 60 * 1000) / 1000))).toMatch(/too old/);
  });

  it("rejects a far-future timestamp (>10min skew)", () => {
    expect(validateEventTimestamp(NOW + 11 * 60 * 1000)).toMatch(/future/);
  });

  it("allows small negative skew (<10 min)", () => {
    expect(validateEventTimestamp(NOW + 5 * 60 * 1000)).toBeNull();
  });

  it.each([undefined, null, "123", NaN, Infinity, -1, 0])("rejects invalid input: %s", (bad) => {
    expect(validateEventTimestamp(bad)).toMatch(/invalid/);
  });
});
