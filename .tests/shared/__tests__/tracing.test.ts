import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CF_RAY_HEADER,
  PARENT_SPAN_ID_HEADER,
  REQUEST_ID_HEADER,
  TRACE_ID_HEADER,
  getOrCreateTraceId,
  tracingMiddleware,
  withTraceHeaders,
  withTracingFetch,
  type MinimalTracingContext,
  type TracingLogEntry,
} from "../../../src/core/shared-utils/core-logic/tracing";

describe("getOrCreateTraceId", () => {
  it("prefers x-trace-id over other headers", () => {
    const req = new Request("https://example.test/", {
      headers: {
        [TRACE_ID_HEADER]: "trace-A",
        [REQUEST_ID_HEADER]: "req-B",
        [CF_RAY_HEADER]: "ray-C",
      },
    });
    expect(getOrCreateTraceId(req)).toBe("trace-A");
  });

  it("falls back to x-request-id when x-trace-id is absent", () => {
    const req = new Request("https://example.test/", {
      headers: {
        [REQUEST_ID_HEADER]: "req-B",
        [CF_RAY_HEADER]: "ray-C",
      },
    });
    expect(getOrCreateTraceId(req)).toBe("req-B");
  });

  it("falls back to cf-ray when both x-trace-id and x-request-id are absent", () => {
    const req = new Request("https://example.test/", {
      headers: { [CF_RAY_HEADER]: "ray-C" },
    });
    expect(getOrCreateTraceId(req)).toBe("ray-C");
  });

  it("ignores empty/whitespace-only header values and mints a UUID", () => {
    const req = new Request("https://example.test/", {
      headers: {
        [TRACE_ID_HEADER]: "   ",
        [REQUEST_ID_HEADER]: "",
      },
    });
    const trace = getOrCreateTraceId(req);
    expect(trace).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it("mints a UUID when no propagation headers are present", () => {
    const req = new Request("https://example.test/");
    const trace = getOrCreateTraceId(req);
    expect(trace).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it("trims surrounding whitespace from header values", () => {
    const req = new Request("https://example.test/", {
      headers: { [TRACE_ID_HEADER]: "  trace-D  " },
    });
    expect(getOrCreateTraceId(req)).toBe("trace-D");
  });
});

describe("withTraceHeaders", () => {
  it("sets x-trace-id on a fresh Headers object", () => {
    const headers = withTraceHeaders(undefined, "trace-1");
    expect(headers.get(TRACE_ID_HEADER)).toBe("trace-1");
    expect(headers.get(PARENT_SPAN_ID_HEADER)).toBeNull();
  });

  it("merges x-trace-id with existing headers without dropping them", () => {
    const headers = withTraceHeaders(
      { "Content-Type": "application/json", Authorization: "Bearer xyz" },
      "trace-2",
    );
    expect(headers.get(TRACE_ID_HEADER)).toBe("trace-2");
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("authorization")).toBe("Bearer xyz");
  });

  it("propagates parent span id when supplied", () => {
    const headers = withTraceHeaders(undefined, "trace-3", "span-99");
    expect(headers.get(PARENT_SPAN_ID_HEADER)).toBe("span-99");
  });

  it("does not set parent span id when omitted or empty", () => {
    const headers = withTraceHeaders(undefined, "trace-4", "");
    expect(headers.get(PARENT_SPAN_ID_HEADER)).toBeNull();
  });

  it("overrides any caller-supplied x-trace-id with the canonical value", () => {
    const headers = withTraceHeaders({ [TRACE_ID_HEADER]: "stale" }, "trace-5");
    expect(headers.get(TRACE_ID_HEADER)).toBe("trace-5");
  });
});

describe("tracingMiddleware", () => {
  let nowSpy: ReturnType<typeof vi.fn>;
  let logs: TracingLogEntry[];

  beforeEach(() => {
    let n = 1_000;
    nowSpy = vi.fn(() => {
      n += 7;
      return n;
    });
    logs = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeCtx(req: Request, res: Response): MinimalTracingContext {
    const store = new Map<string, unknown>();
    return {
      req: {
        raw: req,
        method: req.method,
        url: req.url,
        header: (name: string) => req.headers.get(name) ?? undefined,
      },
      res,
      env: { WORKER_NAME: "spike-edge" },
      set(key, value) {
        store.set(key, value);
      },
    };
  }

  it("extracts the inbound trace id, sets the response header, and logs JSON", async () => {
    const mw = tracingMiddleware({
      log: (entry) => logs.push(entry),
      now: nowSpy,
    });
    const req = new Request("https://example.test/api/foo", {
      method: "POST",
      headers: { [TRACE_ID_HEADER]: "trace-mw-1", [PARENT_SPAN_ID_HEADER]: "span-parent" },
    });
    const res = new Response("ok", { status: 201 });
    const ctx = makeCtx(req, res);

    await mw(ctx, async () => {
      // simulate downstream work
    });

    expect(ctx.res.headers.get(TRACE_ID_HEADER)).toBe("trace-mw-1");
    expect(logs).toHaveLength(1);
    const entry = logs[0]!;
    expect(entry.traceId).toBe("trace-mw-1");
    expect(entry.parentSpanId).toBe("span-parent");
    expect(entry.method).toBe("POST");
    expect(entry.path).toBe("/api/foo");
    expect(entry.status).toBe(201);
    expect(entry.worker).toBe("spike-edge");
    expect(entry.duration_ms).toBeGreaterThanOrEqual(0);
    expect(typeof entry.timestamp).toBe("string");
  });

  it("falls back to env.WORKER_NAME when no override is given", async () => {
    const mw = tracingMiddleware({ log: (entry) => logs.push(entry), now: nowSpy });
    const req = new Request("https://example.test/health");
    const res = new Response(null, { status: 204 });
    const ctx = makeCtx(req, res);
    ctx.env = { WORKER_NAME: "mcp-auth" };
    await mw(ctx, async () => {});
    expect(logs[0]?.worker).toBe("mcp-auth");
  });

  it("uses 'unknown' worker name when neither override nor env is set", async () => {
    const mw = tracingMiddleware({ log: (entry) => logs.push(entry), now: nowSpy });
    const req = new Request("https://example.test/x");
    const res = new Response(null, { status: 200 });
    const ctx = makeCtx(req, res);
    ctx.env = {};
    await mw(ctx, async () => {});
    expect(logs[0]?.worker).toBe("unknown");
  });

  it("logs status=500 and rethrows when the downstream throws", async () => {
    const mw = tracingMiddleware({ log: (entry) => logs.push(entry), now: nowSpy });
    const req = new Request("https://example.test/boom");
    const res = new Response(null, { status: 200 });
    const ctx = makeCtx(req, res);
    await expect(
      mw(ctx, async () => {
        throw new Error("kaboom");
      }),
    ).rejects.toThrow("kaboom");
    expect(logs[0]?.status).toBe(500);
  });
});

describe("withTracingFetch", () => {
  it("wraps a raw fetch handler, sets x-trace-id on the response, and logs", async () => {
    const logs: TracingLogEntry[] = [];
    const handler = withTracingFetch<unknown>(
      "spike-land-backend",
      async (req) => new Response(`echo:${req.url}`, { status: 200 }),
      { log: (e) => logs.push(e) },
    );
    const req = new Request("https://internal.test/foo", {
      headers: { [TRACE_ID_HEADER]: "trace-raw-1" },
    });
    const res = await handler(req, undefined);
    expect(res.headers.get(TRACE_ID_HEADER)).toBe("trace-raw-1");
    expect(logs).toHaveLength(1);
    expect(logs[0]?.traceId).toBe("trace-raw-1");
    expect(logs[0]?.worker).toBe("spike-land-backend");
    expect(logs[0]?.status).toBe(200);
    expect(logs[0]?.path).toBe("/foo");
  });

  it("mints a UUID when the inbound request has no trace headers", async () => {
    const logs: TracingLogEntry[] = [];
    const handler = withTracingFetch<unknown>(
      "spike-land-backend",
      async () => new Response(null, { status: 204 }),
      { log: (e) => logs.push(e) },
    );
    const res = await handler(new Request("https://internal.test/"), undefined);
    const headerTrace = res.headers.get(TRACE_ID_HEADER);
    expect(headerTrace).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(logs[0]?.traceId).toBe(headerTrace);
  });
});
