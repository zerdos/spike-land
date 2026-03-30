import { describe, expect, it } from "vitest";
import {
  extractHeroMedia,
  findImagePrompt,
} from "../../src/core/block-website/core-logic/blog-source";

describe("findImagePrompt", () => {
  it("returns the alt text for a markdown image matching the path", () => {
    const content = `Some intro\n![A hero image](/blog/hero.png)\nMore text`;
    expect(findImagePrompt(content, "/blog/hero.png")).toBe("A hero image");
  });

  it("returns null when the path is not found", () => {
    const content = `![Other](/blog/other.png)`;
    expect(findImagePrompt(content, "/blog/missing.png")).toBeNull();
  });

  it("returns null for an empty alt on a markdown image", () => {
    const content = `![](/blog/hero.png)`;
    expect(findImagePrompt(content, "/blog/hero.png")).toBeNull();
  });

  it("returns the alt text for an HTML img tag", () => {
    const content = `<img src="/blog/hero.png" alt="HTML Hero" />`;
    expect(findImagePrompt(content, "/blog/hero.png")).toBe("HTML Hero");
  });

  it("returns null when alt is empty on an HTML img", () => {
    const content = `<img src="/blog/hero.png" alt="" />`;
    expect(findImagePrompt(content, "/blog/hero.png")).toBeNull();
  });

  it("matches the correct image when multiple images are present", () => {
    const content = ["![First image](/blog/first.png)", "![Second image](/blog/second.png)"].join(
      "\n",
    );
    expect(findImagePrompt(content, "/blog/second.png")).toBe("Second image");
  });
});

describe("extractHeroMedia — no frontmatter hero", () => {
  it("extracts a markdown image from the first lines as hero and strips it from body", () => {
    const content = `![A hero](/blog/hero.png)\n\nFirst paragraph.`;
    const result = extractHeroMedia(content, null, null);
    expect(result.heroImage).toBe("/blog/hero.png");
    expect(result.heroPrompt).toBe("A hero");
    expect(result.body).not.toContain("/blog/hero.png");
    expect(result.body).toContain("First paragraph.");
  });

  it("extracts an HTML img from the first lines as hero", () => {
    const content = `<img src="/blog/cover.png" alt="Cover" />\n\nBody text.`;
    const result = extractHeroMedia(content, null, null);
    expect(result.heroImage).toBe("/blog/cover.png");
    expect(result.heroPrompt).toBe("Cover");
  });

  it("returns null heroImage when no image is found in the first 8 lines", () => {
    const content = `Some intro without image.\n\nMore text.`;
    const result = extractHeroMedia(content, null, null);
    expect(result.heroImage).toBeNull();
    expect(result.heroPrompt).toBeNull();
    expect(result.body).toContain("Some intro without image.");
  });

  it("skips placehold.co images", () => {
    const content = `![placeholder](https://placehold.co/600x300)\n\nReal content.`;
    const result = extractHeroMedia(content, null, null);
    expect(result.heroImage).toBeNull();
  });

  it("does not extract an image beyond the first 8 lines", () => {
    const lines = Array.from({ length: 9 }, (_, i) => `Line ${i}`);
    lines.push("![Late hero](/blog/late.png)");
    const content = lines.join("\n");
    const result = extractHeroMedia(content, null, null);
    expect(result.heroImage).toBeNull();
  });
});

describe("extractHeroMedia — with frontmatter hero", () => {
  it("uses frontmatter heroImage and strips matching image from body", () => {
    const content = `![My prompt](/blog/hero.png)\n\nBody paragraph.`;
    const result = extractHeroMedia(content, "/blog/hero.png", null);
    expect(result.heroImage).toBe("/blog/hero.png");
    expect(result.heroPrompt).toBe("My prompt");
    expect(result.body).not.toContain("![My prompt]");
    expect(result.body).toContain("Body paragraph.");
  });

  it("uses a frontmatter heroPrompt when provided, ignoring inline alt", () => {
    const content = `![Inline alt](/blog/hero.png)\n\nBody.`;
    const result = extractHeroMedia(content, "/blog/hero.png", "Frontmatter prompt");
    expect(result.heroPrompt).toBe("Frontmatter prompt");
  });

  it("falls back to findImagePrompt when frontmatter heroImage is not in candidateLines", () => {
    const earlyLines = Array.from({ length: 5 }, (_, i) => `Paragraph ${i}.`);
    const content = [
      ...earlyLines,
      "Later paragraph.",
      "![Deep hero](/blog/deep.png)",
      "Even more text.",
    ].join("\n");
    const result = extractHeroMedia(content, "/blog/deep.png", null);
    expect(result.heroImage).toBe("/blog/deep.png");
    expect(result.heroPrompt).toBe("Deep hero");
    // Body should NOT be stripped when found outside candidateLines
    expect(result.body).toContain("/blog/deep.png");
  });

  it("returns heroImage from frontmatter even when not in body at all", () => {
    const content = `Just text, no images anywhere.`;
    const result = extractHeroMedia(content, "/blog/hero.png", null);
    expect(result.heroImage).toBe("/blog/hero.png");
    expect(result.heroPrompt).toBeNull();
    expect(result.body).toContain("Just text");
  });
});

describe("extractHeroMedia — whitespace handling", () => {
  it("trims leading and trailing whitespace from the body", () => {
    const content = `   \n\n![Hero](/blog/hero.png)\n\nContent.   \n`;
    const result = extractHeroMedia(content, null, null);
    expect(result.body).toBe("Content.");
  });

  it("trims whitespace-only frontmatter heroImage to null", () => {
    const result = extractHeroMedia("Content.", "   ", null);
    expect(result.heroImage).toBeNull();
  });

  it("trims whitespace-only frontmatter heroPrompt to null", () => {
    const content = `![Alt](/blog/hero.png)\n\nContent.`;
    const result = extractHeroMedia(content, "/blog/hero.png", "   ");
    // Whitespace-only prompt normalizes to null, then falls back to inline alt
    expect(result.heroPrompt).toBe("Alt");
  });
});
