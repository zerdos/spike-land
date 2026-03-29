import type { BlogPost } from "./seed-blog-lib.js";

const BLOG_IMAGE_PATH_RE = /^\/blog(?:-images)?\/([^/]+)\/([^/?#]+)$/;

export interface WarmableBlogHero {
  slug: string;
  filename: string;
  prompt: string;
}

export function parseBlogImagePath(heroImage: string | null | undefined): {
  slug: string;
  filename: string;
} | null {
  const trimmed = heroImage?.trim() ?? "";
  if (!trimmed) return null;

  const match = trimmed.match(BLOG_IMAGE_PATH_RE);
  if (!match?.[1] || !match[2]) return null;

  return {
    slug: match[1],
    filename: match[2],
  };
}

export function selectWarmableBlogHeroes(posts: BlogPost[]): WarmableBlogHero[] {
  return posts.flatMap((post) => {
    if (post.draft || post.unlisted) return [];

    const prompt = post.heroPrompt?.trim() ?? "";
    if (!prompt) return [];

    const parsed = parseBlogImagePath(post.heroImage);
    if (!parsed) return [];

    return [{ ...parsed, prompt }];
  });
}
