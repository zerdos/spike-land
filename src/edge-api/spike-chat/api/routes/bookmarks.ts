import { Hono } from "hono";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import type { Env } from "../../core-logic/env";
import type { Variables } from "../middleware";
import { createDb } from "../../db/db-index";
import { bookmarks } from "../../db/schema";
import { generateId } from "../../core-logic/id-gen";

export const bookmarksRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

const addBookmarkBody = z.object({
  messageId: z.string().min(1),
  note: z.string().max(2000).optional(),
});

/**
 * GET /bookmarks
 * Lists the user's starred messages, newest first.
 * TODO(BUG-S6-19): D1 binding may not be provisioned in early dev — falls back to empty list.
 */
bookmarksRouter.get("/", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  if (!c.env.DB) return c.json([]);

  const db = createDb(c.env.DB);
  const rows = await db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt));
  return c.json(rows);
});

/**
 * POST /bookmarks
 * Adds a bookmark. Idempotent: if (userId, messageId) already exists, returns the existing row.
 */
bookmarksRouter.post("/", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const parsed = addBookmarkBody.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", issues: parsed.error.issues }, 400);
  }

  if (!c.env.DB) return c.json({ error: "Storage unavailable" }, 503);
  const db = createDb(c.env.DB);

  // Idempotency: check for existing bookmark first.
  const [existing] = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.messageId, parsed.data.messageId)))
    .limit(1);
  if (existing) return c.json(existing);

  const row = {
    id: generateId(),
    userId,
    messageId: parsed.data.messageId,
    note: parsed.data.note ?? null,
    createdAt: Date.now(),
  };
  await db.insert(bookmarks).values(row);
  return c.json(row, 201);
});

/**
 * DELETE /bookmarks/:id
 * Removes a bookmark owned by the caller.
 */
bookmarksRouter.delete("/:id", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  if (!c.env.DB) return c.json({ error: "Storage unavailable" }, 503);

  const db = createDb(c.env.DB);
  const [existing] = await db.select().from(bookmarks).where(eq(bookmarks.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (existing.userId !== userId) return c.json({ error: "Forbidden" }, 403);

  await db.delete(bookmarks).where(eq(bookmarks.id, id));
  return c.json({ success: true });
});
