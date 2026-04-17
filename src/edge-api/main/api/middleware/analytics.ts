import { createMiddleware } from "hono/factory";
import type { Env, Variables } from "../../core-logic/env.js";

/**
 * Hono middleware that writes a single Analytics Engine data point per request
 * to the `ANALYTICS` (`spike_analytics`) dataset.
 *
 * Captures status after `next()` so failed/handled responses are observed too.
 * `writeDataPoint` is synchronous and best-effort — all errors are swallowed
 * so analytics never break the request path.
 *
 * Schema:
 *   blobs   = [path, method, status_class]   // e.g. "/api/foo", "GET", "2xx"
 *   doubles = [duration_ms, status_code]     // e.g. 12.4, 200
 *   indexes = [route_or_host]                // for fast aggregation
 */
export const analyticsMiddleware = createMiddleware<{ Bindings: Env; Variables: Variables }>(
  async (c, next) => {
    const startedAt = Date.now();
    let status = 0;

    try {
      await next();
      status = c.res.status;
    } catch (err) {
      // Re-throw after recording — the global error handler will respond 500.
      status = 500;
      try {
        recordDataPoint(c.env, c.req.raw, c.req.method, c.req.path, status, Date.now() - startedAt);
      } catch {
        /* best-effort */
      }
      throw err;
    }

    try {
      recordDataPoint(c.env, c.req.raw, c.req.method, c.req.path, status, Date.now() - startedAt);
    } catch {
      /* best-effort — analytics must never break a request */
    }
  },
);

function recordDataPoint(
  env: Env,
  request: Request,
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
): void {
  if (!env.ANALYTICS || typeof env.ANALYTICS.writeDataPoint !== "function") return;

  const statusClass = `${Math.floor(statusCode / 100)}xx`;
  const indexValue = pickIndex(request, path);

  env.ANALYTICS.writeDataPoint({
    blobs: [path, method, statusClass],
    doubles: [durationMs, statusCode],
    indexes: [indexValue],
  });
}

/**
 * Pick the index for the data point. Prefer the request host so we can
 * aggregate per vanity host (e.g. `analytics.spike.land`); fall back to the
 * first path segment when the host is missing.
 */
function pickIndex(request: Request, path: string): string {
  const host = request.headers.get("host");
  if (host && host.length > 0) return host.toLowerCase().split(":")[0] ?? host;
  const segment = path.split("/").filter(Boolean)[0];
  return segment ?? "/";
}
