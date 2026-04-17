import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../../core-logic/env";
import type { Variables } from "../middleware";

export const presenceRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

const heartbeatBody = z.object({
  channelId: z.string().min(1),
  status: z.enum(["online", "away", "dnd", "offline"]).default("online"),
});

interface PresenceState {
  [userId: string]: { status: string; lastSeen: number };
}

/**
 * GET /presence?channelId=...
 * Returns the in-memory presence state for the given channel from the PRESENCE_DO.
 */
presenceRouter.get("/", async (c) => {
  const channelId = c.req.query("channelId");
  if (!channelId) return c.json({ error: "Missing channelId" }, 400);

  const stub = c.env.PRESENCE_DO.get(c.env.PRESENCE_DO.idFromName(channelId));
  const res = await stub.fetch(new Request("http://internal/state", { method: "GET" }));
  if (!res.ok) return c.json({}, 200);
  const state = (await res.json()) as PresenceState;
  return c.json(state);
});

/**
 * POST /presence/heartbeat
 * REST-based heartbeat: forwards the user's heartbeat to the channel's PRESENCE_DO,
 * which tracks last-seen and expires stale entries on a TTL alarm.
 */
presenceRouter.post("/heartbeat", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const parsed = heartbeatBody.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", issues: parsed.error.issues }, 400);
  }

  const stub = c.env.PRESENCE_DO.get(c.env.PRESENCE_DO.idFromName(parsed.data.channelId));
  await stub.fetch(
    new Request("http://internal/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status: parsed.data.status }),
    }),
  );

  return c.json({ success: true, lastSeen: Date.now() });
});
