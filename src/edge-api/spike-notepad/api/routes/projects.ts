import { Hono } from "hono";

import type { Env, Variables } from "../../core-logic/env";

const projects = new Hono<{ Bindings: Env; Variables: Variables }>();

// Create project
projects.post("/api/projects", async (c) => {
  const { name } = await c.req.json<{ name: string }>();
  if (!name?.trim()) return c.json({ error: "name is required" }, 400);

  const id = crypto.randomUUID();
  const now = Date.now();

  await c.env.DB.prepare(
    "INSERT INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
  )
    .bind(id, name.trim(), now, now)
    .run();

  return c.json({ id, name: name.trim(), created_at: now, updated_at: now }, 201);
});

// List projects
projects.get("/api/projects", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM projects ORDER BY updated_at DESC",
  ).all();

  return c.json({ projects: results });
});

// Get single project with note count
projects.get("/api/projects/:id", async (c) => {
  const id = c.req.param("id");

  const project = await c.env.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(id).first();

  if (!project) return c.json({ error: "Project not found" }, 404);

  const noteCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM notes WHERE project_id = ?",
  )
    .bind(id)
    .first<{ count: number }>();

  return c.json({ ...project, note_count: noteCount?.count ?? 0 });
});

// Delete project (cascades to notes, connections, syntheses)
projects.delete("/api/projects/:id", async (c) => {
  const id = c.req.param("id");

  const result = await c.env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();

  if (!result.meta.changes) return c.json({ error: "Project not found" }, 404);

  return c.json({ deleted: true });
});

export { projects };
