/**
 * Chess Player Endpoints
 *
 * GET /api/chess/players/me — return (or lazily create) the authenticated
 *                             user's chess player record
 *
 * The ChessPlayer row is keyed by userId (from the auth session). On first
 * visit the record is created with default ELO 1200 and a display name
 * derived from the user's email (or their userId as fallback).
 */

import { Hono } from "hono";
import type { Env, Variables } from "../../core-logic/env.js";

const chess = new Hono<{ Bindings: Env; Variables: Variables }>();

interface ChessPlayerRow {
  id: string;
  userId: string;
  name: string;
  avatar: string | null;
  elo: number;
  bestElo: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  soundEnabled: number; // D1 stores booleans as integers
  isOnline: number;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Derive a display name from an email address or fall back to the userId. */
function deriveDisplayName(email: string | undefined, userId: string): string {
  if (!email) return userId.slice(0, 16);
  const local = email.split("@")[0] ?? "";
  return local.length > 0 ? local : userId.slice(0, 16);
}

chess.get("/api/chess/players/me", async (c) => {
  const userId = c.get("userId") as string | undefined;
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Look up by userId — each user has at most one chess player record.
  const existing = await c.env.DB.prepare(
    `SELECT id, userId, name, avatar, elo, bestElo, wins, losses, draws,
            streak, soundEnabled, isOnline, lastSeenAt, createdAt, updatedAt
     FROM ChessPlayer WHERE userId = ? LIMIT 1`,
  )
    .bind(userId)
    .first<ChessPlayerRow>();

  if (existing) {
    return c.json({
      id: existing.id,
      userId: existing.userId,
      name: existing.name,
      avatar: existing.avatar,
      elo: existing.elo,
      bestElo: existing.bestElo,
      wins: existing.wins,
      losses: existing.losses,
      draws: existing.draws,
      streak: existing.streak,
      isOnline: existing.isOnline === 1,
    });
  }

  // First visit — create the player record.
  const userEmail = c.get("userEmail") as string | undefined;
  const displayName = deriveDisplayName(userEmail, userId);

  // Generate a CUID-style ID. D1 does not expose uuid(), so we use a
  // timestamp-prefixed random string that is unique enough for this purpose.
  const newId = "cp_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO ChessPlayer
       (id, userId, name, avatar, elo, bestElo, wins, losses, draws,
        streak, soundEnabled, isOnline, lastSeenAt, createdAt, updatedAt)
     VALUES (?, ?, ?, NULL, 1200, 1200, 0, 0, 0, 0, 1, 0, NULL, ?, ?)`,
  )
    .bind(newId, userId, displayName, now, now)
    .run();

  return c.json(
    {
      id: newId,
      userId,
      name: displayName,
      avatar: null,
      elo: 1200,
      bestElo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,
      isOnline: false,
    },
    201,
  );
});

export { chess };
