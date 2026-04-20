import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Env, Variables } from "../core-logic/env";
import { send } from "../api/routes/send";

type Row = Record<string, unknown>;

interface Step {
  kind: "first" | "run";
  value?: Row | null;
}

interface FakeDbHandle {
  DB: unknown;
  calls: Array<{ sql: string; binds: unknown[] }>;
}

function makeDb(steps: Step[]): FakeDbHandle {
  const calls: Array<{ sql: string; binds: unknown[] }> = [];
  let idx = 0;
  const DB = {
    prepare(sql: string) {
      const binds: unknown[] = [];
      const api = {
        bind(...args: unknown[]) {
          binds.push(...args);
          return api;
        },
        async first() {
          calls.push({ sql, binds: [...binds] });
          const step = steps[idx++];
          if (!step || step.kind !== "first") {
            throw new Error(`unexpected first() — next is ${step?.kind ?? "none"}`);
          }
          return step.value ?? null;
        },
        async run() {
          calls.push({ sql, binds: [...binds] });
          const step = steps[idx++];
          if (!step || step.kind !== "run") {
            throw new Error(`unexpected run() — next is ${step?.kind ?? "none"}`);
          }
          return { success: true };
        },
      };
      return api;
    },
  };
  return { DB, calls };
}

function buildApp(userId: string | null) {
  const app = new Hono<{ Bindings: Env; Variables: Variables }>();
  if (userId) {
    app.use("*", async (c, next) => {
      c.set("userId", userId);
      await next();
    });
  }
  app.route("/", send);
  return app;
}

function post(body: unknown): Request {
  return new Request("http://smtp.local/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /send", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 503 when Resend not configured", async () => {
    const { DB } = makeDb([]);
    const res = await buildApp("user-1").fetch(post({ to: "a@b.com", subject: "s", body: "b" }), {
      DB,
    } as never);
    expect(res.status).toBe(503);
  });

  it("returns 401 without userId", async () => {
    const { DB } = makeDb([]);
    const res = await buildApp(null).fetch(post({ to: "a@b.com", subject: "s", body: "b" }), {
      DB,
      RESEND_API_KEY: "re_test",
    } as never);
    expect(res.status).toBe(401);
  });

  it("returns 404 when user row missing", async () => {
    const { DB } = makeDb([{ kind: "first", value: null }]);
    const res = await buildApp("user-1").fetch(post({ to: "a@b.com", subject: "s", body: "b" }), {
      DB,
      RESEND_API_KEY: "re_test",
    } as never);
    expect(res.status).toBe(404);
  });

  it("rejects invalid recipient", async () => {
    const { DB } = makeDb([
      { kind: "first", value: { email: "me@spike.land", name: "Me" } },
      { kind: "first", value: { cnt: 0 } },
    ]);
    const res = await buildApp("user-1").fetch(
      post({ to: "not-an-email", subject: "s", body: "b" }),
      { DB, RESEND_API_KEY: "re_test" } as never,
    );
    expect(res.status).toBe(400);
  });

  it("blocks when over hourly limit", async () => {
    const { DB } = makeDb([
      { kind: "first", value: { email: "me@spike.land", name: "Me" } },
      { kind: "first", value: { cnt: 5 } },
    ]);
    const res = await buildApp("user-1").fetch(post({ to: "a@b.com", subject: "s", body: "b" }), {
      DB,
      RESEND_API_KEY: "re_test",
    } as never);
    expect(res.status).toBe(429);
  });

  it("sends via Resend and writes audit row on success", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ id: "re-1" }), { status: 200 }));

    const { DB, calls } = makeDb([
      { kind: "first", value: { email: "me@spike.land", name: "Me" } },
      { kind: "first", value: { cnt: 0 } },
      { kind: "run" },
    ]);
    const res = await buildApp("user-1").fetch(
      post({ to: "target@example.com", subject: "Hi", body: "Body" }),
      { DB, RESEND_API_KEY: "re_test" } as never,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; id: string };
    expect(json).toEqual({ ok: true, id: "re-1" });
    expect(fetchMock).toHaveBeenCalledOnce();
    const insertCall = calls[calls.length - 1]!;
    expect(insertCall.sql).toMatch(/INSERT INTO email_sends/);
    expect(insertCall.binds).toContain("sent");
  });

  it("rejects unknown from address by falling back to default", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ id: "re-2" }), { status: 200 }));

    const { DB } = makeDb([
      { kind: "first", value: { email: "me@spike.land", name: "Me" } },
      { kind: "first", value: { cnt: 0 } },
      { kind: "run" },
    ]);
    const res = await buildApp("user-1").fetch(
      post({
        to: "target@example.com",
        subject: "Hi",
        body: "Body",
        from: "spoof@evil.com",
      }),
      { DB, RESEND_API_KEY: "re_test" } as never,
    );
    expect(res.status).toBe(200);
    const call = fetchMock.mock.calls[0]!;
    const body = JSON.parse((call[1] as RequestInit).body as string) as { from: string };
    expect(body.from).toMatch(/outreach@spike\.land/);
  });
});
