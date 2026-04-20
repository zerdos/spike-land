import { Hono } from "hono";
import type { Context, Next } from "hono";
import { cors } from "hono/cors";

import type { Env, Variables } from "../core-logic/env";
import { parseHeaders, streamToString } from "../core-logic/inbound-parser";
import { health } from "./routes/health";
import { inbox } from "./routes/inbox";
import { send } from "./routes/send";

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowed = ["https://spike.land", "https://smtp.spike.land"];
      if (c.env.APP_ENV !== "production") {
        allowed.push("http://localhost:8793");
      }
      return allowed.includes(origin) ? origin : allowed[0]!;
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);

app.use("*", async (c, next) => {
  const id = crypto.randomUUID();
  c.set("requestId", id);
  c.header("X-Request-ID", id);
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
});

app.use("/send/*", authMiddleware);
app.use("/send", authMiddleware);
app.use("/inbox/*", authMiddleware);
app.use("/inbox", authMiddleware);

app.route("/", health);
app.route("/", send);
app.route("/", inbox);

app.onError((err, c) => {
  console.error(`[spike-smtp] ${err.message}`, err.stack);
  return c.json({ error: "Internal server error" }, 500);
});

app.notFound((c) => c.json({ error: "Not found", service: "spike-smtp" }, 404));

async function authMiddleware(c: AppContext, next: Next): Promise<Response | void> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const res = await c.env.AUTH_MCP.fetch(
    new Request("https://auth/verify", {
      headers: { Authorization: authHeader },
    }),
  );
  if (!res.ok) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const data = (await res.json()) as { userId?: string; email?: string };
  if (!data.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("userId", data.userId);
  c.set("userEmail", data.email ?? "");
  await next();
}

function allowedInboundDomain(address: string, env: Env): boolean {
  const domains = (env.ALLOWED_INBOUND_DOMAINS ?? "spike.land")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  const at = address.lastIndexOf("@");
  if (at < 0) return false;
  const domain = address.slice(at + 1).toLowerCase();
  return domains.includes(domain);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },

  async email(message: ForwardableEmailMessage, env: Env, _ctx: ExecutionContext) {
    if (!allowedInboundDomain(message.to, env)) {
      message.setReject("Recipient not accepted");
      return;
    }

    let raw: string;
    try {
      raw = await streamToString(message.raw);
    } catch (err) {
      console.error("[spike-smtp] inbound read failed", err);
      message.setReject("Message could not be read");
      return;
    }

    const headers = parseHeaders(raw);
    const id = crypto.randomUUID();
    const r2Key = `inbound/${new Date().toISOString().slice(0, 10)}/${id}.eml`;

    await env.RAW_EMAILS.put(r2Key, raw, {
      httpMetadata: { contentType: "message/rfc822" },
      customMetadata: {
        from: message.from,
        to: message.to,
        messageId: headers.messageId ?? "",
      },
    });

    await env.DB.prepare(
      "INSERT INTO email_inbound (id, message_id, from_address, to_address, subject, in_reply_to, r2_key, size_bytes) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        id,
        headers.messageId,
        headers.from ?? message.from,
        headers.to ?? message.to,
        headers.subject,
        headers.inReplyTo,
        r2Key,
        message.rawSize,
      )
      .run();
  },
} satisfies ExportedHandler<Env>;

export { app };
