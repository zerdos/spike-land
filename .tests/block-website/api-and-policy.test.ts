import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildPromptDrivenBlogImageSrc,
  hashImagePrompt,
} from "../../src/core/block-website/core-logic/blog-image-policy";
import { apiFetch, apiUrl } from "../../src/core/block-website/core-logic/api";

// ---------------------------------------------------------------------------
// hashImagePrompt
// ---------------------------------------------------------------------------

describe("hashImagePrompt", () => {
  it("returns a non-empty base-36 string", () => {
    const result = hashImagePrompt("a test prompt");
    expect(result).toMatch(/^[0-9a-z]+$/);
    expect(result.length).toBeGreaterThan(0);
  });

  it("is deterministic — same input produces same output", () => {
    const a = hashImagePrompt("hello world");
    const b = hashImagePrompt("hello world");
    expect(a).toBe(b);
  });

  it("produces different hashes for different inputs", () => {
    const a = hashImagePrompt("prompt one");
    const b = hashImagePrompt("prompt two");
    expect(a).not.toBe(b);
  });

  it("handles an empty string without throwing", () => {
    expect(() => hashImagePrompt("")).not.toThrow();
  });

  it("handles unicode characters without throwing", () => {
    expect(() => hashImagePrompt("emoji 🚀 test")).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// buildPromptDrivenBlogImageSrc
// ---------------------------------------------------------------------------

describe("buildPromptDrivenBlogImageSrc", () => {
  const IMAGE_STUDIO = "https://image-studio-mcp.spike.land";

  it("returns null when both src and prompt are absent", () => {
    expect(buildPromptDrivenBlogImageSrc(null, null)).toBeNull();
    expect(buildPromptDrivenBlogImageSrc(undefined, undefined)).toBeNull();
  });

  it("returns the plain safe src when prompt is absent", () => {
    expect(buildPromptDrivenBlogImageSrc("/blog/hero.png", null)).toBe("/blog/hero.png");
    expect(buildPromptDrivenBlogImageSrc("/blog/hero.png", "")).toBe("/blog/hero.png");
    expect(buildPromptDrivenBlogImageSrc("/blog/hero.png", "   ")).toBe("/blog/hero.png");
  });

  it("returns null when src is disallowed and prompt is absent", () => {
    expect(buildPromptDrivenBlogImageSrc("https://evil.example.com/img.png", null)).toBeNull();
  });

  it("builds a prompt-driven URL to the Image Studio when a prompt is given", () => {
    const result = buildPromptDrivenBlogImageSrc(null, "a glowing robot");
    expect(result).not.toBeNull();
    expect(result).toMatch(new RegExp(`^${IMAGE_STUDIO}/api/generate-image`));
    const url = new URL(result as string);
    expect(url.searchParams.get("prompt")).toBe("a glowing robot");
    expect(url.searchParams.get("v")).toBeTruthy();
  });

  it("uses a consistent version hash for the same prompt", () => {
    const result1 = buildPromptDrivenBlogImageSrc(null, "stable prompt");
    const result2 = buildPromptDrivenBlogImageSrc(null, "stable prompt");
    expect(result1).toBe(result2);
  });

  it("uses different version hashes for different prompts", () => {
    const r1 = buildPromptDrivenBlogImageSrc(null, "prompt A");
    const r2 = buildPromptDrivenBlogImageSrc(null, "prompt B");
    const v1 = new URL(r1 as string).searchParams.get("v");
    const v2 = new URL(r2 as string).searchParams.get("v");
    expect(v1).not.toBe(v2);
  });

  it("prefers the Image Studio URL over a plain src when a prompt is given", () => {
    // Even if there is a valid src, a prompt triggers the generate-image endpoint
    const result = buildPromptDrivenBlogImageSrc("/blog/hero.png", "override prompt");
    expect(result).toMatch(new RegExp(`^${IMAGE_STUDIO}/api/generate-image`));
  });

  it("trims whitespace from the prompt before encoding it", () => {
    const trimmed = buildPromptDrivenBlogImageSrc(null, "  spaced prompt  ");
    const url = new URL(trimmed as string);
    expect(url.searchParams.get("prompt")).toBe("spaced prompt");
  });
});

// ---------------------------------------------------------------------------
// apiUrl
// ---------------------------------------------------------------------------

describe("apiUrl", () => {
  // In the vitest jsdom environment, import.meta.env.DEV is true, so
  // API_BASE = "" and urls are relative. Tests assert on this actual behavior.

  it("prepends /api/ when path starts with /", () => {
    expect(apiUrl("/users")).toBe("/api/users");
  });

  it("prepends /api/ when path does not start with /", () => {
    expect(apiUrl("users")).toBe("/api/users");
  });

  it("handles nested paths correctly", () => {
    expect(apiUrl("/blog/123/comments")).toBe("/api/blog/123/comments");
  });

  it("handles root path", () => {
    expect(apiUrl("/")).toBe("/api/");
  });

  it("consistent: path with slash and without slash produce same result", () => {
    expect(apiUrl("/experiments/assign")).toBe(apiUrl("experiments/assign"));
  });
});

// ---------------------------------------------------------------------------
// apiFetch
// ---------------------------------------------------------------------------

describe("apiFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls fetch with the resolved API URL and includes credentials", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("ok"));
    await apiFetch("/test");
    expect(fetch).toHaveBeenCalledWith(
      apiUrl("/test"),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("merges additional init options while preserving credentials", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("ok"));
    await apiFetch("/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x: 1 }),
    });
    expect(fetch).toHaveBeenCalledWith(
      apiUrl("/test"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
  });

  it("allows the caller to override credentials if needed", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("ok"));
    await apiFetch("/test", { credentials: "omit" });
    expect(fetch).toHaveBeenCalledWith(
      apiUrl("/test"),
      expect.objectContaining({ credentials: "omit" }),
    );
  });

  it("propagates fetch rejections to the caller", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network error"));
    await expect(apiFetch("/test")).rejects.toThrow("network error");
  });
});
