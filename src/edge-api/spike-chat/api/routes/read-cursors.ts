import { Hono } from "hono";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import type { Env } from "../../core-logic/env";
import type { Variables } from "../middleware";
import { createDb } from "../../db/db-index";
import { readCursors } from "../../db/schema";

export const readCursorsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

const setCursorBody = z.object({
  channelId: z.string().min(1),
  lastReadMessageId: z.string().min(1),
});

/**
 * GET /me/cursors
 * Returns all read cursors for the authenticated user.
 * TODO(BUG-S6-19): D1 binding may not be provisioned in early dev — falls back to empty list.
 */
readCursorsRouter.get("/cursors", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  if (!c.env.DB) return c.json([]);

  const db = createDb(c.env.DB);
  const rows = await db.select().from(readCursors).where(eq(readCursors.userId, userId));
  return c.json(rows);
});

/**
 * GET /me/channels/:channelId/cursor
 * Returns the user's read cursor for a single channel, or null if none.
 */
readCursorsRouter.get("/channels/:channelId/cursor", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const channelId = c.req.param("channelId");
  if (!c.env.DB) return c.json(null);

  const db = createDb(c.env.DB);
  const [row] = await db
    .select()
    .from(readCursors)
    .where(and(eq(readCursors.userId, userId), eq(readCursors.channelId, channelId)))
    .limit(1);
  return c.json(row ?? null);
});

/**
 * POST /me/channels/read
 * Sets / upserts the user's last-read marker for a channel.
 * TODO(BUG-S6-19): D1 binding may not be provisioned in early dev — returns 503 in that case.
 */
readCursorsRouter.post("/channels/read", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const parsed = setCursorBody.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", issues: parsed.error.issues }, 400);
  }

  if (!c.env.DB) return c.json({ error: "Storage unavailable" }, 503);
  const db = createDb(c.env.DB);
  const now = Date.now();

  await db
    .insert(readCursors)
    .values({
      userId,
      channelId: parsed.data.channelId,
      lastReadMessageId: parsed.data.lastReadMessageId,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [readCursors.userId, readCursors.channelId],
      set: {
        lastReadMessageId: parsed.data.lastReadMessageId,
        updatedAt: now,
      },
    });

  return c.json({ success: true, updatedAt: now });
});
