import { Hono } from "hono";

import type { Env, Variables } from "../../core-logic/env";

const inbox = new Hono<{ Bindings: Env; Variables: Variables }>();

interface InboundRow {
  id: string;
  message_id: string | null;
  from_address: string | null;
  to_address: string | null;
  subject: string | null;
  r2_key: string;
  received_at: string;
}

inbox.get("/inbox", async (c) => {
  const userEmail = c.get("userEmail") as string | undefined;
  if (!userEmail) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const limit = Math.min(100, Math.max(1, Number(c.req.query("limit") ?? 50)));

  const rows = await c.env.DB.prepare(
    "SELECT id, message_id, from_address, to_address, subject, r2_key, received_at " +
      "FROM email_inbound WHERE to_address LIKE ? ORDER BY received_at DESC LIMIT ?",
  )
    .bind(`%${userEmail}%`, limit)
    .all<InboundRow>();

  return c.json({ messages: rows.results ?? [] });
});

inbox.get("/inbox/:id/raw", async (c) => {
  const userEmail = c.get("userEmail") as string | undefined;
  if (!userEmail) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const row = await c.env.DB.prepare(
    "SELECT r2_key, to_address FROM email_inbound WHERE id = ? LIMIT 1",
  )
    .bind(id)
    .first<{ r2_key: string; to_address: string | null }>();

  if (!row) {
    return c.json({ error: "Not found" }, 404);
  }

  if (!row.to_address?.toLowerCase().includes(userEmail.toLowerCase())) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const obj = await c.env.RAW_EMAILS.get(row.r2_key);
  if (!obj) {
    return c.json({ error: "Raw message missing" }, 410);
  }

  return new Response(obj.body, {
    headers: { "Content-Type": "message/rfc822" },
  });
});

export { inbox };
