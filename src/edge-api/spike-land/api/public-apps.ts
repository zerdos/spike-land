import { Hono } from "hono";
import { eq, asc, inArray } from "drizzle-orm";
import type { Env } from "../core-logic/env";
import type { AuthVariables } from "./middleware";
import { createDb } from "../db/db/db-index.ts";
import { mcpApps, registeredTools } from "../db/db/schema";
import { generateAppMdx } from "../core-logic/tools/store/mdx-templates";
import type { AppToolDef } from "../core-logic/tools/store/mdx-templates";

export const publicAppsRoute = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

publicAppsRoute.get("/", async (c) => {
  const db = createDb(c.env.DB);

  const apps = await db
    .select({
      slug: mcpApps.slug,
      name: mcpApps.name,
      description: mcpApps.description,
      emoji: mcpApps.emoji,
      category: mcpApps.category,
      tags: mcpApps.tags,
      tagline: mcpApps.tagline,
      pricing: mcpApps.pricing,
      isFeatured: mcpApps.isFeatured,
      isNew: mcpApps.isNew,
      toolCount: mcpApps.toolCount,
      sortOrder: mcpApps.sortOrder,
    })
    .from(mcpApps)
    .where(eq(mcpApps.status, "live"))
    .orderBy(asc(mcpApps.sortOrder));

  const result = apps.map((row) => {
    let tags: string[] = [];
    try {
      tags = JSON.parse(row.tags) as string[];
    } catch (e) {
      console.error(`Failed to parse 'tags' for app ${row.slug}`, e);
    }
    return {
      slug: row.slug,
      name: row.name,
      description: row.description,
      emoji: row.emoji,
      category: row.category,
      tags,
      tagline: row.tagline,
      pricing: row.pricing,
      is_featured: row.isFeatured,
      is_new: row.isNew,
      tool_count: row.toolCount,
      sort_order: row.sortOrder,
    };
  });

  c.header("Cache-Control", "public, max-age=14400, stale-while-revalidate=86400");
  return c.json({ apps: result });
});

publicAppsRoute.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = createDb(c.env.DB);

  const row = await db
    .select()
    .from(mcpApps)
    .where(eq(mcpApps.slug, slug))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!row) {
    return c.json({ error: "App not found" }, 404);
  }

  let tools: string[] = [];
  let graph: Record<string, unknown> = {};
  let tags: string[] = [];

  try {
    tools = JSON.parse(row.tools) as string[];
  } catch (e) {
    console.error(`Failed to parse 'tools' for app ${slug}`, e);
  }
  try {
    tags = JSON.parse(row.tags) as string[];
  } catch (e) {
    console.error(`Failed to parse 'tags' for app ${slug}`, e);
  }
  try {
    graph = JSON.parse(row.graph) as Record<string, unknown>;
  } catch (e) {
    console.error(`Failed to parse 'graph' for app ${slug}`, e);
  }

  const app = {
    slug: row.slug,
    name: row.name,
    description: row.description,
    emoji: row.emoji,
    category: row.category,
    tags,
    tagline: row.tagline,
    pricing: row.pricing,
    is_featured: row.isFeatured,
    is_new: row.isNew,
    status: row.status,
    tools,
    graph,
    markdown: row.markdown,
    tool_count: row.toolCount,
    sort_order: row.sortOrder,
  };

  c.header("Cache-Control", "public, max-age=14400, stale-while-revalidate=86400");
  return c.json(app);
});

/**
 * GET /apps/:slug/mdx
 *
 * Returns the MDX content for an app as plain text. If the app has stored
 * markdown in the database, that is returned directly. Otherwise, MDX is
 * generated on-the-fly from the app metadata and its registered tools.
 */
publicAppsRoute.get("/:slug/mdx", async (c) => {
  const slug = c.req.param("slug");
  const db = createDb(c.env.DB);

  const row = await db
    .select({
      slug: mcpApps.slug,
      name: mcpApps.name,
      description: mcpApps.description,
      emoji: mcpApps.emoji,
      category: mcpApps.category,
      tags: mcpApps.tags,
      tagline: mcpApps.tagline,
      pricing: mcpApps.pricing,
      tools: mcpApps.tools,
      markdown: mcpApps.markdown,
    })
    .from(mcpApps)
    .where(eq(mcpApps.slug, slug))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!row) {
    return c.text(`# ${slug}\n\nApp not found.`, 404);
  }

  // If stored markdown exists, return it directly
  if (row.markdown.trim().length > 0) {
    c.header("Content-Type", "text/plain; charset=utf-8");
    c.header("Cache-Control", "public, max-age=14400, stale-while-revalidate=86400");
    return c.text(row.markdown);
  }

  // Generate MDX on-the-fly from app metadata + tools list
  let toolNames: string[] = [];
  try {
    toolNames = JSON.parse(row.tools) as string[];
  } catch {
    // ignore parse error — tools defaults to empty array
  }

  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags) as string[];
  } catch {
    // ignore parse error
  }

  // Fetch tool metadata for any tool names we have
  let toolDefs: AppToolDef[] = [];
  if (toolNames.length > 0) {
    try {
      const toolRows = await db
        .select({
          name: registeredTools.name,
          description: registeredTools.description,
          category: registeredTools.category,
        })
        .from(registeredTools)
        .where(inArray(registeredTools.name, toolNames))
        .limit(50);

      toolDefs = toolRows.map((t) => {
        const def: AppToolDef = { name: t.name };
        if (t.description) def.description = t.description;
        if (t.category) def.category = t.category;
        return def;
      });
    } catch {
      // Fall back to bare tool names if DB query fails
      toolDefs = toolNames.map((name) => ({ name }));
    }
  }

  const mdxContext: Parameters<typeof generateAppMdx>[0] = {
    slug: row.slug,
    name: row.name,
    description: row.description,
    emoji: row.emoji,
    category: row.category,
    tags,
    tools: toolDefs,
  };
  if (row.tagline) mdxContext.tagline = row.tagline;
  if (row.pricing) mdxContext.pricing = row.pricing;

  const mdx = generateAppMdx(mdxContext);

  c.header("Content-Type", "text/plain; charset=utf-8");
  c.header("Cache-Control", "public, max-age=3600, stale-while-revalidate=14400");
  return c.text(mdx);
});
