/**
 * Cockpit Metrics Endpoint
 *
 * GET /api/cockpit/metrics — admin-only metrics dashboard.
 * Access restricted to zoltan.erdos@spike.land.
 * Requires auth.
 */

import { Hono } from "hono";
import type { Env } from "../env.js";

const cockpit = new Hono<{ Bindings: Env }>();

const ADMIN_EMAIL = "zoltan.erdos@spike.land";

interface CountRow {
  count: number;
}

interface ActiveSubsRow {
  count: number;
}

interface MrrRow {
  mrr: number | null;
}

interface RecentSignupRow {
  id: string;
  email: string;
  created_at: string;
}

cockpit.get("/api/cockpit/metrics", async (c) => {
  const userId = c.get("userId" as never) as string | undefined;
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Resolve userId → email and verify admin access
  const userRow = await c.env.DB.prepare(
    `SELECT email FROM users WHERE id = ? LIMIT 1`,
  )
    .bind(userId)
    .first<{ email: string }>();

  if (!userRow || userRow.email !== ADMIN_EMAIL) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const [userCountRow, activeSubsRow, toolCountRow, mrrRow, recentSignupsResult] =
    await Promise.all([
      c.env.DB.prepare(`SELECT COUNT(*) as count FROM users`)
        .first<CountRow>(),
      c.env.DB.prepare(
        `SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'`,
      ).first<ActiveSubsRow>(),
      c.env.DB.prepare(`SELECT COUNT(*) as count FROM registeredTools`)
        .first<CountRow>(),
      c.env.DB.prepare(
        `SELECT COALESCE(SUM(
          CASE plan
            WHEN 'pro'      THEN 29
            WHEN 'business' THEN 99
            ELSE 0
          END
        ), 0) as mrr
         FROM subscriptions WHERE status = 'active'`,
      ).first<MrrRow>(),
      c.env.DB.prepare(
        `SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 10`,
      ).all<RecentSignupRow>(),
    ]);

  return c.json({
    userCount: userCountRow?.count ?? 0,
    activeSubscriptions: activeSubsRow?.count ?? 0,
    toolCount: toolCountRow?.count ?? 0,
    mrr: mrrRow?.mrr ?? 0,
    recentSignups: recentSignupsResult.results,
  });
});

export { cockpit };
