/**
 * BUG-S6-08: tests for the six previously-stub spike-chat endpoints.
 * Covers happy path, validation failure, and empty result for each router.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { readCursorsRouter } from "../api/routes/read-cursors";
import { bookmarksRouter } from "../api/routes/bookmarks";
import { threadsRouter } from "../api/routes/threads";
import { pinsRouter } from "../api/routes/pins";
import { presenceRouter } from "../api/routes/presence";
import { reactionsRouter } from "../api/routes/reactions";
import * as dbIndex from "../db/db-index";
import type { Env } from "../core-logic/env";

vi.mock("../db/db-index", () => ({
  createDb: vi.fn(),
}));

interface ChainableMock {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  onConflictDoUpdate: ReturnType<typeof vi.fn>;
}

/** Minimal Drizzle stub: every method returns the same chainable.
 * The chain itself is thenable so awaiting any builder resolves to `rows`. */
function makeDb(rows: unknown[] = []): ChainableMock {
  const chain = {} as ChainableMock & { then?: unknown };
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.from = vi.fn(() => chain);
  chain.where = vi.fn(() => chain);
  chain.orderBy = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.values = vi.fn(() => chain);
  chain.set = vi.fn(() => chain);
  chain.onConflictDoUpdate = vi.fn(() => chain);
  // Make the chain thenable so `await db.select()...` resolves to rows.
  chain.then = (resolve: (v: unknown) => unknown) => resolve(rows);
  return chain;
}

function envWithDb(db: ChainableMock): { DB: object } {
  (dbIndex.createDb as ReturnType<typeof vi.fn>).mockReturnValue(db);
  return { DB: {} };
}

/**
 * Wrap a router in a tiny app that pre-sets `userId` (mimicking authMiddleware).
 * Pass `userId: null` to simulate an unauthenticated context.
 */
function withUser(
  router: Hono<{ Bindings: Env; Variables: { userId?: string } }>,
  userId: string | null = "user-1",
): Hono<{ Bindings: Env; Variables: { userId?: string } }> {
  const app = new Hono<{ Bindings: Env; Variables: { userId?: string } }>();
  app.use("*", async (c, next) => {
    if (userId !== null) c.set("userId", userId);
    await next();
  });
  app.route("/", router);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── read-cursors ───────────────────────────────────────────────────────────
describe("readCursorsRouter", () => {
  it("GET /cursors returns rows for the user (happy path)", async () => {
    const env = envWithDb(
      makeDb([{ userId: "user-1", channelId: "c1", lastReadMessageId: "m1", updatedAt: 1 }]),
    );
    const app = withUser(readCursorsRouter);
    const res = await app.fetch(new Request("http://x/cursors"), env as unknown as Env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { userId: "user-1", channelId: "c1", lastReadMessageId: "m1", updatedAt: 1 },
    ]);
  });

  it("GET /cursors returns [] when DB binding missing (empty fallback)", async () => {
    const app = withUser(readCursorsRouter);
    const res = await app.fetch(new Request("http://x/cursors"), {} as unknown as Env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("POST /channels/read returns 400 on validation failure", async () => {
    const env = envWithDb(makeDb());
    const app = withUser(readCursorsRouter);
    const res = await app.fetch(
      new Request("http://x/channels/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: "" }),
      }),
      env as unknown as Env,
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });

  it("POST /channels/read upserts the cursor (happy path)", async () => {
    const db = makeDb();
    const env = envWithDb(db);
    const app = withUser(readCursorsRouter);
    const res = await app.fetch(
      new Request("http://x/channels/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: "c1", lastReadMessageId: "m1" }),
      }),
      env as unknown as Env,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
    expect(db.insert).toHaveBeenCalled();
    expect(db.onConflictDoUpdate).toHaveBeenCalled();
  });
});

// ── bookmarks ──────────────────────────────────────────────────────────────
describe("bookmarksRouter", () => {
  it("GET / returns user's bookmarks (happy path)", async () => {
    const env = envWithDb(
      makeDb([{ id: "b1", userId: "user-1", messageId: "m1", note: null, createdAt: 1 }]),
    );
    const app = withUser(bookmarksRouter);
    const res = await app.fetch(new Request("http://x/"), env as unknown as Env);
    expect(res.status).toBe(200);
    expect(((await res.json()) as unknown[]).length).toBe(1);
  });

  it("GET / returns [] when DB binding missing (empty fallback)", async () => {
    const app = withUser(bookmarksRouter);
    const res = await app.fetch(new Request("http://x/"), {} as unknown as Env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("POST / returns 400 on validation failure", async () => {
    const env = envWithDb(makeDb());
    const app = withUser(bookmarksRouter);
    const res = await app.fetch(
      new Request("http://x/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      env as unknown as Env,
    );
    expect(res.status).toBe(400);
  });

  it("POST / is idempotent (returns existing bookmark)", async () => {
    const existing = { id: "b1", userId: "user-1", messageId: "m1", note: null, createdAt: 1 };
    const env = envWithDb(makeDb([existing]));
    const app = withUser(bookmarksRouter);
    const res = await app.fetch(
      new Request("http://x/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: "m1" }),
      }),
      env as unknown as Env,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(existing);
  });
});

// ── threads ────────────────────────────────────────────────────────────────
describe("threadsRouter", () => {
  it("GET /:id/replies returns replies (happy path)", async () => {
    const env = envWithDb(makeDb([{ id: "r1", threadId: "p1", content: "hi", createdAt: 1 }]));
    const app = withUser(threadsRouter);
    const res = await app.fetch(new Request("http://x/p1/replies"), env as unknown as Env);
    expect(res.status).toBe(200);
    expect(((await res.json()) as unknown[]).length).toBe(1);
  });

  it("GET /:id/replies returns [] when DB binding missing", async () => {
    const app = withUser(threadsRouter);
    const res = await app.fetch(new Request("http://x/p1/replies"), {} as unknown as Env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("POST /:id/replies returns 400 on validation failure (empty content)", async () => {
    const env = envWithDb(makeDb());
    const app = withUser(threadsRouter);
    const res = await app.fetch(
      new Request("http://x/p1/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "" }),
      }),
      env as unknown as Env,
    );
    expect(res.status).toBe(400);
  });

  it("POST /:id/replies returns 404 when parent missing", async () => {
    const env = envWithDb(makeDb([])); // empty parent select
    const app = withUser(threadsRouter);
    const res = await app.fetch(
      new Request("http://x/p1/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "hello" }),
      }),
      env as unknown as Env,
    );
    expect(res.status).toBe(404);
  });
});

// ── pins ───────────────────────────────────────────────────────────────────
describe("pinsRouter", () => {
  it("GET /:channelId/pins returns pins (happy path)", async () => {
    const env = envWithDb(
      makeDb([{ id: "p1", channelId: "c1", messageId: "m1", pinnedBy: "u1", createdAt: 1 }]),
    );
    const app = withUser(pinsRouter);
    const res = await app.fetch(new Request("http://x/c1/pins"), env as unknown as Env);
    expect(res.status).toBe(200);
    expect(((await res.json()) as unknown[]).length).toBe(1);
  });

  it("GET /:channelId/pins returns [] when DB binding missing", async () => {
    const app = withUser(pinsRouter);
    const res = await app.fetch(new Request("http://x/c1/pins"), {} as unknown as Env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("POST /:channelId/pins returns 400 on validation failure", async () => {
    const env = envWithDb(makeDb());
    const app = withUser(pinsRouter);
    const res = await app.fetch(
      new Request("http://x/c1/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      env as unknown as Env,
    );
    expect(res.status).toBe(400);
  });

  it("POST /:channelId/pins is idempotent", async () => {
    const existing = {
      id: "p1",
      channelId: "c1",
      messageId: "m1",
      pinnedBy: "user-1",
      createdAt: 1,
    };
    const env = envWithDb(makeDb([existing]));
    const app = withUser(pinsRouter);
    const res = await app.fetch(
      new Request("http://x/c1/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: "m1" }),
      }),
      env as unknown as Env,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(existing);
  });
});

// ── presence ───────────────────────────────────────────────────────────────
describe("presenceRouter", () => {
  function presenceEnv(stateFetchOk: boolean, payload: unknown): Env {
    return {
      PRESENCE_DO: {
        idFromName: vi.fn().mockReturnValue("doid"),
        get: vi.fn().mockReturnValue({
          fetch: vi.fn().mockResolvedValue({
            ok: stateFetchOk,
            json: async () => payload,
          }),
        }),
      },
    } as unknown as Env;
  }

  it("GET / returns 400 when channelId missing (validation)", async () => {
    const app = withUser(presenceRouter);
    const res = await app.fetch(new Request("http://x/"), {} as unknown as Env);
    expect(res.status).toBe(400);
  });

  it("GET / returns presence state (happy path)", async () => {
    const env = presenceEnv(true, { u1: { status: "online", lastSeen: 1 } });
    const app = withUser(presenceRouter);
    const res = await app.fetch(new Request("http://x/?channelId=c1"), env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ u1: { status: "online", lastSeen: 1 } });
  });

  it("GET / returns {} when DO state fetch fails (empty fallback)", async () => {
    const env = presenceEnv(false, null);
    const app = withUser(presenceRouter);
    const res = await app.fetch(new Request("http://x/?channelId=c1"), env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
  });

  it("POST /heartbeat returns 400 on validation failure", async () => {
    const env = presenceEnv(true, {});
    const app = withUser(presenceRouter);
    const res = await app.fetch(
      new Request("http://x/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      env,
    );
    expect(res.status).toBe(400);
  });
});

// ── reactions ──────────────────────────────────────────────────────────────
describe("reactionsRouter", () => {
  it("GET /:id/reactions aggregates by emoji (happy path)", async () => {
    const env = envWithDb(
      makeDb([
        { id: "r1", messageId: "m1", userId: "u1", emoji: "thumbsup", createdAt: 1 },
        { id: "r2", messageId: "m1", userId: "u2", emoji: "thumbsup", createdAt: 2 },
        { id: "r3", messageId: "m1", userId: "u1", emoji: "heart", createdAt: 3 },
      ]),
    );
    const app = withUser(reactionsRouter);
    const res = await app.fetch(new Request("http://x/m1/reactions"), env as unknown as Env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{ emoji: string; count: number; users: string[] }>;
    expect(body).toHaveLength(2);
    const thumbs = body.find((r) => r.emoji === "thumbsup");
    expect(thumbs?.count).toBe(2);
    expect(thumbs?.users.sort()).toEqual(["u1", "u2"]);
  });

  it("GET /:id/reactions returns [] when DB binding missing", async () => {
    const app = withUser(reactionsRouter);
    const res = await app.fetch(new Request("http://x/m1/reactions"), {} as unknown as Env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("POST /:id/reactions returns 400 on validation failure", async () => {
    const env = envWithDb(makeDb());
    const app = withUser(reactionsRouter);
    const res = await app.fetch(
      new Request("http://x/m1/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      env as unknown as Env,
    );
    expect(res.status).toBe(400);
  });

  it("POST /:id/reactions is idempotent (returns existing)", async () => {
    const existing = {
      id: "r1",
      messageId: "m1",
      userId: "user-1",
      emoji: "thumbsup",
      createdAt: 1,
    };
    const env = envWithDb(makeDb([existing]));
    const app = withUser(reactionsRouter);
    const res = await app.fetch(
      new Request("http://x/m1/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji: "thumbsup" }),
      }),
      env as unknown as Env,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(existing);
  });
});
