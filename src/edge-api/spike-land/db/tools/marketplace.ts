/**
 * Marketplace Tools (CF Workers)
 *
 * Tool marketplace — discover, install, uninstall community-published tools.
 * Uses Drizzle ORM + D1 with registeredTools and toolPurchases tables.
 * Revenue share: 70% to seller, 30% platform fee.
 */

import { z } from "zod";
import { and, desc, eq, sql, sum } from "drizzle-orm";
import type { ToolRegistryAdapter } from "../../lazy-imports/types";
import { freeTool } from "../../lazy-imports/procedures-index.ts";
import { safeToolCall, textResult } from "../../core-logic/lib/tool-helpers";
import type { DrizzleDB } from "../db/db-index.ts";
import { registeredTools, toolPurchases, users } from "../db/schema";

export function registerMarketplaceTools(
  registry: ToolRegistryAdapter,
  userId: string,
  db: DrizzleDB,
): void {
  const t = freeTool(userId, db);

  registry.registerBuilt(
    t
      .tool(
        "marketplace_search",
        "Search the tool marketplace for community-published tools. " +
          "Returns tools matching the query with install counts and author info.",
        {
          query: z
            .string()
            .min(1)
            .max(200)
            .describe("Search query to find tools by name or description."),
          limit: z
            .number()
            .min(1)
            .max(50)
            .optional()
            .default(10)
            .describe("Maximum number of results to return (1–50)."),
        },
      )
      .meta({ category: "marketplace", tier: "free" })
      .examples([
        {
          name: "search_for_weather_tool",
          input: { query: "weather forecast" },
          description: "Search the marketplace for weather tools",
        },
      ])
      .handler(async ({ input, ctx }) => {
        return safeToolCall("marketplace_search", async () => {
          const { query, limit } = input;
          const pattern = `%${query}%`;

          const tools = await ctx.db
            .select({
              id: registeredTools.id,
              name: registeredTools.name,
              description: registeredTools.description,
              installCount: registeredTools.installCount,
              priceCents: registeredTools.priceCents,
              authorName: users.name,
            })
            .from(registeredTools)
            .leftJoin(users, eq(registeredTools.userId, users.id))
            .where(
              and(
                eq(registeredTools.status, "published"),
                sql`(${registeredTools.name} LIKE ${pattern} OR ${registeredTools.description} LIKE ${pattern})`,
              ),
            )
            .orderBy(desc(registeredTools.installCount))
            .limit(limit);

          if (tools.length === 0) {
            return textResult(
              `No marketplace tools found matching "${query}". Try different keywords.`,
            );
          }

          let text = `**Marketplace Results (${tools.length} tool(s) matching "${query}"):**\n\n`;
          for (const tool of tools) {
            const author = tool.authorName ?? "Unknown";
            const price = tool.priceCents > 0 ? `$${(tool.priceCents / 100).toFixed(2)}` : "Free";
            text += `- **${tool.name}** — ${price}\n`;
            text += `  ${tool.description}\n`;
            text += `  Author: ${author} | Installs: ${tool.installCount} | ID: ${tool.id}\n\n`;
          }
          text += `Use \`marketplace_install\` with a tool ID to install a tool.`;

          return textResult(text);
        });
      }),
  );

  registry.registerBuilt(
    t
      .tool(
        "marketplace_install",
        "Install a published tool from the marketplace. " +
          "If the tool has a price, creates a purchase record with 70/30 revenue split.",
        {
          tool_id: z.string().min(1).describe("The unique ID of the marketplace tool."),
          confirm_purchase: z
            .boolean()
            .optional()
            .default(false)
            .describe("Set to true to confirm a paid tool purchase."),
        },
      )
      .meta({ category: "marketplace", tier: "free" })
      .handler(async ({ input, ctx }) => {
        return safeToolCall("marketplace_install", async () => {
          const { tool_id, confirm_purchase } = input;

          const rows = await ctx.db
            .select({
              id: registeredTools.id,
              name: registeredTools.name,
              priceCents: registeredTools.priceCents,
              userId: registeredTools.userId,
            })
            .from(registeredTools)
            .where(and(eq(registeredTools.id, tool_id), eq(registeredTools.status, "published")))
            .limit(1);

          const tool = rows[0];
          if (!tool) {
            return textResult("Tool not found or not published.");
          }

          if (tool.priceCents > 0) {
            const existing = await ctx.db
              .select({ id: toolPurchases.id })
              .from(toolPurchases)
              .where(
                and(
                  eq(toolPurchases.toolId, tool_id),
                  eq(toolPurchases.buyerUserId, ctx.userId),
                  eq(toolPurchases.status, "completed"),
                ),
              )
              .limit(1);

            if (existing.length > 0) {
              return textResult(
                `You already purchased **${tool.name}**. It is available in your workspace.`,
              );
            }

            if (!confirm_purchase) {
              const price = `$${(tool.priceCents / 100).toFixed(2)}`;
              return textResult(
                `**Payment Required**\n\n` +
                  `**Tool:** ${tool.name}\n` +
                  `**Price:** ${price}\n\n` +
                  `To confirm, call \`marketplace_install\` again with \`confirm_purchase: true\`.`,
              );
            }

            const platformFeeCents = Math.round(tool.priceCents * 0.3);
            const sellerEarningsCents = tool.priceCents - platformFeeCents;
            const purchaseId = crypto.randomUUID();

            await ctx.db.insert(toolPurchases).values({
              id: purchaseId,
              toolId: tool_id,
              buyerUserId: ctx.userId,
              sellerUserId: tool.userId,
              priceCents: tool.priceCents,
              platformFeeCents,
              sellerEarningsCents,
              status: "completed",
            });
          }

          await ctx.db
            .update(registeredTools)
            .set({
              installCount: sql`${registeredTools.installCount} + 1`,
              updatedAt: Date.now(),
            })
            .where(eq(registeredTools.id, tool_id));

          const priceInfo =
            tool.priceCents > 0
              ? `**Price:** $${(tool.priceCents / 100).toFixed(2)} (charged)\n`
              : "";

          return textResult(
            `**Tool Installed!**\n\n` +
              `**Name:** ${tool.name}\n` +
              `**ID:** ${tool_id}\n` +
              priceInfo +
              `\nThe tool is now available in your workspace.`,
          );
        });
      }),
  );

  registry.registerBuilt(
    t
      .tool("marketplace_uninstall", "Uninstall a previously installed marketplace tool.", {
        tool_id: z.string().min(1).describe("The unique ID of the marketplace tool."),
      })
      .meta({ category: "marketplace", tier: "free" })
      .handler(async ({ input, ctx }) => {
        return safeToolCall("marketplace_uninstall", async () => {
          const { tool_id } = input;

          const rows = await ctx.db
            .select({ id: registeredTools.id, name: registeredTools.name })
            .from(registeredTools)
            .where(eq(registeredTools.id, tool_id))
            .limit(1);

          const tool = rows[0];
          if (!tool) {
            return textResult("Tool is not installed.");
          }

          await ctx.db
            .update(registeredTools)
            .set({
              installCount: sql`CASE WHEN ${registeredTools.installCount} > 0 THEN ${registeredTools.installCount} - 1 ELSE 0 END`,
              updatedAt: Date.now(),
            })
            .where(eq(registeredTools.id, tool_id));

          return textResult(
            `**Tool Uninstalled!**\n\n` +
              `**Name:** ${tool.name}\n\n` +
              `The tool has been removed from your workspace.`,
          );
        });
      }),
  );

  registry.registerBuilt(
    t
      .tool(
        "marketplace_my_earnings",
        "View your revenue from published marketplace tools. " +
          "Shows per-tool breakdown with real purchase data.",
        {},
      )
      .meta({ category: "marketplace", tier: "free" })
      .handler(async ({ ctx }) => {
        return safeToolCall("marketplace_my_earnings", async () => {
          const tools = await ctx.db
            .select({
              id: registeredTools.id,
              name: registeredTools.name,
              installCount: registeredTools.installCount,
              priceCents: registeredTools.priceCents,
            })
            .from(registeredTools)
            .where(
              and(eq(registeredTools.userId, ctx.userId), eq(registeredTools.status, "published")),
            )
            .orderBy(desc(registeredTools.installCount));

          if (tools.length === 0) {
            return textResult(
              "**Marketplace Earnings**\n\n" +
                "You have no published tools. Publish a tool to start earning from installs.\n\n" +
                "Use `register_tool` to create a tool, then `publish_tool` to make it available.",
            );
          }

          const earningsRows = await ctx.db
            .select({
              toolId: toolPurchases.toolId,
              totalEarnings: sum(toolPurchases.sellerEarningsCents),
              purchaseCount: sql<number>`COUNT(*)`,
            })
            .from(toolPurchases)
            .where(
              and(
                eq(toolPurchases.sellerUserId, ctx.userId),
                eq(toolPurchases.status, "completed"),
              ),
            )
            .groupBy(toolPurchases.toolId);

          const earningsMap = new Map<string, { totalEarnings: number; purchaseCount: number }>();
          for (const row of earningsRows) {
            earningsMap.set(row.toolId, {
              totalEarnings: Number(row.totalEarnings) || 0,
              purchaseCount: row.purchaseCount,
            });
          }

          let totalInstalls = 0;
          let totalEarningsCents = 0;
          let text = `**Marketplace Earnings Dashboard**\n\n`;

          for (const tool of tools) {
            totalInstalls += tool.installCount;
            const earnings = earningsMap.get(tool.id);
            if (earnings) {
              totalEarningsCents += earnings.totalEarnings;
            }
          }

          text += `**Total Installs:** ${totalInstalls}\n`;
          text += `**Total Earnings:** $${(totalEarningsCents / 100).toFixed(2)}\n`;
          text += `**Published Tools:** ${tools.length}\n\n`;
          text += `### Per-Tool Breakdown\n\n`;

          for (const tool of tools) {
            const earnings = earningsMap.get(tool.id);
            const price = tool.priceCents > 0 ? `$${(tool.priceCents / 100).toFixed(2)}` : "Free";
            const earned = earnings
              ? `$${(earnings.totalEarnings / 100).toFixed(2)} (${earnings.purchaseCount} sale(s))`
              : "$0.00";
            text += `- **${tool.name}** — ${price}\n`;
            text += `  Installs: ${tool.installCount} | Earned: ${earned}\n\n`;
          }

          return textResult(text);
        });
      }),
  );

  registry.registerBuilt(
    t
      .tool(
        "marketplace_set_price",
        "Set the price for one of your published tools. " +
          "Price must be 0 (free) or between 100–5000 cents ($1–$50).",
        {
          tool_id: z.string().min(1).describe("The unique ID of your marketplace tool."),
          price_cents: z
            .number()
            .int()
            .min(0)
            .max(5000)
            .describe("Price in cents. 0 = free, or 100–5000 ($1–$50)."),
        },
      )
      .meta({ category: "marketplace", tier: "free" })
      .handler(async ({ input, ctx }) => {
        return safeToolCall("marketplace_set_price", async () => {
          const { tool_id, price_cents } = input;

          if (price_cents !== 0 && (price_cents < 100 || price_cents > 5000)) {
            return textResult(
              "Invalid price. Must be 0 (free) or between 100–5000 cents ($1.00–$50.00).",
            );
          }

          const rows = await ctx.db
            .select({ id: registeredTools.id, name: registeredTools.name })
            .from(registeredTools)
            .where(and(eq(registeredTools.id, tool_id), eq(registeredTools.userId, ctx.userId)))
            .limit(1);

          const tool = rows[0];
          if (!tool) {
            return textResult("Tool not found or you are not the author.");
          }

          await ctx.db
            .update(registeredTools)
            .set({
              priceCents: price_cents,
              updatedAt: Date.now(),
            })
            .where(eq(registeredTools.id, tool_id));

          const priceDisplay = price_cents === 0 ? "Free" : `$${(price_cents / 100).toFixed(2)}`;

          return textResult(
            `**Price Updated!**\n\n` +
              `**Tool:** ${tool.name}\n` +
              `**New Price:** ${priceDisplay}\n\n` +
              `Sellers receive 70% of each sale. Platform fee is 30%.`,
          );
        });
      }),
  );

  // ─── Submission & Publishing ──────────────────────────────────────────────

  registry.registerBuilt(
    t
      .tool(
        "marketplace_submit",
        "Submit a new tool to the marketplace. Creates a draft that you can then publish. " +
          "Provide a name, description, input schema (JSON), and category.",
        {
          name: z.string().min(2).max(100).describe("Tool name (unique, lowercase with hyphens)."),
          description: z
            .string()
            .min(10)
            .max(2000)
            .describe("What the tool does — shown to potential users."),
          schema: z
            .string()
            .max(10000)
            .optional()
            .default("{}")
            .describe("JSON input schema for the tool (Zod-compatible object)."),
          category: z
            .string()
            .max(50)
            .optional()
            .default("")
            .describe("Tool category (e.g., development, ai-tools, productivity)."),
          endpoint: z
            .string()
            .url()
            .optional()
            .describe("HTTP endpoint that implements the tool (must be HTTPS)."),
          price_cents: z
            .number()
            .int()
            .min(0)
            .max(5000)
            .optional()
            .default(0)
            .describe("Price in cents. 0 = free, 100–5000 = $1–$50."),
        },
      )
      .meta({ category: "marketplace", tier: "free" })
      .handler(async ({ input, ctx }) => {
        return safeToolCall("marketplace_submit", async () => {
          // Validate schema is valid JSON
          try {
            JSON.parse(input.schema);
          } catch {
            return textResult("**Error:** schema must be valid JSON.");
          }

          // Validate price range
          if (input.price_cents !== 0 && (input.price_cents < 100 || input.price_cents > 5000)) {
            return textResult(
              "**Error:** price must be 0 (free) or between 100–5000 cents ($1.00–$50.00).",
            );
          }

          // Check for duplicate name by this user
          const existing = await ctx.db
            .select({ id: registeredTools.id })
            .from(registeredTools)
            .where(
              and(eq(registeredTools.userId, ctx.userId), eq(registeredTools.name, input.name)),
            )
            .limit(1);

          if (existing.length > 0) {
            return textResult(
              `**Error:** You already have a tool named "${input.name}". Use a different name or update the existing one.`,
            );
          }

          const id = crypto.randomUUID();
          const now = Date.now();

          await ctx.db.insert(registeredTools).values({
            id,
            userId: ctx.userId,
            name: input.name,
            description: input.description,
            schema: input.schema,
            category: input.category,
            endpoint: input.endpoint ?? null,
            status: "draft",
            version: "1.0.0",
            stability: "stable",
            installCount: 0,
            priceCents: input.price_cents,
            createdAt: now,
            updatedAt: now,
          });

          const priceDisplay =
            input.price_cents === 0 ? "Free" : `$${(input.price_cents / 100).toFixed(2)}`;

          return textResult(
            `**Tool Submitted!**\n\n` +
              `**Name:** ${input.name}\n` +
              `**ID:** ${id}\n` +
              `**Status:** Draft\n` +
              `**Price:** ${priceDisplay}\n` +
              `**Category:** ${input.category || "(none)"}\n\n` +
              `Your tool is saved as a draft. Use \`marketplace_publish\` with the tool ID to make it live.\n` +
              `Sellers receive 70% of each sale. Platform fee is 30%.`,
          );
        });
      }),
  );

  registry.registerBuilt(
    t
      .tool(
        "marketplace_publish",
        "Publish a draft tool to make it visible and installable in the marketplace.",
        {
          tool_id: z.string().min(1).describe("The unique ID of your draft tool."),
        },
      )
      .meta({ category: "marketplace", tier: "free" })
      .handler(async ({ input, ctx }) => {
        return safeToolCall("marketplace_publish", async () => {
          const rows = await ctx.db
            .select({
              id: registeredTools.id,
              name: registeredTools.name,
              status: registeredTools.status,
              description: registeredTools.description,
            })
            .from(registeredTools)
            .where(
              and(eq(registeredTools.id, input.tool_id), eq(registeredTools.userId, ctx.userId)),
            )
            .limit(1);

          const tool = rows[0];
          if (!tool) {
            return textResult("Tool not found or you are not the author.");
          }

          if (tool.status === "published") {
            return textResult(`**${tool.name}** is already published.`);
          }

          // Basic validation before publishing
          if (tool.description.length < 10) {
            return textResult("**Error:** Description must be at least 10 characters to publish.");
          }

          await ctx.db
            .update(registeredTools)
            .set({ status: "published", updatedAt: Date.now() })
            .where(eq(registeredTools.id, input.tool_id));

          return textResult(
            `**Tool Published!** 🎉\n\n` +
              `**Name:** ${tool.name}\n` +
              `**ID:** ${input.tool_id}\n\n` +
              `Your tool is now live in the marketplace. Other users can find it via \`marketplace_search\` and install it.\n\n` +
              `Set a price with \`marketplace_set_price\` or track earnings with \`marketplace_my_earnings\`.`,
          );
        });
      }),
  );

  registry.registerBuilt(
    t
      .tool(
        "marketplace_my_tools",
        "List all tools you've submitted to the marketplace, including drafts and published tools.",
        {},
      )
      .meta({ category: "marketplace", tier: "free" })
      .handler(async ({ ctx }) => {
        return safeToolCall("marketplace_my_tools", async () => {
          const tools = await ctx.db
            .select({
              id: registeredTools.id,
              name: registeredTools.name,
              description: registeredTools.description,
              status: registeredTools.status,
              installCount: registeredTools.installCount,
              priceCents: registeredTools.priceCents,
              version: registeredTools.version,
              createdAt: registeredTools.createdAt,
            })
            .from(registeredTools)
            .where(eq(registeredTools.userId, ctx.userId))
            .orderBy(desc(registeredTools.updatedAt));

          if (tools.length === 0) {
            return textResult(
              "**My Marketplace Tools (0)**\n\n" +
                "You haven't submitted any tools yet.\n\n" +
                "Use `marketplace_submit` to create your first tool!",
            );
          }

          let text = `**My Marketplace Tools (${tools.length})**\n\n`;
          for (const tool of tools) {
            const price = tool.priceCents > 0 ? `$${(tool.priceCents / 100).toFixed(2)}` : "Free";
            const statusIcon = tool.status === "published" ? "🟢" : "📝";
            text += `${statusIcon} **${tool.name}** (v${tool.version}) — ${price}\n`;
            text += `  Status: ${tool.status} | Installs: ${tool.installCount} | ID: ${tool.id}\n`;
            text += `  ${tool.description.slice(0, 100)}${tool.description.length > 100 ? "…" : ""}\n\n`;
          }

          return textResult(text);
        });
      }),
  );
}
