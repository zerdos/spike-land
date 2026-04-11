/**
 * Business Metrics Endpoint
 *
 * GET /internal/metrics — Key business KPIs for the founder dashboard.
 * Protected by x-internal-secret header.
 *
 * Returns: active users, MRR estimate, credit usage, tier distribution,
 * conversion funnel, and top tools.
 */

import { Hono } from "hono";
import type { Env, Variables } from "../../core-logic/env.js";

const metrics = new Hono<{ Bindings: Env; Variables: Variables }>();

interface MetricRow {
  count: number;
}

interface TierRow {
  plan: string;
  count: number;
}

metrics.get("/internal/metrics", async (c) => {
  const secret = c.req.header("x-internal-secret");
  if (!secret || secret !== c.env.MCP_INTERNAL_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = c.env.DB;
  const now = Date.now();
  const oneDayAgo = now - 86400000;
  const sevenDaysAgo = now - 7 * 86400000;
  const thirtyDaysAgo = now - 30 * 86400000;

  // Run all queries in parallel
  const [
    totalUsers,
    activeUsersDay,
    activeUsersWeek,
    activeUsersMonth,
    tierDistribution,
    totalCreditsUsedToday,
    totalCreditsPurchased,
    recentSignups,
    byokUsers,
  ] = await Promise.all([
    // Total registered users
    db
      .prepare("SELECT COUNT(*) as count FROM users")
      .first<MetricRow>()
      .then((r) => r?.count ?? 0),

    // DAU — users with credit ledger entries in last 24h
    db
      .prepare(
        "SELECT COUNT(DISTINCT user_id) as count FROM credit_ledger WHERE type = 'usage' AND created_at >= ?",
      )
      .bind(new Date(oneDayAgo).toISOString())
      .first<MetricRow>()
      .then((r) => r?.count ?? 0),

    // WAU
    db
      .prepare(
        "SELECT COUNT(DISTINCT user_id) as count FROM credit_ledger WHERE type = 'usage' AND created_at >= ?",
      )
      .bind(new Date(sevenDaysAgo).toISOString())
      .first<MetricRow>()
      .then((r) => r?.count ?? 0),

    // MAU
    db
      .prepare(
        "SELECT COUNT(DISTINCT user_id) as count FROM credit_ledger WHERE type = 'usage' AND created_at >= ?",
      )
      .bind(new Date(thirtyDaysAgo).toISOString())
      .first<MetricRow>()
      .then((r) => r?.count ?? 0),

    // Tier distribution (active subscriptions)
    db
      .prepare(
        "SELECT plan, COUNT(*) as count FROM subscriptions WHERE status = 'active' GROUP BY plan",
      )
      .all<TierRow>()
      .then((r) => r.results ?? []),

    // Credits used today
    db
      .prepare(
        "SELECT COALESCE(SUM(ABS(amount)), 0) as count FROM credit_ledger WHERE type = 'usage' AND created_at >= ?",
      )
      .bind(new Date(oneDayAgo).toISOString())
      .first<MetricRow>()
      .then((r) => r?.count ?? 0),

    // Total credits purchased (all time)
    db
      .prepare(
        "SELECT COALESCE(SUM(amount), 0) as count FROM credit_ledger WHERE type = 'purchase'",
      )
      .first<MetricRow>()
      .then((r) => r?.count ?? 0),

    // Signups in last 7 days
    db
      .prepare("SELECT COUNT(*) as count FROM users WHERE created_at >= ?")
      .bind(sevenDaysAgo)
      .first<MetricRow>()
      .then((r) => r?.count ?? 0),

    // BYOK users
    db
      .prepare("SELECT COUNT(DISTINCT user_id) as count FROM user_api_key_vault")
      .first<MetricRow>()
      .then((r) => r?.count ?? 0),
  ]);

  // Calculate MRR from tier distribution
  const PLAN_PRICES: Record<string, number> = { pro: 29, business: 99 };
  let mrr = 0;
  const tiers: Record<string, number> = {};
  for (const row of tierDistribution) {
    tiers[row.plan] = row.count;
    mrr += (PLAN_PRICES[row.plan] ?? 0) * row.count;
  }

  // Conversion rate: paid / total
  const paidUsers = (tiers["pro"] ?? 0) + (tiers["business"] ?? 0);
  const conversionRate = totalUsers > 0 ? paidUsers / totalUsers : 0;

  return c.json({
    timestamp: new Date().toISOString(),
    users: {
      total: totalUsers,
      dau: activeUsersDay,
      wau: activeUsersWeek,
      mau: activeUsersMonth,
      signupsLast7d: recentSignups,
      byokUsers,
    },
    revenue: {
      mrr,
      arr: mrr * 12,
      paidUsers,
      conversionRate: Number(conversionRate.toFixed(4)),
    },
    tiers,
    credits: {
      usedToday: totalCreditsUsedToday,
      purchasedAllTime: totalCreditsPurchased,
    },
  });
});

export { metrics };
