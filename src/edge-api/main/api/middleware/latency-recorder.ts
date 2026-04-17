import { createMiddleware } from "hono/factory";
import type { Env, Variables } from "../../core-logic/env.js";
import { getLatencyBuffer } from "../../../common/core-logic/latency-buffer.js";

/**
 * Records each request's wall-clock duration into the per-isolate ring buffer
 * used by /health to compute p50/p99 (BUG-S6-18).
 *
 * Coexists with the Analytics Engine / D1 service-metrics middleware: the
 * concerns are different (Analytics persists cross-isolate aggregation; this
 * buffer answers "is THIS isolate slow right now?").
 *
 * The /health request itself is excluded so that probe latency doesn't pollute
 * the very metric we're reporting.
 */
export const latencyRecorderMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const path = c.req.path;
  const isHealthProbe = path === "/health" || path === "/api/health";
  if (isHealthProbe) {
    return next();
  }

  const start = Date.now();
  try {
    await next();
  } finally {
    const duration = Date.now() - start;
    getLatencyBuffer("spike-edge").record(duration);
  }
});
