#!/usr/bin/env tsx
import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hashImagePrompt } from "../src/core/block-website/core-logic/blog-image-policy.js";
import { parseMdxContent, sortByDateDesc, type BlogPost } from "./seed-blog-lib.js";
import { selectWarmableBlogHeroes } from "./warm-blog-heroes-lib.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const BLOG_DIR = resolve(ROOT, "content/blog");
const IMAGE_DIR = resolve(ROOT, "content/blog-images");
const DEFAULT_BASE_URL = "https://spike-edge.spikeland.workers.dev";
const DEFAULT_CONCURRENCY = 1;
const HERO_WARM_TIMEOUT_MS = 180_000;

interface CliOptions {
  baseUrl: string;
  concurrency: number;
}

function parseCliOptions(): CliOptions {
  const args = process.argv.slice(2);
  const baseFlagIndex = args.indexOf("--base");
  const concurrencyFlagIndex = args.indexOf("--concurrency");

  const baseUrl =
    (baseFlagIndex >= 0 ? args[baseFlagIndex + 1] : undefined) ||
    process.env.BLOG_HERO_WARM_BASE ||
    DEFAULT_BASE_URL;

  const concurrencyRaw =
    (concurrencyFlagIndex >= 0 ? args[concurrencyFlagIndex + 1] : undefined) ||
    process.env.BLOG_HERO_WARM_CONCURRENCY ||
    `${DEFAULT_CONCURRENCY}`;
  const concurrency = Number.parseInt(concurrencyRaw, 10);

  return {
    baseUrl,
    concurrency:
      Number.isFinite(concurrency) && concurrency > 0 ? concurrency : DEFAULT_CONCURRENCY,
  };
}

async function parseMdxFiles(): Promise<BlogPost[]> {
  const entries = await readdir(BLOG_DIR, { withFileTypes: true });
  const posts: BlogPost[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".mdx")) continue;

    const fullPath = join(BLOG_DIR, entry.name);
    const fileContent = await readFile(fullPath, "utf-8");
    const post = parseMdxContent(fileContent, entry.name);
    if (post) posts.push(post);
  }

  return sortByDateDesc(posts);
}

async function hasLocalHeroAsset(slug: string, filename: string): Promise<boolean> {
  try {
    const file = await stat(join(IMAGE_DIR, slug, filename));
    return file.isFile();
  } catch {
    return false;
  }
}

async function warmHeroAsset(
  baseUrl: string,
  hero: { slug: string; filename: string; prompt: string },
): Promise<void> {
  const url = new URL(`/api/blog-images/${hero.slug}/${hero.filename}`, baseUrl);
  url.searchParams.set("prompt", hero.prompt);
  url.searchParams.set("v", hashImagePrompt(hero.prompt));

  const response = await fetch(url, {
    headers: { Accept: "image/*" },
    signal: AbortSignal.timeout(HERO_WARM_TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}${body ? `: ${body.slice(0, 160)}` : ""}`);
  }

  await response.arrayBuffer();
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0;

  async function next(): Promise<void> {
    const item = items[index];
    index += 1;
    if (item === undefined) return;

    await worker(item);
    await next();
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => next()));
}

async function main(): Promise<void> {
  const options = parseCliOptions();
  const posts = await parseMdxFiles();
  const warmable = selectWarmableBlogHeroes(posts);
  const toWarm = [];

  for (const hero of warmable) {
    if (await hasLocalHeroAsset(hero.slug, hero.filename)) continue;
    toWarm.push(hero);
  }

  console.log(`Warming ${toWarm.length} prompt-driven blog hero images via ${options.baseUrl}...`);

  if (toWarm.length === 0) {
    console.log("No prompt-driven hero images require warming.");
    return;
  }

  await runWithConcurrency(toWarm, options.concurrency, async (hero) => {
    console.log(`- warming ${hero.slug}/${hero.filename}`);
    await warmHeroAsset(options.baseUrl, hero);
  });

  console.log("Blog hero image warming complete.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
