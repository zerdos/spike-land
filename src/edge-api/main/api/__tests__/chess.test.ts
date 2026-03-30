/// <reference types="@cloudflare/workers-types" />
import { describe, expect, it } from "vitest";
import { app } from "../index.js";
import type { Env } from "../../core-logic/env.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Minimal auth session payload that satisfies the auth middleware. */
const SESSION_PAYLOAD = {
  session: { id: "sess_1" },
  user: { id: "user_abc", email: "tester@example.com" },
};

type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  first: <T>() => Promise<T | null>;
  run: () => Promise<{ success: boolean }>;
  all: <T>() => Promise<{ results: T[] }>;
};

function makeRequest(path: string): Request {
  return new Request(`https://spike.land${path}`, {
    method: "GET",
    headers: { cookie: "session=test" },
  });
}

/** Build a minimal Env where the auth service and D1 are fully controlled. */
function makeEnv(dbFirstResult: unknown, dbRunOk = true): Env {
  const stmt: D1PreparedStatement = {
    bind: (..._values: unknown[]) => stmt,
    first: async <T>() => dbFirstResult as T | null,
    run: async () => ({ success: dbRunOk }),
    all: async <T>() => ({ results: [] as T[] }),
  };

  const db = {
    prepare: (_sql: string) => stmt,
  } as unknown as D1Database;

  const authFetch = async () =>
    new Response(JSON.stringify(SESSION_PAYLOAD), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  return {
    AUTH_MCP: { fetch: authFetch } as unknown as Fetcher,
    DB: db,
  } as unknown as Env;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/chess/players/me", () => {
  it("returns 401 when unauthenticated", async () => {
    const env = makeEnv(null);
    // Override auth to return 401
    (env as unknown as { AUTH_MCP: { fetch: () => Promise<Response> } }).AUTH_MCP = {
      fetch: async () => new Response(null, { status: 401 }),
    };

    const res = await app.request(makeRequest("/api/chess/players/me"), {}, env);

    expect(res.status).toBe(401);
  });

  it("returns existing player record", async () => {
    const existingPlayer = {
      id: "cp_existing",
      userId: "user_abc",
      name: "tester",
      avatar: null,
      elo: 1350,
      bestElo: 1400,
      wins: 10,
      losses: 5,
      draws: 2,
      streak: 3,
      soundEnabled: 1,
      isOnline: 1,
      lastSeenAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const res = await app.request(
      makeRequest("/api/chess/players/me"),
      {},
      makeEnv(existingPlayer),
    );

    expect(res.status).toBe(200);
    const body = await res.json<{
      id: string;
      elo: number;
      wins: number;
      isOnline: boolean;
    }>();
    expect(body.id).toBe("cp_existing");
    expect(body.elo).toBe(1350);
    expect(body.wins).toBe(10);
    // isOnline should be a boolean, not the raw integer from D1
    expect(body.isOnline).toBe(true);
  });

  it("creates a new player on first visit and returns 201", async () => {
    // first() returns null → no existing player → INSERT path
    const res = await app.request(makeRequest("/api/chess/players/me"), {}, makeEnv(null));

    expect(res.status).toBe(201);
    const body = await res.json<{
      id: string;
      userId: string;
      name: string;
      elo: number;
      wins: number;
    }>();
    expect(body.userId).toBe("user_abc");
    // Display name derived from email "tester@example.com" → "tester"
    expect(body.name).toBe("tester");
    expect(body.elo).toBe(1200);
    expect(body.wins).toBe(0);
    expect(body.id).toMatch(/^cp_/);
  });
});
