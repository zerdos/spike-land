/**
 * Integration test for the spike-edge tracing middleware (BUG-S6-04).
 *
 * Verifies that:
 *  - The shared `tracingMiddleware` propagates `x-trace-id` to the response.
 *  - It mints a UUID when no trace headers are present.
 *  - It emits exactly one structured JSON log line per request.
 *  - `c.get('traceId')` is available to downstream handlers.
 *  - `withTraceHeaders` correctly attaches the trace id to outgoing fetches.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import {
  TRACE_ID_HEADER,
  tracingMiddleware,
  withTraceHeaders,
} from "../../../src/core/shared-utils/core-logic/tracing";

interface TestVariables {
  traceId: string;
}

describe("spike-edge tracingMiddleware integration", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("propagates an inbound x-trace-id back on the response", async () => {
    const app = new Hono<{ Variables: TestVariables }>();
    app.use("*", tracingMiddleware({ worker: "spike-edge" }));
    app.get("/echo", (c) => c.json({ traceId: c.get("traceId") }));

    const res = await app.request("/echo", {
      headers: { [TRACE_ID_HEADER]: "trace-from-caller" },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get(TRACE_ID_HEADER)).toBe("trace-from-caller");
    const body = (await res.json()) as { traceId: string };
    expect(body.traceId).toBe("trace-from-caller");
  });

  it("mints a UUID when no inbound trace headers are present", async () => {
    const app = new Hono<{ Variables: TestVariables }>();
    app.use("*", tracingMiddleware({ worker: "spike-edge" }));
    app.get("/anon", (c) => c.json({ traceId: c.get("traceId") }));

    const res = await app.request("/anon");
    const headerTrace = res.headers.get(TRACE_ID_HEADER);
    expect(headerTrace).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    const body = (await res.json()) as { traceId: string };
    expect(body.traceId).toBe(headerTrace);
  });

  it("emits one structured JSON log line per request (default sink)", async () => {
    const app = new Hono<{ Variables: TestVariables }>();
    app.use("*", tracingMiddleware({ worker: "spike-edge" }));
    app.get("/log-me", (c) => c.text("hi", 200));

    const res = await app.request("/log-me", {
      headers: { [TRACE_ID_HEADER]: "trace-log-1" },
    });
    expect(res.status).toBe(200);

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const firstCall = consoleLogSpy.mock.calls[0];
    expect(firstCall).toBeDefined();
    const line = firstCall![0] as string;
    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(parsed["traceId"]).toBe("trace-log-1");
    expect(parsed["worker"]).toBe("spike-edge");
    expect(parsed["method"]).toBe("GET");
    expect(parsed["path"]).toBe("/log-me");
    expect(parsed["status"]).toBe(200);
    expect(typeof parsed["duration_ms"]).toBe("number");
    expect(typeof parsed["timestamp"]).toBe("string");
  });

  it("withTraceHeaders attaches the trace id when calling another worker", async () => {
    // Capture the headers a downstream worker would receive.
    const captured: Record<string, string> = {};
    const app = new Hono<{ Variables: TestVariables }>();
    app.use("*", tracingMiddleware({ worker: "spike-edge" }));
    app.get("/proxy", async (c) => {
      const traceId = c.get("traceId");
      const downstream = new Request("https://internal.test/", {
        headers: withTraceHeaders({ "Content-Type": "application/json" }, traceId),
      });
      downstream.headers.forEach((v, k) => {
        captured[k.toLowerCase()] = v;
      });
      return c.json({ ok: true });
    });

    const res = await app.request("/proxy", {
      headers: { [TRACE_ID_HEADER]: "trace-prop" },
    });
    expect(res.status).toBe(200);
    expect(captured["x-trace-id"]).toBe("trace-prop");
    expect(captured["content-type"]).toBe("application/json");
  });

  it("uses a custom log sink when provided", async () => {
    const sink: Array<Record<string, unknown>> = [];
    const app = new Hono<{ Variables: TestVariables }>();
    app.use(
      "*",
      tracingMiddleware({
        worker: "spike-edge",
        log: (entry) => sink.push(entry as unknown as Record<string, unknown>),
      }),
    );
    app.get("/sink", (c) => c.text("ok"));

    await app.request("/sink", { headers: { [TRACE_ID_HEADER]: "trace-sink" } });
    expect(sink).toHaveLength(1);
    expect(sink[0]?.["traceId"]).toBe("trace-sink");
    // Default console.log should NOT have been called when a custom sink is given.
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});
