import { posts } from "./generated-posts";
import type { BlogPost } from "./generated-posts";

/**
 * Get all blog posts, optionally filtered.
 */
export function getPosts(options?: { tag?: string; category?: string; limit?: number }): BlogPost[] {
  let filtered = posts;

  if (options?.tag) {
    filtered = filtered.filter(p => p.tags.includes(options.tag!));
  }

  if (options?.category) {
    filtered = filtered.filter(p => p.category === options.category);
  }

  if (options?.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

/**
 * Get a specific post by slug
 */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find(p => p.slug === slug);
}
