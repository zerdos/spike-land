import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mocks must be declared before imports
vi.mock("@/lib/errors/structured-logger", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/lib/security/timing", () => ({
  secureCompare: (a: string, b: string) => a === b,
}));

vi.mock("@/lib/try-catch", () => ({
  tryCatch: async <T>(p: Promise<T>) => {
    try {
      const data = await p;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },
}));

// Mock next/headers — will be overridden per-test
const mockCookiesGet = vi.fn();
const mockHeadersGet = vi.fn();
const mockHeaders = vi.fn(() => Promise.resolve({ get: mockHeadersGet }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ get: mockCookiesGet })),
  headers: () => mockHeaders(),
}));

// Mock global fetch for the better-auth session fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { getSession } from "./get-session";

function setNodeEnv(value: string) {
  Object.defineProperty(process.env, "NODE_ENV", {
    value,
    writable: true,
    configurable: true,
  });
}

describe("getSession", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
    mockCookiesGet.mockReturnValue(undefined);
    mockHeadersGet.mockReturnValue(null);
    mockFetch.mockResolvedValue({ ok: false });
    // Return a proper headers-like object from mockHeaders
    mockHeaders.mockResolvedValue({ get: mockHeadersGet });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Normal path (no E2E bypass)", () => {
    beforeEach(() => {
      delete process.env.E2E_BYPASS_AUTH;
    });

    it("returns null when fetch to auth service fails", async () => {
      mockFetch.mockResolvedValue({ ok: false });
      const session = await getSession();
      expect(session).toBeNull();
    });

    it("returns null when auth service returns no session data", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
      const session = await getSession();
      expect(session).toBeNull();
    });

    it("returns null when auth service returns session without user", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ session: { expiresAt: "2099-01-01" } }),
      });
      const session = await getSession();
      expect(session).toBeNull();
    });

    it("returns normalized session from auth service", async () => {
      delete process.env.E2E_BYPASS_AUTH;
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          session: { expiresAt: "2099-01-01T00:00:00.000Z" },
          user: {
            id: "user_abc",
            name: "Alice",
            email: "alice@example.com",
            image: null,
            role: "USER",
          },
        }),
      });
      const session = await getSession();
      expect(session).not.toBeNull();
      expect(session?.user.id).toBe("user_abc");
      expect(session?.user.email).toBe("alice@example.com");
      expect(session?.user.name).toBe("Alice");
      expect(session?.user.role).toBe("USER");
    });

    it("defaults role to USER when not provided", async () => {
      delete process.env.E2E_BYPASS_AUTH;
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          session: { expiresAt: "2099-01-01T00:00:00.000Z" },
          user: {
            id: "user_abc",
            name: "Alice",
            email: "alice@example.com",
            image: null,
          },
        }),
      });
      const session = await getSession();
      expect(session?.user.role).toBe("USER");
    });

    it("returns null when headers() returns null", async () => {
      delete process.env.E2E_BYPASS_AUTH;
      mockHeaders.mockRejectedValue(new Error("headers not available"));
      const session = await getSession();
      expect(session).toBeNull();
    });
  });

  describe("E2E env bypass (E2E_BYPASS_AUTH=true)", () => {
    beforeEach(() => {
      process.env.E2E_BYPASS_AUTH = "true";
    });

    it("returns null when no mock session token cookie is present", async () => {
      mockCookiesGet.mockReturnValue(undefined);
      const session = await getSession();
      expect(session).toBeNull();
    });

    it("returns null when session token is not mock-session-token", async () => {
      mockCookiesGet.mockImplementation((name: string) => {
        if (name === "authjs.session-token") return { value: "some-other-token" };
        return undefined;
      });
      const session = await getSession();
      expect(session).toBeNull();
    });

    it("returns mock session when mock-session-token cookie is set", async () => {
      mockCookiesGet.mockImplementation((name: string) => {
        const map: Record<string, { value: string }> = {
          "authjs.session-token": { value: "mock-session-token" },
          "e2e-user-email": { value: "test@example.com" },
          "e2e-user-name": { value: "Test User" },
          "e2e-user-role": { value: "USER" },
        };
        return map[name];
      });
      const session = await getSession();
      expect(session).not.toBeNull();
      expect(session?.user.email).toBe("test@example.com");
      expect(session?.user.name).toBe("Test User");
      expect(session?.user.role).toBe("USER");
    });

    it("returns mock admin session for admin@example.com", async () => {
      mockCookiesGet.mockImplementation((name: string) => {
        const map: Record<string, { value: string }> = {
          "authjs.session-token": { value: "mock-session-token" },
          "e2e-user-email": { value: "admin@example.com" },
        };
        return map[name];
      });
      const session = await getSession();
      expect(session?.user.role).toBe("ADMIN");
      expect(session?.user.id).toBe("admin-user-id");
    });
  });

  describe("E2E header bypass (isE2EBypassAllowed + header)", () => {
    beforeEach(() => {
      delete process.env.E2E_BYPASS_AUTH;
      setNodeEnv("development");
      process.env.E2E_BYPASS_SECRET = "test-secret";
    });

    it("returns session from auth service when bypass header not present", async () => {
      mockHeadersGet.mockReturnValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          session: { expiresAt: "2099-01-01T00:00:00.000Z" },
          user: { id: "user_xyz", name: "Bob", email: "bob@example.com", image: null, role: "USER" },
        }),
      });
      const session = await getSession();
      expect(session?.user.id).toBe("user_xyz");
    });

    it("returns mock session when bypass header matches secret", async () => {
      mockHeadersGet.mockImplementation((name: string) => {
        if (name === "x-e2e-auth-bypass") return "test-secret";
        return null;
      });
      mockCookiesGet.mockImplementation((name: string) => {
        const map: Record<string, { value: string }> = {
          "e2e-user-email": { value: "headeruser@example.com" },
          "e2e-user-name": { value: "Header User" },
          "e2e-user-role": { value: "USER" },
        };
        return map[name];
      });
      const session = await getSession();
      expect(session?.user.email).toBe("headeruser@example.com");
    });

    it("falls through to auth service when bypass header does not match secret", async () => {
      mockHeadersGet.mockImplementation((name: string) => {
        if (name === "x-e2e-auth-bypass") return "wrong-secret";
        return null;
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          session: { expiresAt: "2099-01-01T00:00:00.000Z" },
          user: {
            id: "user_fallback",
            name: "Fallback",
            email: "fb@example.com",
            image: null,
            role: "USER",
          },
        }),
      });
      const session = await getSession();
      expect(session?.user.id).toBe("user_fallback");
    });
  });
});
