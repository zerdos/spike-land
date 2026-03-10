/// <reference types="@cloudflare/workers-types" />
import { describe, expect, it, vi } from "vitest";
import { app } from "../index.js";
import type { Env } from "../../core-logic/env.js";

function makeEnv(authFetch: (request: Request) => Promise<Response>): Env {
  return {
    AUTH_MCP: { fetch: authFetch } as unknown as Fetcher,
  } as unknown as Env;
}

describe("auth proxy", () => {
  it("returns null for get-session when upstream responds with an error", async () => {
    const res = await app.request(
      "/api/auth/get-session",
      { method: "GET" },
      makeEnv(async () => new Response(null, { status: 500 })),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toBeNull();
  });

  it("forwards successful get-session responses", async () => {
    const payload = { session: { id: "sess_123" }, user: { id: "user_123" } };
    const res = await app.request(
      "/api/auth/get-session",
      { method: "GET" },
      makeEnv(
        async () =>
          new Response(JSON.stringify(payload), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(payload);
  });

  it("preserves non-session auth errors", async () => {
    const res = await app.request(
      "/api/auth/sign-in/social",
      { method: "POST" },
      makeEnv(async () => new Response("bad gateway", { status: 502 })),
    );

    expect(res.status).toBe(502);
    expect(await res.text()).toBe("bad gateway");
  });

  it("returns null for get-session when the auth fetch throws", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("boom"));

    const res = await app.request(
      "/api/auth/get-session",
      { method: "GET" },
      makeEnv(async () => new Response(null, { status: 503 })),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toBeNull();

    fetchSpy.mockRestore();
  });
});
