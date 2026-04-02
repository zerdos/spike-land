import { env } from "cloudflare:workers";

export interface BlogPostRow {
  slug: string;
  title: string;
  description: string;
  primer: string;
  date: string;
  author: string;
  category: string;
  tags: string;
  featured: number;
  draft: number;
  unlisted: number;
  hero_image: string | null;
  hero_prompt: string | null;
  content: string;
  content_hu: string | null;
  content_de: string | null;
  content_ru: string | null;
  content_it: string | null;
  content_es: string | null;
  content_zh: string | null;
  content_fr: string | null;
  content_ja: string | null;
  created_at: number;
  updated_at: number;
}

const SUPPORTED_LANGS = ["hu", "de", "ru", "it", "es", "zh", "fr", "ja"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

const LANG_CONTENT_FIELDS: Record<SupportedLang, keyof BlogPostRow> = {
  hu: "content_hu",
  de: "content_de",
  ru: "content_ru",
  it: "content_it",
  es: "content_es",
  zh: "content_zh",
  fr: "content_fr",
  ja: "content_ja",
};

export function detectLang(request: Request, queryLang?: string | null): SupportedLang | null {
  if (queryLang && SUPPORTED_LANGS.includes(queryLang as SupportedLang)) {
    return queryLang as SupportedLang;
  }
  const acceptLang = request.headers.get("Accept-Language") || "";
  const primary = acceptLang.split(",")[0]?.trim().split("-")[0]?.toLowerCase();
  if (primary && SUPPORTED_LANGS.includes(primary as SupportedLang)) {
    return primary as SupportedLang;
  }
  return null;
}

export function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}

export function resolveContent(
  row: BlogPostRow,
  lang: SupportedLang | null,
): { content: string; resolvedLang: string } {
  if (lang) {
    const field = LANG_CONTENT_FIELDS[lang];
    const translated = row[field] as string | null | undefined;
    if (translated) {
      return { content: translated, resolvedLang: lang };
    }
  }
  return { content: row.content, resolvedLang: "en" };
}

function getDb(): D1Database {
  return (env as unknown as Env).DB;
}

export async function getAllPosts(): Promise<BlogPostRow[]> {
  const result = await getDb()
    .prepare("SELECT * FROM blog_posts WHERE draft = 0 AND unlisted = 0 ORDER BY date DESC")
    .all<BlogPostRow>();
  return result.results ?? [];
}

export async function getPostBySlug(slug: string): Promise<BlogPostRow | null> {
  return getDb().prepare("SELECT * FROM blog_posts WHERE slug = ?").bind(slug).first<BlogPostRow>();
}
