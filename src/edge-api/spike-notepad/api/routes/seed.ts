import { Hono } from "hono";

import type { Env, Variables } from "../../core-logic/env";

const seed = new Hono<{ Bindings: Env; Variables: Variables }>();

interface SeedItem {
  content: string;
  hint_type?: string;
}

const NOTE_W = 280;
const RADIUS = 360;

// Lay out N notes around a center point. Center single note, line up two, otherwise circle.
function layoutPositions(count: number, cx: number, cy: number): Array<{ x: number; y: number }> {
  if (count <= 0) return [];
  if (count === 1) return [{ x: cx - NOTE_W / 2, y: cy - 40 }];
  const out: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2; // first note at top
    const x = cx + Math.cos(angle) * RADIUS - NOTE_W / 2;
    const y = cy + Math.sin(angle) * RADIUS - 40;
    out.push({ x, y });
  }
  return out;
}

seed.post("/api/projects/:projectId/seed", async (c) => {
  const projectId = c.req.param("projectId");
  const body = await c.req.json<{
    notes: SeedItem[];
    center_x?: number;
    center_y?: number;
  }>();

  const items = (body.notes || []).filter(
    (n) => n && typeof n.content === "string" && n.content.trim(),
  );
  if (!items.length) return c.json({ error: "notes array is required" }, 400);
  if (items.length > 12) return c.json({ error: "max 12 seed notes" }, 400);

  const project = await c.env.DB.prepare("SELECT id FROM projects WHERE id = ?")
    .bind(projectId)
    .first();
  if (!project) return c.json({ error: "Project not found" }, 404);

  const cx = typeof body.center_x === "number" ? body.center_x : 1000;
  const cy = typeof body.center_y === "number" ? body.center_y : 1000;
  const positions = layoutPositions(items.length, cx, cy);

  const now = Date.now();
  const created: Array<Record<string, unknown>> = [];
  const statements = [] as D1PreparedStatement[];

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const pos = positions[i]!;
    const id = crypto.randomUUID();
    const type = item.hint_type ?? "general";
    statements.push(
      c.env.DB.prepare(
        "INSERT INTO notes (id, project_id, content, type, tags, position_x, position_y, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).bind(id, projectId, item.content.trim(), type, "[]", pos.x, pos.y, now, now),
    );
    created.push({
      id,
      project_id: projectId,
      content: item.content.trim(),
      type,
      confidence: 0,
      tags: [],
      pinned: false,
      position_x: pos.x,
      position_y: pos.y,
      created_at: now,
      updated_at: now,
    });
  }
  statements.push(
    c.env.DB.prepare("UPDATE projects SET updated_at = ? WHERE id = ?").bind(now, projectId),
  );
  await c.env.DB.batch(statements);

  return c.json({ notes: created }, 201);
});

export { seed };
