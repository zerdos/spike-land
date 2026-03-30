/**
 * Tests for docker-compose/core-logic/health-checker.ts
 *
 * HealthChecker.check() performs an HTTP GET to /health on the upstream
 * service and reports latency + status. All fetch calls are stubbed.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthChecker } from "../../src/mcp-tools/docker-compose/core-logic/health-checker.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("HealthChecker", () => {
  let checker: HealthChecker;

  beforeEach(() => {
    vi.clearAllMocks();
    checker = new HealthChecker();
  });

  describe("check — happy paths", () => {
    it("returns healthy=true for a 200 response", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await checker.check("spike-edge", "spike-edge", 8787);

      expect(result.service).toBe("spike-edge");
      expect(result.healthy).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.error).toBeUndefined();
    });

    it("calls the correct /health URL", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      await checker.check("my-svc", "my-svc", 3000);

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url] = mockFetch.mock.calls[0] as [string, unknown];
      expect(url).toBe("http://my-svc:3000/health");
    });

    it("includes latencyMs in result", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await checker.check("svc", "svc", 80);

      expect(typeof result.latencyMs).toBe("number");
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it("marks healthy=false for a non-ok response", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });

      const result = await checker.check("degraded", "degraded", 8080);

      expect(result.healthy).toBe(false);
      expect(result.statusCode).toBe(503);
      expect(result.error).toBeDefined();
    });

    it("includes error message on non-ok response", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

      const result = await checker.check("missing", "missing", 9000);

      expect(result.error).toContain("404");
    });
  });

  describe("check — error paths", () => {
    it("returns healthy=false when fetch throws (connection refused)", async () => {
      mockFetch.mockRejectedValueOnce(new Error("connect ECONNREFUSED 127.0.0.1:9999"));

      const result = await checker.check("offline", "offline", 9999);

      expect(result.healthy).toBe(false);
      expect(result.error).toContain("ECONNREFUSED");
      expect(result.statusCode).toBeUndefined();
    });

    it("returns healthy=false on AbortError (timeout)", async () => {
      mockFetch.mockRejectedValueOnce(new DOMException("The operation was aborted.", "AbortError"));

      const result = await checker.check("slow-svc", "slow-svc", 7777);

      expect(result.healthy).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("returns healthy=false when fetch throws a non-Error value", async () => {
      mockFetch.mockRejectedValueOnce("string error");

      const result = await checker.check("weird", "weird", 1234);

      expect(result.healthy).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("still records latencyMs on fetch error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("network failure"));

      const result = await checker.check("down", "down", 8080);

      expect(typeof result.latencyMs).toBe("number");
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("check — service name propagation", () => {
    it("passes the service name through to the result", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await checker.check("spike-app", "spike-app", 5173);

      expect(result.service).toBe("spike-app");
    });

    it("handles service and upstream names being different", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await checker.check("logical-name", "container-host", 8080);

      expect(result.service).toBe("logical-name");
      // URL should use the upstream/container hostname
      const [url] = mockFetch.mock.calls[0] as [string, unknown];
      expect(url).toContain("container-host");
    });
  });
});
