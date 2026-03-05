/**
 * QA Studio Worker Entry
 *
 * Hono app that routes MCP HTTP transport and tool calls to
 * BrowserSessionDO via Durable Objects.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./env.js";
import type { BrowserSessionDO } from "./session-do.js";

export { BrowserSessionDO } from "./session-do.js";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({
  origin: ["https://spike.land"],
  credentials: true,
  exposeHeaders: ["mcp-session-id"],
}));

function getSessionDO(env: Env, sessionId: string) {
  const id = env.BROWSER_SESSION.idFromName(sessionId);
  return env.BROWSER_SESSION.get(id) as unknown as BrowserSessionDO;
}

app.post("/api/session/:sessionId/navigate", async (c) => {
  const { sessionId } = c.req.param();
  const body = await c.req.json<{ url: string; wait_until?: string; tab?: number }>();
  const stub = getSessionDO(c.env, sessionId);
  const result = await stub.navigate(body.url, body.wait_until ?? "load", body.tab);
  return c.json({ text: result });
});

app.post("/api/session/:sessionId/read", async (c) => {
  const { sessionId } = c.req.param();
  const body = await c.req.json<{ detail?: string; landmark?: string }>();
  const stub = getSessionDO(c.env, sessionId);
  const result = await stub.readPage(
    (body.detail as "compact" | "full" | "landmark") ?? "compact",
    body.landmark,
  );
  return c.json({ text: result });
});

app.post("/api/session/:sessionId/click", async (c) => {
  const { sessionId } = c.req.param();
  const body = await c.req.json<{ ref?: number; role?: string; name?: string }>();
  const stub = getSessionDO(c.env, sessionId);
  const result = await stub.click(body.ref, body.role, body.name);
  return c.json({ text: result });
});

app.post("/api/session/:sessionId/type", async (c) => {
  const { sessionId } = c.req.param();
  const body = await c.req.json<{ text: string; ref?: number; name?: string; clear?: boolean }>();
  const stub = getSessionDO(c.env, sessionId);
  const result = await stub.type(body.text, body.ref, body.name, body.clear !== false);
  return c.json({ text: result });
});

app.post("/api/session/:sessionId/select", async (c) => {
  const { sessionId } = c.req.param();
  const body = await c.req.json<{ option: string; ref?: number; name?: string }>();
  const stub = getSessionDO(c.env, sessionId);
  const result = await stub.select(body.option, body.ref, body.name);
  return c.json({ text: result });
});

app.post("/api/session/:sessionId/press", async (c) => {
  const { sessionId } = c.req.param();
  const body = await c.req.json<{ key: string }>();
  const stub = getSessionDO(c.env, sessionId);
  const result = await stub.press(body.key);
  return c.json({ text: result });
});

app.post("/api/session/:sessionId/scroll", async (c) => {
  const { sessionId } = c.req.param();
  const body = await c.req.json<{ direction?: "up" | "down"; amount?: number }>();
  const stub = getSessionDO(c.env, sessionId);
  const result = await stub.scroll(body.direction ?? "down", body.amount ?? 1);
  return c.json({ text: result });
});

app.post("/api/session/:sessionId/screenshot", async (c) => {
  const { sessionId } = c.req.param();
  const body = await c.req.json<{ full_page?: boolean }>();
  const stub = getSessionDO(c.env, sessionId);
  const base64 = await stub.screenshot(body.full_page ?? false);
  if (!base64) return c.json({ error: "No active tab" }, 400);
  return c.json({ data: base64, mimeType: "image/png" });
});

app.get("/api/session/:sessionId/tabs", async (c) => {
  const { sessionId } = c.req.param();
  const stub = getSessionDO(c.env, sessionId);
  const tabs = await stub.listTabs();
  return c.json({ tabs });
});

app.delete("/api/session/:sessionId/tabs/:tabIndex", async (c) => {
  const { sessionId, tabIndex } = c.req.param();
  const stub = getSessionDO(c.env, sessionId);
  const closed = await stub.closeTab(parseInt(tabIndex, 10));
  return c.json({ closed });
});

app.get("/health", (c) => c.json({ status: "ok" }));

export default app;
