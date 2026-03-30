/**
 * Tests for docker-compose/core-logic/service-registry.ts
 *
 * ServiceRegistry lists containers from the Docker socket API and maps them
 * to ServiceInfo objects. The node:http module is mocked.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "node:http";
import { ServiceRegistry } from "../../src/mcp-tools/docker-compose/core-logic/service-registry.js";

vi.mock("node:http", () => {
  const mockRequest = vi.fn();
  return {
    default: { request: mockRequest },
    request: mockRequest,
  };
});

/** Helper: set up a mock HTTP response from the Docker socket. */
function setupMockResponse(data: unknown, statusCode = 200) {
  const mockReq = { on: vi.fn(), end: vi.fn() };

  (http.request as ReturnType<typeof vi.fn>).mockImplementation(
    (_opts: unknown, callback: (res: unknown) => void) => {
      const body = JSON.stringify(data);
      const res = {
        statusCode,
        on: vi.fn((event: string, handler: (chunk?: Buffer) => void) => {
          if (event === "data") handler(Buffer.from(body));
          if (event === "end") handler();
        }),
      };
      callback(res);
      return mockReq;
    },
  );

  return mockReq;
}

describe("ServiceRegistry", () => {
  let registry: ServiceRegistry;

  beforeEach(() => {
    vi.clearAllMocks();
    registry = new ServiceRegistry("/var/run/docker.sock");
  });

  // ── listServices ───────────────────────────────────────────────────────────

  describe("listServices", () => {
    it("parses two Docker containers into ServiceInfo objects", async () => {
      setupMockResponse([
        {
          Id: "abc123def456789",
          Names: ["/spike-edge"],
          State: "running",
          Labels: {
            "spike.service": "spike-edge",
            "spike.subdomain": "api",
            "spike.port": "8787",
            "spike.type": "worker",
          },
          Ports: [{ PrivatePort: 8787, PublicPort: 8787, Type: "tcp" }],
        },
        {
          Id: "def456789abc123",
          Names: ["/spike-app"],
          State: "running",
          Labels: {
            "spike.service": "spike-app",
            "spike.subdomain": "app",
            "spike.port": "5173",
            "spike.type": "frontend",
          },
          Ports: [{ PrivatePort: 5173, Type: "tcp" }],
        },
      ]);

      const services = await registry.listServices();

      expect(services).toHaveLength(2);
      expect(services[0]).toEqual({
        name: "spike-edge",
        subdomain: "api",
        port: 8787,
        type: "worker",
        status: "running",
        containerId: "abc123def456",
      });
      expect(services[1]).toEqual({
        name: "spike-app",
        subdomain: "app",
        port: 5173,
        type: "frontend",
        status: "running",
        containerId: "def456789abc",
      });
    });

    it("maps the 'exited' state correctly", async () => {
      setupMockResponse([
        {
          Id: "abc123def456789",
          Names: ["/stopped-svc"],
          State: "exited",
          Labels: {
            "spike.service": "stopped-svc",
            "spike.subdomain": "stopped",
            "spike.port": "3000",
            "spike.type": "backend",
          },
          Ports: [],
        },
      ]);

      const services = await registry.listServices();

      expect(services[0]?.status).toBe("exited");
    });

    it("falls back to the container name when spike.service label is empty", async () => {
      setupMockResponse([
        {
          Id: "abc123def456789",
          Names: ["/my-container"],
          State: "running",
          Labels: { "spike.service": "" },
          Ports: [{ PrivatePort: 80, Type: "tcp" }],
        },
      ]);

      const services = await registry.listServices();

      expect(services[0]?.name).toBe("my-container");
    });

    it("returns an empty array when Docker reports no containers", async () => {
      setupMockResponse([]);

      const services = await registry.listServices();

      expect(services).toEqual([]);
    });

    it("truncates containerId to 12 characters", async () => {
      setupMockResponse([
        {
          Id: "abcdefabcdef123456",
          Names: ["/svc"],
          State: "running",
          Labels: {
            "spike.service": "svc",
            "spike.subdomain": "svc",
            "spike.port": "80",
            "spike.type": "backend",
          },
          Ports: [],
        },
      ]);

      const services = await registry.listServices();

      expect(services[0]?.containerId?.length).toBe(12);
    });

    it("throws on a Docker API HTTP error response", async () => {
      setupMockResponse({ message: "daemon not running" }, 500);

      await expect(registry.listServices()).rejects.toThrow(/Docker API/i);
    });

    it("uses the private port when no public port is mapped", async () => {
      setupMockResponse([
        {
          Id: "xyz789xyz789xyz",
          Names: ["/internal-svc"],
          State: "running",
          Labels: {
            "spike.service": "internal-svc",
            "spike.subdomain": "internal",
            "spike.port": "4000",
            "spike.type": "mcp",
          },
          Ports: [{ PrivatePort: 4000, Type: "tcp" }],
        },
      ]);

      const services = await registry.listServices();

      expect(services[0]?.port).toBe(4000);
    });
  });
});
