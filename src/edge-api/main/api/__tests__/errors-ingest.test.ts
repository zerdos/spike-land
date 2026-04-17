import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { errors } from "../routes/errors.js";
import type { Env } from "../../core-logic/env.js";

// ─── Mock D1 ────────────────────────────────────────────────────────────────

interface CapturedBind {
  args: unknown[];
}

function createMockDB() {
  const captured: CapturedBind[] = [];

  const db = {
    prepare: vi.fn((_sql: string) => {
      const stmt = {
        bind: vi.fn((...args: unknown[]) => {
          captured.push({ args });
          return stmt;
        }),
        all: vi.fn(async () => ({ results: [] })),
        first: vi.fn(async () => null),
        run: vi.fn(async () => ({ success: true })),
      };
      return stmt;
    }),
    batch: vi.fn(async () => []),
  } as unknown as D1Database;

  return { db, captured };
}

function createApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.route("/", errors);
  return app;
}

function makeExecCtx(): ExecutionContext {
  return {
    waitUntil: () => undefined,
    passThroughOnException: () => undefined,
    props: {},
  } as unknown as ExecutionContext;
}

function makeEnv(overrides: Partial<Env>): Env {
  return overrides as unknown as Env;
}

interface IngestResponse {
  accepted: number;
  truncated: number;
  limits: {
    max_stack_bytes: number;
    max_metadata_bytes: number;
    head_tail_strategy: {
      stack_head_bytes: number;
      stack_tail_bytes: number;
      metadata_head_bytes: number;
      metadata_tail_bytes: number;
    };
  };
  truncations: Array<{
    truncated: boolean;
    stack_truncated: boolean;
    metadata_truncated: boolean;
    original_stack_bytes: number;
    original_metadata_bytes: number;
    stored_stack_bytes: number;
    stored_metadata_bytes: number;
    truncation_strategy: "none" | "head_tail";
  }>;
}

const SMALL_STACK = "Error: boom\n  at fn (/x.js:1:1)";
const SMALL_METADATA = { route: "/foo", userId: "u-1" };

function makeOversizeString(byteCount: number, marker = "X"): string {
  // Use ascii so .length === byte-length for our cap checks.
  return marker.repeat(byteCount);
}

describe("POST /errors/ingest — payload size handling", () => {
  it("stores small payloads verbatim and reports no truncation", async () => {
    const { db, captured } = createMockDB();
    const app = createApp();

    const res = await app.request(
      "/errors/ingest",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            service_name: "svc",
            message: "hello",
            stack_trace: SMALL_STACK,
            metadata: SMALL_METADATA,
          },
        ]),
      },
      makeEnv({ DB: db }),
      makeExecCtx(),
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as IngestResponse;
    expect(data.accepted).toBe(1);
    expect(data.truncated).toBe(0);

    const outcome = data.truncations[0];
    expect(outcome).toBeDefined();
    expect(outcome?.truncated).toBe(false);
    expect(outcome?.stack_truncated).toBe(false);
    expect(outcome?.metadata_truncated).toBe(false);
    expect(outcome?.truncation_strategy).toBe("none");
    expect(outcome?.original_stack_bytes).toBe(SMALL_STACK.length);
    expect(outcome?.stored_stack_bytes).toBe(SMALL_STACK.length);

    // The stack and metadata went into the bind unchanged.
    expect(captured[0]?.args[3]).toBe(SMALL_STACK);
    expect(captured[0]?.args[4]).toBe(JSON.stringify(SMALL_METADATA));
  });

  it("applies head_tail strategy when stack exceeds 64KB cap", async () => {
    const { db, captured } = createMockDB();
    const app = createApp();

    const oversize = makeOversizeString(80_000, "S"); // 80 KB > 64 KB cap
    const res = await app.request(
      "/errors/ingest",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            service_name: "svc",
            message: "deep async chain",
            stack_trace: oversize,
          },
        ]),
      },
      makeEnv({ DB: db }),
      makeExecCtx(),
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as IngestResponse;
    expect(data.accepted).toBe(1);
    expect(data.truncated).toBe(1);

    const outcome = data.truncations[0];
    expect(outcome?.truncated).toBe(true);
    expect(outcome?.stack_truncated).toBe(true);
    expect(outcome?.metadata_truncated).toBe(false);
    expect(outcome?.truncation_strategy).toBe("head_tail");
    expect(outcome?.original_stack_bytes).toBe(80_000);
    // stored = head + marker + tail = 8192 + marker + 4096
    expect(outcome?.stored_stack_bytes).toBeGreaterThan(8_192 + 4_096);
    expect(outcome?.stored_stack_bytes).toBeLessThan(80_000);

    const storedStack = captured[0]?.args[3] as string;
    expect(storedStack.startsWith("S".repeat(8_192))).toBe(true);
    expect(storedStack.endsWith("S".repeat(4_096))).toBe(true);
    expect(storedStack).toContain("[truncated");
  });

  it("applies head_tail strategy when metadata exceeds 32KB cap", async () => {
    const { db, captured } = createMockDB();
    const app = createApp();

    // Build a metadata object whose JSON.stringify exceeds 32 KB.
    const big = makeOversizeString(40_000, "M");
    const res = await app.request(
      "/errors/ingest",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            service_name: "svc",
            message: "fat metadata",
            metadata: { blob: big },
          },
        ]),
      },
      makeEnv({ DB: db }),
      makeExecCtx(),
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as IngestResponse;
    expect(data.truncated).toBe(1);

    const outcome = data.truncations[0];
    expect(outcome?.metadata_truncated).toBe(true);
    expect(outcome?.stack_truncated).toBe(false);
    expect(outcome?.truncation_strategy).toBe("head_tail");
    expect(outcome?.original_metadata_bytes).toBeGreaterThan(40_000);
    expect(outcome?.stored_metadata_bytes).toBeLessThan(outcome?.original_metadata_bytes ?? 0);

    const storedMeta = captured[0]?.args[4] as string;
    expect(storedMeta).toContain("[truncated");
    // Head should still be valid JSON prefix (starts with `{"blob":"M...`).
    expect(storedMeta.startsWith('{"blob":"')).toBe(true);
  });

  it("records both truncations when stack and metadata both exceed caps", async () => {
    const { db } = createMockDB();
    const app = createApp();

    const oversizeStack = makeOversizeString(70_000, "S");
    const oversizeBlob = makeOversizeString(40_000, "M");

    const res = await app.request(
      "/errors/ingest",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            service_name: "svc",
            message: "everything is too big",
            stack_trace: oversizeStack,
            metadata: { blob: oversizeBlob },
          },
        ]),
      },
      makeEnv({ DB: db }),
      makeExecCtx(),
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as IngestResponse;
    expect(data.accepted).toBe(1);
    expect(data.truncated).toBe(1);

    const outcome = data.truncations[0];
    expect(outcome?.truncated).toBe(true);
    expect(outcome?.stack_truncated).toBe(true);
    expect(outcome?.metadata_truncated).toBe(true);
    expect(outcome?.truncation_strategy).toBe("head_tail");
    expect(outcome?.original_stack_bytes).toBe(70_000);
    expect(outcome?.original_metadata_bytes).toBeGreaterThan(40_000);
  });

  it("response advertises the new 64KB / 32KB limits", async () => {
    const { db } = createMockDB();
    const app = createApp();

    const res = await app.request(
      "/errors/ingest",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ service_name: "svc", message: "ok" }]),
      },
      makeEnv({ DB: db }),
      makeExecCtx(),
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as IngestResponse;
    expect(data.limits.max_stack_bytes).toBe(65_536);
    expect(data.limits.max_metadata_bytes).toBe(32_768);
    expect(data.limits.head_tail_strategy.stack_head_bytes).toBe(8_192);
    expect(data.limits.head_tail_strategy.stack_tail_bytes).toBe(4_096);
  });
});
