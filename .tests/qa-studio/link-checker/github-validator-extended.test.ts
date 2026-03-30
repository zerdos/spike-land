/**
 * Extended tests for github-validator.ts — covers branches left uncovered by
 * github-validator.test.ts:
 *   - validateGitHubUrl with type "file" (with and without branch)
 *   - validateGitHubUrl with type "tree"
 *   - validateGitHubUrl with type "badge" (with and without workflow)
 *   - validateGitHubUrl with auth token sets Authorization header
 *   - validateGitHubUrl non-2xx / non-404 / non-403 status returns "error"
 *   - validateGitHubUrl broken raw URL (HEAD returns 404)
 *   - parseGitHubUrl with query string / fragment
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import type { ExtractedLink } from "../../../src/core/browser-automation/core-logic/link-checker/types.js";
import {
  parseGitHubUrl,
  validateGitHubUrl,
} from "../../../src/core/browser-automation/core-logic/link-checker/github-validator.js";

function makeLink(target: string): ExtractedLink {
  return {
    target,
    text: "link",
    line: 1,
    column: 1,
    category: "github_file",
    inCodeBlock: false,
    inComment: false,
  };
}

function mockFetchWith(status: number, ok: boolean) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    headers: new Headers({ "X-RateLimit-Remaining": "30" }),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ── parseGitHubUrl edge cases ────────────────────────────────────────────────

describe("parseGitHubUrl — edge cases", () => {
  it("parses URL with query string appended", () => {
    const parsed = parseGitHubUrl("https://github.com/org/repo?tab=readme-ov-file");
    expect(parsed).not.toBeNull();
    expect(parsed?.org).toBe("org");
    expect(parsed?.repo).toBe("repo");
    expect(parsed?.type).toBe("repo");
  });

  it("returns null for a non-github.com, non-raw URL", () => {
    expect(parseGitHubUrl("https://gitlab.com/org/repo")).toBeNull();
  });

  it("parses blob URL without a branch path (root of repo file section)", () => {
    const parsed = parseGitHubUrl("https://github.com/org/repo/blob/feature-branch/README.md");
    expect(parsed?.type).toBe("file");
    expect(parsed?.branch).toBe("feature-branch");
    expect(parsed?.path).toBe("README.md");
  });
});

// ── validateGitHubUrl — file / tree types ────────────────────────────────────

describe("validateGitHubUrl — file type", () => {
  it("builds contents API URL with branch ref when branch is provided", async () => {
    let capturedUrl = "";
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      capturedUrl = url;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ "X-RateLimit-Remaining": "50" }),
      });
    });

    const link = makeLink("https://github.com/org/repo/blob/main/src/index.ts");
    const result = await validateGitHubUrl(link, {
      org: "org",
      repo: "repo",
      type: "file",
      branch: "main",
      path: "src/index.ts",
      url: link.target,
    });

    expect(result.status).toBe("ok");
    expect(capturedUrl).toContain("/repos/org/repo/contents/src/index.ts");
    expect(capturedUrl).toContain("?ref=main");
  });

  it("builds contents API URL without ref when branch is absent", async () => {
    let capturedUrl = "";
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      capturedUrl = url;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ "X-RateLimit-Remaining": "50" }),
      });
    });

    const link = makeLink("https://github.com/org/repo/blob/main/README.md");
    await validateGitHubUrl(link, {
      org: "org",
      repo: "repo",
      type: "file",
      path: "README.md",
      url: link.target,
    });

    expect(capturedUrl).toContain("/repos/org/repo/contents/README.md");
    expect(capturedUrl).not.toContain("?ref=");
  });
});

describe("validateGitHubUrl — tree type", () => {
  it("builds contents API URL for tree type", async () => {
    let capturedUrl = "";
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      capturedUrl = url;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ "X-RateLimit-Remaining": "50" }),
      });
    });

    const link = makeLink("https://github.com/org/repo/tree/main/src");
    await validateGitHubUrl(link, {
      org: "org",
      repo: "repo",
      type: "tree",
      branch: "main",
      path: "src",
      url: link.target,
    });

    expect(capturedUrl).toContain("/repos/org/repo/contents/src");
    expect(capturedUrl).toContain("?ref=main");
  });
});

// ── validateGitHubUrl — badge type ───────────────────────────────────────────

describe("validateGitHubUrl — badge type", () => {
  it("calls workflow API when workflow is set", async () => {
    let capturedUrl = "";
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      capturedUrl = url;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ "X-RateLimit-Remaining": "50" }),
      });
    });

    const link = makeLink("https://img.shields.io/github/actions/workflow/status/org/repo/ci.yml");
    await validateGitHubUrl(link, {
      org: "org",
      repo: "repo",
      type: "badge",
      workflow: "ci.yml",
      url: link.target,
    });

    expect(capturedUrl).toContain("/repos/org/repo/actions/workflows/ci.yml");
  });

  it("falls back to repo API when workflow is absent", async () => {
    let capturedUrl = "";
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      capturedUrl = url;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ "X-RateLimit-Remaining": "50" }),
      });
    });

    const link = makeLink("https://img.shields.io/github/stars/org/repo");
    await validateGitHubUrl(link, {
      org: "org",
      repo: "repo",
      type: "badge",
      url: link.target,
    });

    expect(capturedUrl).toBe("https://api.github.com/repos/org/repo");
  });
});

// ── validateGitHubUrl — raw type broken ──────────────────────────────────────

describe("validateGitHubUrl — raw type broken", () => {
  it("returns broken when raw HEAD request returns 404", async () => {
    globalThis.fetch = mockFetchWith(404, false);

    const link = makeLink("https://raw.githubusercontent.com/org/repo/main/deleted.svg");
    const result = await validateGitHubUrl(link, {
      org: "org",
      repo: "repo",
      type: "raw",
      branch: "main",
      path: "deleted.svg",
      url: link.target,
    });

    expect(result.status).toBe("broken");
    expect(result.httpStatus).toBe(404);
    expect(result.reason).toContain("HTTP 404");
  });
});

// ── validateGitHubUrl — auth token ───────────────────────────────────────────

describe("validateGitHubUrl — auth token", () => {
  it("includes Authorization header when token is provided", async () => {
    let capturedHeaders: Record<string, string> = {};
    globalThis.fetch = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      capturedHeaders = Object.fromEntries(Object.entries(init.headers as Record<string, string>));
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ "X-RateLimit-Remaining": "50" }),
      });
    });

    const link = makeLink("https://github.com/org/repo");
    await validateGitHubUrl(
      link,
      { org: "org", repo: "repo", type: "repo", url: link.target },
      { token: "ghp_test_token_123" },
    );

    expect(capturedHeaders["Authorization"]).toBe("Bearer ghp_test_token_123");
  });
});

// ── validateGitHubUrl — non-standard HTTP statuses ───────────────────────────

describe("validateGitHubUrl — non-standard HTTP statuses", () => {
  it("returns error for 500 server error", async () => {
    globalThis.fetch = mockFetchWith(500, false);

    const link = makeLink("https://github.com/org/repo");
    const result = await validateGitHubUrl(link, {
      org: "org",
      repo: "repo",
      type: "repo",
      url: link.target,
    });

    expect(result.status).toBe("error");
    expect(result.httpStatus).toBe(500);
    expect(result.reason).toContain("500");
  });

  it("returns error for 401 unauthorized", async () => {
    globalThis.fetch = mockFetchWith(401, false);

    const link = makeLink("https://github.com/org/private");
    const result = await validateGitHubUrl(link, {
      org: "org",
      repo: "private",
      type: "repo",
      url: link.target,
    });

    expect(result.status).toBe("error");
    expect(result.httpStatus).toBe(401);
  });
});
