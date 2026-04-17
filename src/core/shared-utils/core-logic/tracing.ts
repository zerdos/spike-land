/**
 * Lightweight distributed tracing for spike-land workers.
 *
 * Zero-deps. Reads/creates a trace ID per request, propagates it on outgoing
 * fetches, and emits one structured JSON log line per request via Hono
 * middleware. Designed as a pragmatic alternative to OpenTelemetry for
 * cross-service request correlation in the spike-edge → mcp-auth →
 * spike-land-mcp → spike-land-backend → spike-chat → transpile mesh.
 *
 * BUG-S6-04
 *
 * NOTE: The middleware factory below is structurally compatible with Hono's
 * `MiddlewareHandler` but does NOT import Hono — that keeps the `shared`
 * package zero-deps for non-Hono consumers (mcp-image-studio, spike-cli, etc.).
 */

/** Header used for the trace ID propagated across services. */
export const TRACE_ID_HEADER = "x-trace-id";
/** Alternate, also-supported headers we accept on inbound requests. */
export const REQUEST_ID_HEADER = "x-request-id";
export const CF_RAY_HEADER = "cf-ray";
/** Optional parent span id (caller passes it; receiver may log it). */
export const PARENT_SPAN_ID_HEADER = "x-parent-span-id";

/** Variables injected into Hono `c.var` by `tracingMiddleware`. */
export interface TracingVariables {
  traceId: string;
  parentSpanId?: string;
}

/** Per-request log payload (one JSON line per completed request). */
export interface TracingLogEntry {
  traceId: string;
  parentSpanId?: string;
  worker: string;
  method: string;
  path: string;
  status: number;
  duration_ms: number;
  timestamp: string;
}

/** Options for `tracingMiddleware`. */
export interface TracingMiddlewareOptions {
  /**
   * Override the worker name. Defaults to `env.WORKER_NAME` or `"unknown"` at
   * request time.
   */
  worker?: string;
  /** Sink for the per-request log line (default: `console.log`). */
  log?: (entry: TracingLogEntry) => void;
  /** Override the clock (test seam). */
  now?: () => number;
}

/**
 * Read an existing trace id from inbound headers, or mint a fresh UUID.
 *
 * Lookup order: `x-trace-id` → `x-request-id` → `cf-ray` → new UUID.
 * Empty / whitespace-only header values are ignored.
 */
export function getOrCreateTraceId(req: Request): string {
  const headers = req.headers;
  const candidates = [
    headers.get(TRACE_ID_HEADER),
    headers.get(REQUEST_ID_HEADER),
    headers.get(CF_RAY_HEADER),
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return crypto.randomUUID();
}

/**
 * Return a `Headers` object that merges the caller's headers with the trace
 * propagation headers. Use on outgoing fetches to other workers so the
 * downstream receiver sees the same `traceId`.
 *
 * If `parentSpanId` is supplied it is forwarded as `x-parent-span-id` so the
 * downstream service can record the call chain.
 */
export function withTraceHeaders(
  headers: HeadersInit | undefined,
  traceId: string,
  parentSpanId?: string,
): Headers {
  const merged = new Headers(headers ?? undefined);
  merged.set(TRACE_ID_HEADER, traceId);
  if (typeof parentSpanId === "string" && parentSpanId.length > 0) {
    merged.set(PARENT_SPAN_ID_HEADER, parentSpanId);
  }
  return merged;
}

/**
 * Minimal structural type matching `hono`'s `Context` for our needs.
 * Avoids depending on the `hono` package from the shared utility.
 */
export interface MinimalTracingContext {
  req: { raw: Request; method: string; url: string; header(name: string): string | undefined };
  res: Response;
  env: unknown;
  set(key: string, value: unknown): void;
}

/** Hono-compatible `next` signature. */
export type MinimalNext = () => Promise<void>;

/** Hono-compatible middleware signature. */
export type MinimalMiddleware = (c: MinimalTracingContext, next: MinimalNext) => Promise<void>;

interface MinimalEnvWithWorkerName {
  WORKER_NAME?: string;
}

function resolveWorkerName(c: MinimalTracingContext, override: string | undefined): string {
  if (typeof override === "string" && override.length > 0) return override;
  const env = c.env as MinimalEnvWithWorkerName | undefined;
  const fromEnv = env?.WORKER_NAME;
  if (typeof fromEnv === "string" && fromEnv.length > 0) return fromEnv;
  return "unknown";
}

/**
 * Hono middleware factory that:
 *  - Extracts or creates a trace id and stashes it on `c.set('traceId', ...)`.
 *  - Echoes `x-trace-id` back on the response.
 *  - Logs a single JSON line summarising the request when it completes.
 *
 * Mount this as the FIRST middleware so the trace id is available everywhere
 * downstream (auth, route handlers, error handlers).
 */
export function tracingMiddleware(options: TracingMiddlewareOptions = {}): MinimalMiddleware {
  const log = options.log ?? ((entry: TracingLogEntry) => console.log(JSON.stringify(entry)));
  const now = options.now ?? (() => Date.now());

  return async (c, next) => {
    const startedAt = now();
    const traceId = getOrCreateTraceId(c.req.raw);
    const parentSpanId = c.req.header(PARENT_SPAN_ID_HEADER);
    const worker = resolveWorkerName(c, options.worker);

    c.set("traceId", traceId);
    if (typeof parentSpanId === "string" && parentSpanId.length > 0) {
      c.set("parentSpanId", parentSpanId);
    }

    let errored = false;
    try {
      await next();
    } catch (error) {
      errored = true;
      throw error;
    } finally {
      // Set the response header (best-effort; ignore immutable Response cases)
      try {
        c.res.headers.set(TRACE_ID_HEADER, traceId);
      } catch {
        // Response headers immutable — caller may have constructed a frozen
        // Response. We still emit the log below so correlation is possible.
      }

      const status = errored ? 500 : c.res.status;
      const entry: TracingLogEntry = {
        traceId,
        worker,
        method: c.req.method,
        path: new URL(c.req.url).pathname,
        status,
        duration_ms: now() - startedAt,
        timestamp: new Date().toISOString(),
        ...(typeof parentSpanId === "string" && parentSpanId.length > 0 ? { parentSpanId } : {}),
      };
      try {
        log(entry);
      } catch {
        // Logging must never break the request.
      }
    }
  };
}

/**
 * Minimal structural type matching Cloudflare's `ExecutionContext`.
 * Kept for backward-compat re-exports. Callers should pass the actual
 * Cloudflare `ExecutionContext` type via the `Ctx` generic.
 */
export interface MinimalExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

/**
 * Wrap a raw (non-Hono) `fetch` handler with the same tracing semantics:
 * extract/create traceId, set response header, emit one JSON log line.
 *
 * Useful for workers that don't use Hono (e.g. mcp-auth, spike-land-backend).
 *
 * The `Ctx` generic defaults to `unknown` so callers can pass their concrete
 * `ExecutionContext` type without forcing `@cloudflare/workers-types` on the
 * shared package.
 */
export function withTracingFetch<E, Ctx = unknown>(
  worker: string,
  handler: (request: Request, env: E, ctx?: Ctx) => Promise<Response> | Response,
  options: { log?: (entry: TracingLogEntry) => void; now?: () => number } = {},
): (request: Request, env: E, ctx?: Ctx) => Promise<Response> {
  const log = options.log ?? ((entry: TracingLogEntry) => console.log(JSON.stringify(entry)));
  const now = options.now ?? (() => Date.now());

  return async (request, env, ctx) => {
    const startedAt = now();
    const traceId = getOrCreateTraceId(request);
    const parentSpanId = request.headers.get(PARENT_SPAN_ID_HEADER) ?? undefined;
    let response: Response;
    let status = 500;
    try {
      response = await handler(request, env, ctx);
      status = response.status;
      const headers = new Headers(response.headers);
      headers.set(TRACE_ID_HEADER, traceId);
      response = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      return response;
    } finally {
      const entry: TracingLogEntry = {
        traceId,
        worker,
        method: request.method,
        path: new URL(request.url).pathname,
        status,
        duration_ms: now() - startedAt,
        timestamp: new Date().toISOString(),
        ...(parentSpanId !== undefined ? { parentSpanId } : {}),
      };
      try {
        log(entry);
      } catch {
        // Logging must never break the request.
      }
    }
  };
}
