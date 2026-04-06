import { Hono } from "hono";
import { cors } from "hono/cors";

import type { Env, Variables } from "../core-logic/env";
import { health } from "./routes/health";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use(
  "*",
  cors({
    origin: ["https://notepad.spike.land", "https://spike.land", "http://localhost:8790"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

app.route("/", health);

app.onError((err, c) => {
  console.error(`[spike-notepad] ${err.message}`, err.stack);
  return c.json({ error: "Internal server error" }, 500);
});

app.notFound((c) => c.json({ error: "Not found", service: "spike-notepad" }, 404));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;

export { app };
