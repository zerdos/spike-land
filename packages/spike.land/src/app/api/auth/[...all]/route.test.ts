import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock global fetch since the route proxies to the auth service
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { GET, POST } from "./route";

describe("Auth proxy route /api/auth/[...all]", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(new Response("ok", { status: 200 }));
  });

  describe("GET", () => {
    it("proxies GET requests to the auth service", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/get-session",
        { method: "GET" },
      );
      const response = await GET(request);
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [calledUrl, calledOptions] = mockFetch.mock.calls[0]!;
      expect(calledUrl.toString()).toContain("/api/auth/get-session");
      expect(calledOptions.method).toBe("GET");
    });

    it("preserves query parameters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/callback/github?code=abc&state=xyz",
        { method: "GET" },
      );
      await GET(request);

      const [calledUrl] = mockFetch.mock.calls[0]!;
      expect(calledUrl.toString()).toContain("code=abc");
      expect(calledUrl.toString()).toContain("state=xyz");
    });

    it("uses NEXT_PUBLIC_AUTH_URL when set", async () => {
      process.env.NEXT_PUBLIC_AUTH_URL = "https://auth.example.com";
      const request = new NextRequest(
        "http://localhost:3000/api/auth/get-session",
        { method: "GET" },
      );
      await GET(request);

      const [calledUrl] = mockFetch.mock.calls[0]!;
      expect(calledUrl.toString()).toContain("https://auth.example.com");
    });

    it("defaults to localhost:8787 when NEXT_PUBLIC_AUTH_URL is not set", async () => {
      delete process.env.NEXT_PUBLIC_AUTH_URL;
      const request = new NextRequest(
        "http://localhost:3000/api/auth/get-session",
        { method: "GET" },
      );
      await GET(request);

      const [calledUrl] = mockFetch.mock.calls[0]!;
      expect(calledUrl.toString()).toContain("http://localhost:8787");
    });
  });

  describe("POST", () => {
    it("proxies POST requests to the auth service", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/sign-in/email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@example.com" }),
        },
      );
      const response = await POST(request);
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [calledUrl, calledOptions] = mockFetch.mock.calls[0]!;
      expect(calledUrl.toString()).toContain("/api/auth/sign-in/email");
      expect(calledOptions.method).toBe("POST");
    });

    it("forwards request body", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/sign-in/email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@example.com" }),
        },
      );
      await POST(request);

      const [, calledOptions] = mockFetch.mock.calls[0]!;
      expect(calledOptions.body).toBeDefined();
    });

    it("includes duplex option for request body forwarding", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/sign-in/email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@example.com" }),
        },
      );
      await POST(request);

      const [, calledOptions] = mockFetch.mock.calls[0]!;
      expect(calledOptions.duplex).toBe("half");
    });

    it("forwards headers from the original request", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/sign-in/email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cookie": "session=abc123",
          },
          body: JSON.stringify({ email: "test@example.com" }),
        },
      );
      await POST(request);

      const [, calledOptions] = mockFetch.mock.calls[0]!;
      expect(calledOptions.headers).toBeDefined();
    });
  });
});
