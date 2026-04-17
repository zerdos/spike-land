import { Hono } from "hono";
import { z } from "zod";
import { eq, and, isNull, sql } from "drizzle-orm";
import type { Env } from "../../core-logic/env";
import type { Variables } from "../middleware";
import { createDb } from "../../db/db-index";
import { messages } from "../../db/schema";
import { generateId } from "../../core-logic/id-gen";

export const threadsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

const replyBody = z.object({
  content: z.string().min(1).max(8000),
  contentType: z.string().max(50).optional(),
});

/**
 * GET /messages/:id/replies
 * Returns the reply chain (thread) for a parent message in chronological order.
 * TODO(BUG-S6-19): D1 binding may not be provisioned in early dev — falls back to empty list.
 */
threadsRouter.get("/:id/replies", async (c) => {
  const id = c.req.param("id");
  if (!c.env.DB) return c.json([]);

  const db = createDb(c.env.DB);
  const replies = await db
    .select()
    .from(messages)
    .where(and(eq(messages.threadId, id), isNull(messages.deletedAt)))
    .orderBy(messages.createdAt);
  return c.json(replies);
});

/**
 * POST /messages/:id/replies
 * Posts a reply to a parent message; bumps the parent's replyCount.
 */
threadsRouter.post("/:id/replies", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const parentId = c.req.param("id");

  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const parsed = replyBody.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", issues: parsed.error.issues }, 400);
  }

  if (!c.env.DB) return c.json({ error: "Storage unavailable" }, 503);
  const db = createDb(c.env.DB);

  const [parent] = await db.select().from(messages).where(eq(messages.id, parentId)).limit(1);
  if (!parent) return c.json({ error: "Parent message not found" }, 404);

  const reply = {
    id: generateId(),
    channelId: parent.channelId,
    userId,
    threadId: parentId,
    content: parsed.data.content,
    contentType: parsed.data.contentType ?? "text",
    createdAt: Date.now(),
  };
  await db.insert(messages).values(reply);
  await db
    .update(messages)
    .set({ replyCount: sql`${messages.replyCount} + 1` })
    .where(eq(messages.id, parentId));

  return c.json(reply, 201);
});
