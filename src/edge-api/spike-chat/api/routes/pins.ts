import { Hono } from "hono";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import type { Env } from "../../core-logic/env";
import type { Variables } from "../middleware";
import { createDb } from "../../db/db-index";
import { pins } from "../../db/schema";
import { generateId } from "../../core-logic/id-gen";

export const pinsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

const addPinBody = z.object({
  messageId: z.string().min(1),
});

/**
 * GET /channels/:channelId/pins
 * Returns pinned messages for the channel, newest first.
 * TODO(BUG-S6-19): D1 binding may not be provisioned in early dev — falls back to empty list.
 */
pinsRouter.get("/:channelId/pins", async (c) => {
  const channelId = c.req.param("channelId");
  if (!c.env.DB) return c.json([]);

  const db = createDb(c.env.DB);
  const rows = await db
    .select()
    .from(pins)
    .where(eq(pins.channelId, channelId))
    .orderBy(desc(pins.createdAt));
  return c.json(rows);
});

/**
 * POST /channels/:channelId/pins
 * Pins a message in the channel. Idempotent — if already pinned, returns the existing pin row.
 */
pinsRouter.post("/:channelId/pins", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const channelId = c.req.param("channelId");

  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const parsed = addPinBody.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", issues: parsed.error.issues }, 400);
  }

  if (!c.env.DB) return c.json({ error: "Storage unavailable" }, 503);
  const db = createDb(c.env.DB);

  const [existing] = await db
    .select()
    .from(pins)
    .where(and(eq(pins.channelId, channelId), eq(pins.messageId, parsed.data.messageId)))
    .limit(1);
  if (existing) return c.json(existing);

  const row = {
    id: generateId(),
    channelId,
    messageId: parsed.data.messageId,
    pinnedBy: userId,
    createdAt: Date.now(),
  };
  await db.insert(pins).values(row);
  return c.json(row, 201);
});

/**
 * DELETE /channels/:channelId/pins/:messageId
 * Unpins a message in the channel.
 */
pinsRouter.delete("/:channelId/pins/:messageId", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const channelId = c.req.param("channelId");
  const messageId = c.req.param("messageId");
  if (!c.env.DB) return c.json({ error: "Storage unavailable" }, 503);

  const db = createDb(c.env.DB);
  const [existing] = await db
    .select()
    .from(pins)
    .where(and(eq(pins.channelId, channelId), eq(pins.messageId, messageId)))
    .limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);

  await db.delete(pins).where(and(eq(pins.channelId, channelId), eq(pins.messageId, messageId)));
  return c.json({ success: true });
});
