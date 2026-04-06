import { Hono } from "hono";

import type { Env, Variables } from "../../core-logic/env";

const health = new Hono<{ Bindings: Env; Variables: Variables }>();

health.get("/health", (c) => c.json({ status: "ok", service: "spike-notepad" }));

health.get("/", (c) => c.redirect("/app"));

export { health };
