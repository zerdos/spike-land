import { Hono } from "hono";

import type { Env, Variables } from "../../core-logic/env";

const connections = new Hono<{ Bindings: Env; Variables: Variables }>();

// List connections for a project
connections.get("/api/projects/:projectId/connections", async (c) => {
  const projectId = c.req.param("projectId");
  const { results } = await c.env.DB.prepare("SELECT * FROM connections WHERE project_id = ?")
    .bind(projectId)
    .all();
  return c.json({ connections: results });
});

// Create a connection
connections.post("/api/projects/:projectId/connections", async (c) => {
  const projectId = c.req.param("projectId");
  const body = await c.req.json<{
    source_note_id: string;
    target_note_id: string;
    relationship?: string;
    strength?: number;
  }>();

  if (!body.source_note_id || !body.target_note_id) {
    return c.json({ error: "source_note_id and target_note_id are required" }, 400);
  }
  if (body.source_note_id === body.target_note_id) {
    return c.json({ error: "cannot connect a note to itself" }, 400);
  }

  const project = await c.env.DB.prepare("SELECT id FROM projects WHERE id = ?")
    .bind(projectId)
    .first();
  if (!project) return c.json({ error: "Project not found" }, 404);

  // Enforce uniqueness (undirected): drop existing pair in either direction
  await c.env.DB.prepare(
    `DELETE FROM connections
       WHERE project_id = ?
         AND ((source_note_id = ? AND target_note_id = ?)
           OR (source_note_id = ? AND target_note_id = ?))`,
  )
    .bind(
      projectId,
      body.source_note_id,
      body.target_note_id,
      body.target_note_id,
      body.source_note_id,
    )
    .run();

  const id = crypto.randomUUID();
  const now = Date.now();
  const relationship = body.relationship ?? "";
  const strength = body.strength ?? 0.5;

  await c.env.DB.prepare(
    `INSERT INTO connections (id, project_id, source_note_id, target_note_id, relationship, strength, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, projectId, body.source_note_id, body.target_note_id, relationship, strength, now)
    .run();

  return c.json(
    {
      id,
      project_id: projectId,
      source_note_id: body.source_note_id,
      target_note_id: body.target_note_id,
      relationship,
      strength,
      created_at: now,
    },
    201,
  );
});

// Delete a connection
connections.delete("/api/connections/:id", async (c) => {
  const id = c.req.param("id");
  const result = await c.env.DB.prepare("DELETE FROM connections WHERE id = ?").bind(id).run();
  if (!result.meta.changes) return c.json({ error: "Connection not found" }, 404);
  return c.json({ deleted: true });
});

export { connections };
