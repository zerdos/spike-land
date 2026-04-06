/// <reference types="@cloudflare/workers-types" />
import { describe, expect, it, vi } from "vitest";
import { app } from "../index.js";
import type { Env } from "../../core-logic/env.js";

describe("create/learnit proxy routes", () => {
  it("proxies POST /api/create/generate to MCP", async () => {
    const mcpFetch = vi.fn(async (request: Request) => {
      expect(request.url).toBe("https://mcp.spike.land/api/create/generate");
      expect(request.method).toBe("POST");
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const res = await app.request(
      "/api/create/generate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "build todo app" }),
      },
      { MCP_SERVICE: { fetch: mcpFetch } as unknown as Fetcher } as unknown as Env,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("proxies POST /api/learnit/generate to MCP", async () => {
    const mcpFetch = vi.fn(async (request: Request) => {
      expect(request.url).toBe("https://mcp.spike.land/api/learnit/generate");
      expect(request.method).toBe("POST");
      return new Response(JSON.stringify({ slug: "typescript" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const res = await app.request(
      "/api/learnit/generate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "typescript" }),
      },
      { MCP_SERVICE: { fetch: mcpFetch } as unknown as Fetcher } as unknown as Env,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ slug: "typescript" });
  });
});
