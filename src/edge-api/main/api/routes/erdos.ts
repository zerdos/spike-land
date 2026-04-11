import { Hono } from "hono";
import type { Env, Variables } from "../../core-logic/env.js";

const erdos = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * $ERDOS Twin Prime Mining API
 *
 * POST /api/erdos/submit — Submit a discovered twin prime pair
 * GET  /api/erdos/leaderboard — Top miners by $ERDOS earned
 * GET  /api/erdos/stats — Global mining stats
 */

// Ensure the erdos_discoveries table exists (idempotent)
async function ensureTable(db: D1Database): Promise<void> {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS erdos_discoveries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prime TEXT NOT NULL,
        digits INTEGER NOT NULL,
        reward REAL NOT NULL,
        miner_ip TEXT,
        miner_id TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
    )
    .run();
}

// POST /api/erdos/submit
erdos.post("/api/erdos/submit", async (c) => {
  const body = await c.req.json<{
    prime: string;
    digits: number;
    minerId?: string;
  }>();

  if (!body.prime || !body.digits || body.digits < 1) {
    return c.json({ error: "Missing prime or digits" }, 400);
  }

  // Basic validation: must be odd and > 2
  const lastDigit = body.prime.slice(-1);
  if (
    lastDigit === "0" ||
    lastDigit === "2" ||
    lastDigit === "4" ||
    lastDigit === "6" ||
    lastDigit === "8"
  ) {
    return c.json({ error: "Not a valid prime candidate (even number)" }, 400);
  }

  // Reward: log2(digits) * 0.01
  const reward = Math.log2(body.digits) * 0.01;

  const db = c.env.DB;
  await ensureTable(db);

  const ip = c.req.header("cf-connecting-ip") ?? "unknown";
  const minerId = body.minerId ?? ip;

  await db
    .prepare(
      `INSERT INTO erdos_discoveries (prime, digits, reward, miner_ip, miner_id) VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(body.prime, body.digits, reward, ip, minerId)
    .run();

  // Get total earned by this miner
  const totalResult = await db
    .prepare(`SELECT COALESCE(SUM(reward), 0) as total FROM erdos_discoveries WHERE miner_id = ?`)
    .bind(minerId)
    .first<{ total: number }>();

  return c.json({
    ok: true,
    reward,
    totalEarned: totalResult?.total ?? reward,
    digits: body.digits,
  });
});

// GET /api/erdos/leaderboard
erdos.get("/api/erdos/leaderboard", async (c) => {
  const db = c.env.DB;
  await ensureTable(db);

  const results = await db
    .prepare(
      `SELECT miner_id, COUNT(*) as discoveries, SUM(reward) as total_earned, MAX(digits) as largest_prime
       FROM erdos_discoveries
       GROUP BY miner_id
       ORDER BY total_earned DESC
       LIMIT 50`,
    )
    .all();

  return c.json({
    leaderboard: results.results ?? [],
  });
});

// GET /api/erdos/stats
erdos.get("/api/erdos/stats", async (c) => {
  const db = c.env.DB;
  await ensureTable(db);

  const stats = await db
    .prepare(
      `SELECT COUNT(*) as total_discoveries, COALESCE(SUM(reward), 0) as total_mined, MAX(digits) as largest_prime, COUNT(DISTINCT miner_id) as unique_miners
       FROM erdos_discoveries`,
    )
    .first<{
      total_discoveries: number;
      total_mined: number;
      largest_prime: number;
      unique_miners: number;
    }>();

  return c.json({
    totalDiscoveries: stats?.total_discoveries ?? 0,
    totalMined: stats?.total_mined ?? 0,
    largestPrime: stats?.largest_prime ?? 0,
    uniqueMiners: stats?.unique_miners ?? 0,
  });
});

export { erdos };
