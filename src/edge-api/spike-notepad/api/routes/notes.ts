import { Hono } from "hono";

import type { Env, Variables } from "../../core-logic/env";

const notes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Create note
notes.post("/api/projects/:projectId/notes", async (c) => {
  const projectId = c.req.param("projectId");
  const body = await c.req.json<{
    content?: string;
    position_x?: number;
    position_y?: number;
    type?: string;
    tags?: string[];
  }>();

  // Verify project exists
  const project = await c.env.DB.prepare("SELECT id FROM projects WHERE id = ?")
    .bind(projectId)
    .first();
  if (!project) return c.json({ error: "Project not found" }, 404);

  const id = crypto.randomUUID();
  const now = Date.now();
  const content = body.content ?? "";
  const posX = body.position_x ?? 0;
  const posY = body.position_y ?? 0;
  const type = body.type ?? "general";
  const tags = JSON.stringify(body.tags ?? []);

  await c.env.DB.prepare(
    `INSERT INTO notes (id, project_id, content, type, tags, position_x, position_y, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, projectId, content, type, tags, posX, posY, now, now)
    .run();

  // Update project timestamp
  await c.env.DB.prepare("UPDATE projects SET updated_at = ? WHERE id = ?")
    .bind(now, projectId)
    .run();

  return c.json(
    {
      id,
      project_id: projectId,
      content,
      type,
      confidence: 0,
      tags: body.tags ?? [],
      pinned: false,
      position_x: posX,
      position_y: posY,
      created_at: now,
      updated_at: now,
    },
    201,
  );
});

// List notes for a project
notes.get("/api/projects/:projectId/notes", async (c) => {
  const projectId = c.req.param("projectId");
  const type = c.req.query("type");

  let query = "SELECT * FROM notes WHERE project_id = ?";
  const binds: unknown[] = [projectId];

  if (type) {
    query += " AND type = ?";
    binds.push(type);
  }

  query += " ORDER BY pinned DESC, updated_at DESC";

  const stmt = c.env.DB.prepare(query);
  const { results } = await stmt.bind(...binds).all();

  // Parse tags JSON for each note
  const parsed = results.map((n) => ({
    ...n,
    tags: JSON.parse((n.tags as string) || "[]"),
    pinned: Boolean(n.pinned),
  }));

  return c.json({ notes: parsed });
});

// Get single note
notes.get("/api/notes/:id", async (c) => {
  const id = c.req.param("id");

  const note = await c.env.DB.prepare("SELECT * FROM notes WHERE id = ?").bind(id).first();

  if (!note) return c.json({ error: "Note not found" }, 404);

  return c.json({
    ...note,
    tags: JSON.parse((note.tags as string) || "[]"),
    pinned: Boolean(note.pinned),
  });
});

// Update note
notes.put("/api/notes/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    content?: string;
    type?: string;
    tags?: string[];
    pinned?: boolean;
    position_x?: number;
    position_y?: number;
    annotation?: string;
    confidence?: number;
  }>();

  const existing = await c.env.DB.prepare("SELECT * FROM notes WHERE id = ?").bind(id).first();
  if (!existing) return c.json({ error: "Note not found" }, 404);

  const now = Date.now();
  const fields: string[] = ["updated_at = ?"];
  const values: unknown[] = [now];

  if (body.content !== undefined) {
    fields.push("content = ?");
    values.push(body.content);
  }
  if (body.type !== undefined) {
    fields.push("type = ?");
    values.push(body.type);
  }
  if (body.tags !== undefined) {
    fields.push("tags = ?");
    values.push(JSON.stringify(body.tags));
  }
  if (body.pinned !== undefined) {
    fields.push("pinned = ?");
    values.push(body.pinned ? 1 : 0);
  }
  if (body.position_x !== undefined) {
    fields.push("position_x = ?");
    values.push(body.position_x);
  }
  if (body.position_y !== undefined) {
    fields.push("position_y = ?");
    values.push(body.position_y);
  }
  if (body.annotation !== undefined) {
    fields.push("annotation = ?");
    values.push(body.annotation);
  }
  if (body.confidence !== undefined) {
    fields.push("confidence = ?");
    values.push(body.confidence);
  }

  values.push(id);

  await c.env.DB.prepare(`UPDATE notes SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  // Return updated note
  const updated = await c.env.DB.prepare("SELECT * FROM notes WHERE id = ?").bind(id).first();

  return c.json({
    ...updated,
    tags: JSON.parse((updated!.tags as string) || "[]"),
    pinned: Boolean(updated!.pinned),
  });
});

// Delete note
notes.delete("/api/notes/:id", async (c) => {
  const id = c.req.param("id");

  const result = await c.env.DB.prepare("DELETE FROM notes WHERE id = ?").bind(id).run();

  if (!result.meta.changes) return c.json({ error: "Note not found" }, 404);

  return c.json({ deleted: true });
});

// Batch update positions (for drag operations)
notes.put("/api/projects/:projectId/notes/positions", async (c) => {
  const body = await c.req.json<{
    updates: Array<{ id: string; position_x: number; position_y: number }>;
  }>();

  const now = Date.now();
  const stmts = body.updates.map((u) =>
    c.env.DB.prepare(
      "UPDATE notes SET position_x = ?, position_y = ?, updated_at = ? WHERE id = ?",
    ).bind(u.position_x, u.position_y, now, u.id),
  );

  await c.env.DB.batch(stmts);

  return c.json({ updated: body.updates.length });
});

export { notes };
