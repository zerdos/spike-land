/**
 * Pure functions for blog seed script. Extracted for testability.
 */
import matter from "gray-matter";
import { extractHeroMedia } from "../src/core/block-website/core-logic/blog-source.js";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  primer: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  featured: boolean;
  draft: boolean;
  unlisted: boolean;
  heroImage: string | null;
  heroPrompt: string | null;
  content: string;
  contentHu: string | null;
  contentDe: string | null;
  contentRu: string | null;
  contentIt: string | null;
  contentEs: string | null;
  contentZh: string | null;
  contentFr: string | null;
  contentJa: string | null;
}

/**
 * Escape a string for use in a SQLite single-quoted string literal.
 * SQLite only requires doubling single quotes inside '...' literals.
 */
export function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

/**
 * Parse frontmatter + body from raw MDX content.
 * Returns null if the content has no title.
 */
export function parseMdxContent(rawContent: string, filename: string): BlogPost | null {
  const { data, content } = matter(rawContent);

  const isDraft = Boolean(data.draft);
  const isUnlisted = Boolean(data.unlisted);

  const { heroImage, heroPrompt, body } = extractHeroMedia(
    content,
    typeof data.heroImage === "string" ? data.heroImage : null,
    typeof data.heroPrompt === "string" ? data.heroPrompt : null,
  );

  return {
    slug: data.slug || filename.replace(".mdx", ""),
    title: data.title || filename,
    description: data.description || "",
    primer: data.primer || "",
    date: data.date || "",
    author: data.author || "",
    category: data.category || "",
    tags: data.tags || [],
    featured: data.featured || false,
    draft: isDraft,
    unlisted: isUnlisted,
    heroImage,
    heroPrompt,
    content: body,
    contentHu: null,
    contentDe: null,
    contentRu: null,
    contentIt: null,
    contentEs: null,
    contentZh: null,
    contentFr: null,
    contentJa: null,
  };
}

/**
 * Sort posts by date descending (newest first).
 */
export function sortByDateDesc(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Generate SQL INSERT OR REPLACE statements for an array of blog posts.
 */
export function generateSQL(posts: BlogPost[]): string {
  const statements: string[] = [];

  // Base INSERT without translations (to stay under SQLITE_TOOBIG limit)
  for (const post of posts) {
    statements.push(
      `INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, draft, unlisted, hero_image, hero_prompt, content, updated_at)
VALUES ('${escapeSQL(post.slug)}', '${escapeSQL(post.title)}', '${escapeSQL(post.description)}', '${escapeSQL(post.primer)}', '${escapeSQL(post.date)}', '${escapeSQL(post.author)}', '${escapeSQL(post.category)}', '${escapeSQL(JSON.stringify(post.tags))}', ${post.featured ? 1 : 0}, ${post.draft ? 1 : 0}, ${post.unlisted ? 1 : 0}, ${post.heroImage ? `'${escapeSQL(post.heroImage)}'` : "NULL"}, ${post.heroPrompt ? `'${escapeSQL(post.heroPrompt)}'` : "NULL"}, '${escapeSQL(post.content)}', unixepoch());`,
    );
  }

  return statements.join("\n\n");
}

/**
 * Generate separate UPDATE statements for each translation language.
 * Returns a map of lang code → SQL string (each small enough for D1).
 */
export function generateTranslationSQL(posts: BlogPost[]): Map<string, string> {
  const langFields: { code: string; field: keyof BlogPost; column: string }[] = [
    { code: "hu", field: "contentHu", column: "content_hu" },
    { code: "de", field: "contentDe", column: "content_de" },
    { code: "ru", field: "contentRu", column: "content_ru" },
    { code: "it", field: "contentIt", column: "content_it" },
    { code: "es", field: "contentEs", column: "content_es" },
    { code: "zh", field: "contentZh", column: "content_zh" },
    { code: "fr", field: "contentFr", column: "content_fr" },
    { code: "ja", field: "contentJa", column: "content_ja" },
  ];

  const result = new Map<string, string>();

  for (const lang of langFields) {
    const updates: string[] = [];
    for (const post of posts) {
      const content = post[lang.field] as string | null;
      if (content) {
        updates.push(
          `UPDATE blog_posts SET ${lang.column} = '${escapeSQL(content)}' WHERE slug = '${escapeSQL(post.slug)}';`,
        );
      }
    }
    if (updates.length > 0) {
      result.set(lang.code, updates.join("\n"));
    }
  }

  return result;
}
