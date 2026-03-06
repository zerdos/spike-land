/**
 * Credit Service
 *
 * Manages user credit balances with a double-entry ledger.
 * Daily grants are auto-applied per tier: Free=50, Pro=500, Business=unlimited (999999 daily_limit).
 */

import { resolveEffectiveTier } from "./tier-service.js";

const DAILY_LIMITS: Record<string, number> = {
  free: 50,
  pro: 500,
  business: 999999,
};

interface CreditBalance {
  balance: number;
  daily_limit: number;
  last_daily_grant: string | null;
  updated_at: string;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function randomId(): string {
  return crypto.randomUUID();
}

/**
 * Get current balance for user. Auto-grants daily credits if not yet granted today.
 * Returns the balance row (after grant if applicable).
 */
export async function getBalance(
  db: D1Database,
  userId: string,
): Promise<{ balance: number; dailyLimit: number; lastDailyGrant: string | null }> {
  const today = todayUTC();

  // Resolve tier to determine daily limit
  const tier = await resolveEffectiveTier(db, userId);
  const dailyLimit = DAILY_LIMITS[tier] ?? 50;

  // Upsert balance row — create if not exists
  await db
    .prepare(
      `INSERT INTO credit_balances (user_id, balance, daily_limit, last_daily_grant, updated_at)
       VALUES (?, 0, ?, NULL, datetime('now'))
       ON CONFLICT(user_id) DO NOTHING`,
    )
    .bind(userId, dailyLimit)
    .run();

  // Fetch current row
  const row = await db
    .prepare("SELECT balance, daily_limit, last_daily_grant FROM credit_balances WHERE user_id = ?")
    .bind(userId)
    .first<CreditBalance>();

  if (!row) {
    return { balance: 0, dailyLimit, lastDailyGrant: null };
  }

  // Update daily_limit if tier changed
  if (row.daily_limit !== dailyLimit) {
    await db
      .prepare("UPDATE credit_balances SET daily_limit = ?, updated_at = datetime('now') WHERE user_id = ?")
      .bind(dailyLimit, userId)
      .run();
  }

  // Auto-grant daily credits if not already granted today
  if (row.last_daily_grant !== today) {
    const newBalance = row.balance + dailyLimit;
    await db.batch([
      db
        .prepare(
          `UPDATE credit_balances
           SET balance = ?, daily_limit = ?, last_daily_grant = ?, updated_at = datetime('now')
           WHERE user_id = ?`,
        )
        .bind(newBalance, dailyLimit, today, userId),
      db
        .prepare(
          `INSERT INTO credit_ledger (id, user_id, amount, balance_after, type, description)
           VALUES (?, ?, ?, ?, 'daily_grant', ?)`,
        )
        .bind(randomId(), userId, dailyLimit, newBalance, `Daily ${tier} grant`),
    ]);

    return { balance: newBalance, dailyLimit, lastDailyGrant: today };
  }

  return { balance: row.balance, dailyLimit, lastDailyGrant: row.last_daily_grant };
}

/**
 * Deduct credits from user balance. Records in ledger.
 * Returns the new balance after deduction.
 * Throws if insufficient credits.
 */
export async function deductCredit(
  db: D1Database,
  userId: string,
  amount: number,
  description: string,
  referenceId?: string,
): Promise<number> {
  const { balance } = await getBalance(db, userId);

  if (balance < amount) {
    throw new Error(`insufficient_credits:${balance}:${amount}`);
  }

  const newBalance = balance - amount;

  await db.batch([
    db
      .prepare(
        "UPDATE credit_balances SET balance = ?, updated_at = datetime('now') WHERE user_id = ?",
      )
      .bind(newBalance, userId),
    db
      .prepare(
        `INSERT INTO credit_ledger (id, user_id, amount, balance_after, type, description, reference_id)
         VALUES (?, ?, ?, ?, 'usage', ?, ?)`,
      )
      .bind(randomId(), userId, -amount, newBalance, description, referenceId ?? null),
  ]);

  return newBalance;
}

/**
 * Add purchased credits to user balance. Records in ledger.
 * Returns the new balance.
 */
export async function purchaseCredits(
  db: D1Database,
  userId: string,
  amount: number,
  referenceId: string,
): Promise<number> {
  // Ensure balance row exists
  await getBalance(db, userId);

  const row = await db
    .prepare("SELECT balance FROM credit_balances WHERE user_id = ?")
    .bind(userId)
    .first<{ balance: number }>();

  const currentBalance = row?.balance ?? 0;
  const newBalance = currentBalance + amount;

  await db.batch([
    db
      .prepare(
        "UPDATE credit_balances SET balance = ?, updated_at = datetime('now') WHERE user_id = ?",
      )
      .bind(newBalance, userId),
    db
      .prepare(
        `INSERT INTO credit_ledger (id, user_id, amount, balance_after, type, description, reference_id)
         VALUES (?, ?, ?, ?, 'purchase', 'Credit purchase', ?)`,
      )
      .bind(randomId(), userId, amount, newBalance, referenceId),
  ]);

  return newBalance;
}

/**
 * Count credits used today by summing negative ledger entries since midnight UTC.
 */
export async function getUsedToday(db: D1Database, userId: string): Promise<number> {
  const today = todayUTC();
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(ABS(amount)), 0) as used
       FROM credit_ledger
       WHERE user_id = ? AND type = 'usage' AND created_at >= ?`,
    )
    .bind(userId, `${today}T00:00:00`)
    .first<{ used: number }>();

  return row?.used ?? 0;
}
