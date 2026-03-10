import { describe, expect, it } from "vitest";
import { parseBlogImagePath, selectWarmableBlogHeroes } from "../warm-blog-heroes-lib.js";
import type { BlogPost } from "../seed-blog-lib.js";

describe("parseBlogImagePath", () => {
  it("extracts slug and filename from a blog image path", () => {
    expect(parseBlogImagePath("/blog/spike-land-app-store/hero.png")).toEqual({
      slug: "spike-land-app-store",
      filename: "hero.png",
    });
  });

  it("returns null for non-blog image paths", () => {
    expect(parseBlogImagePath("/images/hero.png")).toBeNull();
    expect(parseBlogImagePath(null)).toBeNull();
  });
});

describe("selectWarmableBlogHeroes", () => {
  const basePost: BlogPost = {
    slug: "spike-land-app-store",
    title: "App Store",
    description: "",
    primer: "",
    date: "2026-03-08",
    author: "Spike",
    category: "Product",
    tags: [],
    featured: false,
    draft: false,
    unlisted: false,
    heroImage: "/blog/spike-land-app-store/hero.png",
    heroPrompt: "A cinematic marketplace of MCP apps",
    content: "Body",
  };

  it("returns published posts that have a prompt-driven hero image", () => {
    expect(selectWarmableBlogHeroes([basePost])).toEqual([
      {
        slug: "spike-land-app-store",
        filename: "hero.png",
        prompt: "A cinematic marketplace of MCP apps",
      },
    ]);
  });

  it("skips drafts, unlisted posts, and posts without prompt-driven blog assets", () => {
    expect(
      selectWarmableBlogHeroes([
        { ...basePost, draft: true },
        { ...basePost, slug: "hidden", unlisted: true },
        { ...basePost, slug: "no-prompt", heroPrompt: null },
        { ...basePost, slug: "external", heroImage: "https://example.com/hero.png" },
      ]),
    ).toEqual([]);
  });
});
