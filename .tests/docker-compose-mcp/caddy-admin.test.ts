/**
 * Tests for docker-compose/core-logic/caddy-admin.ts
 *
 * CaddyAdminClient wraps the Caddy2 Admin API.  All fetch calls are stubbed.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { CaddyAdminClient } from "../../src/mcp-tools/docker-compose/core-logic/caddy-admin.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("CaddyAdminClient", () => {
  let client: CaddyAdminClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new CaddyAdminClient("http://localhost:2019");
  });

  // ── getConfig ─────────────────────────────────────────────────────────────

  describe("getConfig", () => {
    it("returns the full config on success", async () => {
      const config = { apps: { http: {} } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(config),
      });

      const result = await client.getConfig();

      expect(result).toEqual(config);
      expect(mockFetch).toHaveBeenCalledWith("http://localhost:2019/config/");
    });

    it("throws with status code on API error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error"),
      });

      await expect(client.getConfig()).rejects.toThrow("500");
    });
  });

  // ── addRoute ──────────────────────────────────────────────────────────────

  describe("addRoute", () => {
    it("POSTs a reverse-proxy route to the routes endpoint", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await client.addRoute("api", "api-service", 8080);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:2019/config/apps/http/servers/srv0/routes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            match: [{ host: ["api.spike.local"] }],
            handle: [
              {
                handler: "reverse_proxy",
                upstreams: [{ dial: "api-service:8080" }],
              },
            ],
          }),
        },
      );
    });

    it("throws on failure response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve("Bad Request"),
      });

      await expect(client.addRoute("bad", "host", 80)).rejects.toThrow("400");
    });
  });

  // ── listRoutes ────────────────────────────────────────────────────────────

  describe("listRoutes", () => {
    it("parses routes into SubdomainMapping objects", async () => {
      const routes = [
        {
          match: [{ host: ["api.spike.local"] }],
          handle: [
            {
              handler: "reverse_proxy",
              upstreams: [{ dial: "api-service:8080" }],
            },
          ],
        },
        {
          match: [{ host: ["app.spike.local"] }],
          handle: [
            {
              handler: "reverse_proxy",
              upstreams: [{ dial: "frontend:3000" }],
            },
          ],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(routes),
      });

      const mappings = await client.listRoutes();

      expect(mappings).toHaveLength(2);
      expect(mappings[0]).toEqual({ subdomain: "api", upstream: "api-service", port: 8080 });
      expect(mappings[1]).toEqual({ subdomain: "app", upstream: "frontend", port: 3000 });
    });

    it("returns empty array on 404 (no routes configured yet)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve("Not Found"),
      });

      const mappings = await client.listRoutes();

      expect(mappings).toEqual([]);
    });

    it("skips routes that lack host or dial configuration", async () => {
      const routes = [
        { match: [{}], handle: [{ handler: "static_response" }] },
        {
          match: [{ host: ["valid.spike.local"] }],
          handle: [
            {
              handler: "reverse_proxy",
              upstreams: [{ dial: "svc:9000" }],
            },
          ],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(routes),
      });

      const mappings = await client.listRoutes();

      expect(mappings).toHaveLength(1);
      expect(mappings[0]).toEqual({ subdomain: "valid", upstream: "svc", port: 9000 });
    });

    it("returns empty array for completely empty route list", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const mappings = await client.listRoutes();

      expect(mappings).toEqual([]);
    });
  });
});
