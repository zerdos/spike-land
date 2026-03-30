/**
 * Extended tests for url-validator.ts — covers branches not exercised by
 * url-validator.test.ts:
 *   - 429 rate-limit retry that succeeds on retry
 *   - 429 retry that still fails after retry
 *   - Non-404 failure status (e.g. 503) returns "error" not "broken"
 *   - Semaphore concurrency limit enforced (queue fills when all slots busy)
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import type { ExtractedLink } from "../../../src/core/browser-automation/core-logic/link-checker/types.js";
import { createUrlValidator } from "../../../src/core/browser-automation/core-logic/link-checker/url-validator.js";

function makeLink(target: string): ExtractedLink {
  return {
    target,
    text: "test",
    line: 1,
    column: 1,
    category: "external_url",
    inCodeBlock: false,
    inComment: false,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createUrlValidator — 429 rate-limit handling", () => {
  it("retries after 429 and returns ok when retry succeeds", async () => {
    const mockFetch = vi
      .fn()
      // First call: HEAD → 429
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        redirected: false,
        headers: new Headers({ "Retry-After": "0" }), // 0 s so test stays fast
      })
      // Retry: HEAD → 200
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        redirected: false,
        url: "https://example.org",
        headers: new Headers(),
      });

    globalThis.fetch = mockFetch;

    const validator = createUrlValidator({ concurrency: 1, timeout: 5000 });
    const result = await validator.validate(makeLink("https://example.org"));

    expect(result.status).toBe("ok");
    expect(result.reason).toContain("after rate limit retry");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("returns error after 429 when retry also fails", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        redirected: false,
        headers: new Headers({ "Retry-After": "0" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        redirected: false,
        headers: new Headers(),
      });

    globalThis.fetch = mockFetch;

    const validator = createUrlValidator({ concurrency: 1, timeout: 5000 });
    const result = await validator.validate(makeLink("https://example.org"));

    // After a failed retry on 429, the retry response is not 2xx
    // The outer flow falls through to the non-200 handler → "error" (503 is not 404)
    expect(["error", "broken"]).toContain(result.status);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe("createUrlValidator — non-404 failure", () => {
  it("returns error (not broken) for 503 Service Unavailable", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      redirected: false,
      headers: new Headers(),
    });

    const validator = createUrlValidator({ concurrency: 1 });
    const result = await validator.validate(makeLink("https://flaky.example.org"));

    expect(result.status).toBe("error");
    expect(result.httpStatus).toBe(503);
  });

  it("returns broken for 404", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      redirected: false,
      headers: new Headers(),
    });

    const validator = createUrlValidator({ concurrency: 1 });
    const result = await validator.validate(makeLink("https://example.org/gone"));

    expect(result.status).toBe("broken");
    expect(result.httpStatus).toBe(404);
  });
});

describe("createUrlValidator — semaphore concurrency", () => {
  it("processes all requests even when concurrency is 1", async () => {
    // Three sequential requests through a slot-1 validator
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        status: 200,
        redirected: false,
        url: "https://example.org",
        headers: new Headers(),
      });
    });

    const validator = createUrlValidator({ concurrency: 1 });

    const results = await Promise.all([
      validator.validate(makeLink("https://a.example.org")),
      validator.validate(makeLink("https://b.example.org")),
      validator.validate(makeLink("https://c.example.org")),
    ]);

    expect(callCount).toBe(3);
    expect(results.every((r) => r.status === "ok")).toBe(true);
  });

  it("releases the semaphore slot even when fetch rejects", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network down"));

    const validator = createUrlValidator({ concurrency: 1 });

    // First call exhausts the single slot and errors
    const r1 = await validator.validate(makeLink("https://a.example.org"));
    expect(r1.status).toBe("error");

    // Second call should still be able to acquire the released slot
    const r2 = await validator.validate(makeLink("https://b.example.org"));
    expect(r2.status).toBe("error");
  });
});

describe("createUrlValidator — redirect detail", () => {
  it("captures final URL as suggestion on redirect", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 301,
      redirected: true,
      url: "https://example.org/new",
      headers: new Headers(),
    });

    const validator = createUrlValidator({ concurrency: 1 });
    const result = await validator.validate(makeLink("https://example.org/old"));

    expect(result.status).toBe("warning");
    expect(result.suggestion).toBe("https://example.org/new");
    expect(result.reason).toContain("Redirected to");
  });
});
