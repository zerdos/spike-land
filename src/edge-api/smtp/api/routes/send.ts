import { Hono } from "hono";

import type { Env, Variables } from "../../core-logic/env";
import { sendEmail } from "../../core-logic/resend-client";

interface SendEmailBody {
  to: string;
  subject: string;
  body: string;
  html?: string;
  replyTo?: string;
  from?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOURLY_LIMIT = 5;

const ALLOWED_FROM = new Set(["outreach@spike.land", "noreply@spike.land"]);

const send = new Hono<{ Bindings: Env; Variables: Variables }>();

send.post("/send", async (c) => {
  const resendKey = c.env.RESEND_API_KEY;
  if (!resendKey) {
    return c.json({ error: "Email service not configured" }, 503);
  }

  const userId = c.get("userId") as string | undefined;
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userRow = await c.env.DB.prepare("SELECT email, name FROM users WHERE id = ? LIMIT 1")
    .bind(userId)
    .first<{ email: string; name: string | null }>();

  if (!userRow?.email) {
    return c.json({ error: "User account not found" }, 404);
  }

  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const countRow = await c.env.DB.prepare(
    "SELECT COUNT(*) as cnt FROM email_sends WHERE user_id = ? AND created_at > ?",
  )
    .bind(userId, hourAgo)
    .first<{ cnt: number }>();

  if (countRow && countRow.cnt >= HOURLY_LIMIT) {
    return c.json({ error: `Rate limit exceeded — max ${HOURLY_LIMIT} emails per hour` }, 429);
  }

  const req = await c.req.json<SendEmailBody>();

  if (!req.to || !req.subject || !req.body) {
    return c.json({ error: "Missing required fields: to, subject, body" }, 400);
  }

  if (!EMAIL_RE.test(req.to)) {
    return c.json({ error: "Invalid recipient address" }, 400);
  }

  if (req.replyTo && !EMAIL_RE.test(req.replyTo)) {
    return c.json({ error: "Invalid replyTo address" }, 400);
  }

  const fromAddress = req.from && ALLOWED_FROM.has(req.from) ? req.from : "outreach@spike.land";
  const displayName = userRow.name ?? userRow.email.split("@")[0] ?? "spike.land user";
  const fromHeader = `${displayName} via spike.land <${fromAddress}>`;
  const replyTo = req.replyTo ?? userRow.email;

  const payload = {
    from: fromHeader,
    to: req.to,
    subject: req.subject,
    text: req.body,
    reply_to: replyTo,
    ...(req.html ? { html: req.html } : {}),
  };

  const result = await sendEmail(resendKey, payload);

  try {
    await c.env.DB.prepare(
      "INSERT INTO email_sends (user_id, to_address, from_address, subject, resend_id, status) VALUES (?, ?, ?, ?, ?, ?)",
    )
      .bind(
        userId,
        req.to,
        fromHeader,
        req.subject,
        result.id ?? null,
        result.ok ? "sent" : "failed",
      )
      .run();
  } catch (err) {
    console.error("[spike-smtp] audit log failed", err);
  }

  if (!result.ok) {
    return c.json({ error: result.error }, 502);
  }

  return c.json({ ok: true, id: result.id });
});

export { send };
