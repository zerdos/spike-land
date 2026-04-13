import { describe, expect, it, vi } from "vitest";
import { handleScheduled } from "../../../src/edge-api/main/lazy-imports/scheduled.js";
import type { Env } from "../../../src/edge-api/main/core-logic/env.js";

/**
 * Test harness that routes SQL statements to per-query handlers based on
 * content matching. This decouples tests from the exact number of prepares
 * the implementation happens to make.
 */
interface QueryRoute {
  match: (sql: string) => boolean;
  respond: () => unknown;
}

function createDB(routes: QueryRoute[]) {
  const runMock = vi.fn().mockResolvedValue({});
  const firstCalls: string[] = [];

  const prepare = vi.fn().mockImplementation((sql: string) => {
    firstCalls.push(sql);
    const route = routes.find((r) => r.match(sql));
    const first = vi.fn().mockImplementation(() => Promise.resolve(route?.respond() ?? null));
    return {
      bind: vi.fn().mockReturnThis(),
      first,
      run: runMock,
    };
  });

  return {
    db: {
      prepare,
      batch: vi.fn().mockResolvedValue([]),
    } as unknown as D1Database,
    runMock,
    firstCalls,
  };
}

function createEnv(db: D1Database): Env {
  return { DB: db } as unknown as Env;
}

// Query matchers
const isGeneralCount = (sql: string) =>
  sql.includes("COUNT(*)") && !sql.includes("creem-webhook") && !sql.includes("subscription");
const isPaymentCount = (sql: string) =>
  sql.includes("COUNT(*)") && (sql.includes("creem-webhook") || sql.includes("subscription"));
const isCooldownLookup = (sql: string) => sql.includes("ALERT_SENT") || sql.includes("message = ?");
const isAlertInsert = (sql: string) =>
  sql.includes("INSERT INTO error_logs") && sql.includes("severity");

describe("handleScheduled", () => {
  it("runs both checks and writes no alert when under thresholds", async () => {
    const { db, runMock } = createDB([
      { match: isGeneralCount, respond: () => ({ count: 10 }) },
      { match: isPaymentCount, respond: () => ({ count: 1 }) },
    ]);

    await expect(handleScheduled(createEnv(db))).resolves.toBeUndefined();

    // No INSERT alerts written
    expect(runMock).not.toHaveBeenCalled();
  });

  it("alerts on general error spike (>50) when no recent cooldown", async () => {
    const { db, runMock, firstCalls } = createDB([
      { match: isGeneralCount, respond: () => ({ count: 120 }) },
      { match: isPaymentCount, respond: () => ({ count: 0 }) },
      { match: isCooldownLookup, respond: () => null }, // no prior alert
    ]);

    await handleScheduled(createEnv(db));

    expect(runMock).toHaveBeenCalledTimes(1); // one ALERT_SENT insert
    expect(firstCalls.some(isAlertInsert)).toBe(true);
  });

  it("does NOT re-alert within the 1-hour cooldown window", async () => {
    const thirtyMinAgoMs = Date.now() - 30 * 60 * 1000;
    const { db, runMock } = createDB([
      { match: isGeneralCount, respond: () => ({ count: 200 }) },
      { match: isPaymentCount, respond: () => ({ count: 0 }) },
      { match: isCooldownLookup, respond: () => ({ created_at: thirtyMinAgoMs }) },
    ]);

    await handleScheduled(createEnv(db));

    expect(runMock).not.toHaveBeenCalled();
  });

  it("alerts again after the cooldown window expires", async () => {
    const twoHoursAgoMs = Date.now() - 2 * 60 * 60 * 1000;
    const { db, runMock } = createDB([
      { match: isGeneralCount, respond: () => ({ count: 120 }) },
      { match: isPaymentCount, respond: () => ({ count: 0 }) },
      { match: isCooldownLookup, respond: () => ({ created_at: twoHoursAgoMs }) },
    ]);

    await handleScheduled(createEnv(db));

    expect(runMock).toHaveBeenCalledTimes(1);
  });

  it("alerts on payment error spike independently (threshold 3)", async () => {
    const { db, runMock } = createDB([
      { match: isGeneralCount, respond: () => ({ count: 0 }) },
      { match: isPaymentCount, respond: () => ({ count: 3 }) },
      { match: isCooldownLookup, respond: () => null },
    ]);

    await handleScheduled(createEnv(db));

    // Payment alert fires even when general rate is calm
    expect(runMock).toHaveBeenCalledTimes(1);
  });

  it("does not page payment alert below threshold (count === 2)", async () => {
    const { db, runMock } = createDB([
      { match: isGeneralCount, respond: () => ({ count: 0 }) },
      { match: isPaymentCount, respond: () => ({ count: 2 }) },
    ]);

    await handleScheduled(createEnv(db));

    expect(runMock).not.toHaveBeenCalled();
  });

  it("can alert on both general AND payment in the same run", async () => {
    const { db, runMock } = createDB([
      { match: isGeneralCount, respond: () => ({ count: 200 }) },
      { match: isPaymentCount, respond: () => ({ count: 5 }) },
      { match: isCooldownLookup, respond: () => null },
    ]);

    await handleScheduled(createEnv(db));

    expect(runMock).toHaveBeenCalledTimes(2);
  });

  it("survives DB errors in one check without skipping the other", async () => {
    // General check explodes; payment check should still run and alert.
    let generalCalls = 0;
    const db = {
      prepare: vi.fn().mockImplementation((sql: string) => {
        const failing = isGeneralCount(sql);
        return {
          bind: vi.fn().mockReturnThis(),
          first: vi.fn().mockImplementation(() => {
            if (failing) {
              generalCalls++;
              return Promise.reject(new Error("DB down"));
            }
            if (isPaymentCount(sql)) return Promise.resolve({ count: 10 });
            if (isCooldownLookup(sql)) return Promise.resolve(null);
            return Promise.resolve(null);
          }),
          run: vi.fn().mockResolvedValue({}),
        };
      }),
      batch: vi.fn().mockResolvedValue([]),
    } as unknown as D1Database;

    await expect(handleScheduled(createEnv(db))).resolves.toBeUndefined();
    expect(generalCalls).toBeGreaterThan(0);
  });

  it("handles exact-threshold boundary for general (count === 50, no alert)", async () => {
    const { db, runMock } = createDB([
      { match: isGeneralCount, respond: () => ({ count: 50 }) },
      { match: isPaymentCount, respond: () => ({ count: 0 }) },
    ]);

    await handleScheduled(createEnv(db));
    expect(runMock).not.toHaveBeenCalled();
  });
});
