import { Hono } from "hono";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import type { Env } from "../../core-logic/env";
import type { Variables } from "../middleware";
import { createDb } from "../../db/db-index";
import { reactions } from "../../db/schema";
import { generateId } from "../../core-logic/id-gen";

export const reactionsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

const addReactionBody = z.object({
  emoji: z.string().min(1).max(64),
});

/**
 * GET /messages/:id/reactions
 * Aggregates reactions per emoji: { emoji, count, users: [...userIds] }.
 * TODO(BUG-S6-19): D1 binding may not be provisioned in early dev — falls back to empty list.
 */
reactionsRouter.get("/:id/reactions", async (c) => {
  const id = c.req.param("id");
  if (!c.env.DB) return c.json([]);

  const db = createDb(c.env.DB);
  const rows = await db.select().from(reactions).where(eq(reactions.messageId, id));

  const grouped = new Map<string, { emoji: string; count: number; users: string[] }>();
  for (const r of rows) {
    const existing = grouped.get(r.emoji);
    if (existing) {
      existing.count += 1;
      existing.users.push(r.userId);
    } else {
      grouped.set(r.emoji, { emoji: r.emoji, count: 1, users: [r.userId] });
    }
  }
  return c.json(Array.from(grouped.values()));
});

/**
 * POST /messages/:id/reactions
 * Adds a reaction. Idempotent: if (messageId, userId, emoji) already exists, returns existing row.
 */
reactionsRouter.post("/:id/reactions", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const messageId = c.req.param("id");

  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const parsed = addReactionBody.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", issues: parsed.error.issues }, 400);
  }

  if (!c.env.DB) return c.json({ error: "Storage unavailable" }, 503);
  const db = createDb(c.env.DB);

  const [existing] = await db
    .select()
    .from(reactions)
    .where(
      and(
        eq(reactions.messageId, messageId),
        eq(reactions.userId, userId),
        eq(reactions.emoji, parsed.data.emoji),
      ),
    )
    .limit(1);
  if (existing) return c.json(existing);

  const row = {
    id: generateId(),
    messageId,
    userId,
    emoji: parsed.data.emoji,
    createdAt: Date.now(),
  };
  await db.insert(reactions).values(row);
  return c.json(row, 201);
});

/**
 * DELETE /messages/:id/reactions/:emoji
 * Removes the caller's reaction with the given emoji from the message.
 */
reactionsRouter.delete("/:id/reactions/:emoji", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const messageId = c.req.param("id");
  const emoji = decodeURIComponent(c.req.param("emoji"));
  if (!c.env.DB) return c.json({ error: "Storage unavailable" }, 503);

  const db = createDb(c.env.DB);
  await db
    .delete(reactions)
    .where(
      and(
        eq(reactions.messageId, messageId),
        eq(reactions.userId, userId),
        eq(reactions.emoji, emoji),
      ),
    );
  return c.json({ success: true });
});
