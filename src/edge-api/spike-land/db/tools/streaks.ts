/**
 * Usage Streak Tools (CF Workers)
 *
 * Track consecutive days of tool usage to drive retention.
 * Queries the tool_call_daily rollup table for daily activity.
 */

import { z } from "zod";
import { desc, sql } from "drizzle-orm";
import type { ToolRegistryAdapter } from "../../lazy-imports/types";
import { freeTool } from "../../lazy-imports/procedures-index.ts";
import { textResult } from "../../core-logic/lib/tool-helpers";
import type { DrizzleDB } from "../db/db-index.ts";
import { toolCallDaily } from "../db/schema";

function todayEpochDay(): number {
  return Math.floor(Date.now() / 86400000);
}

function epochDayToDate(epochDay: number): string {
  return new Date(epochDay * 86400000).toISOString().slice(0, 10);
}

export function registerStreakTools(
  registry: ToolRegistryAdapter,
  userId: string,
  db: DrizzleDB,
): void {
  const t = freeTool(userId, db);

  registry.registerBuilt(
    t
      .tool(
        "usage_streak",
        "Check your usage streak — consecutive days of tool activity. " +
          "Shows current streak, longest streak, and recent activity summary.",
        {},
      )
      .meta({ category: "platform", tier: "free" })
      .handler(async ({ ctx }) => {
        // Get distinct active days for this user (last 90 days)
        const cutoff = todayEpochDay() - 90;
        const rows = await ctx.db
          .select({
            day: toolCallDaily.day,
            totalCalls: sql<number>`SUM(${toolCallDaily.callCount})`,
          })
          .from(toolCallDaily)
          .where(sql`${toolCallDaily.userId} = ${ctx.userId} AND ${toolCallDaily.day} >= ${cutoff}`)
          .groupBy(toolCallDaily.day)
          .orderBy(desc(toolCallDaily.day));

        if (rows.length === 0) {
          return textResult(
            "**Usage Streak: 0 days**\n\n" +
              "No tool activity in the last 90 days. Start using tools to build your streak!\n\n" +
              "Try `search_tools` or `get_status` to discover what's available.",
          );
        }

        const activeDays = new Set(rows.map((r) => r.day));
        const today = todayEpochDay();

        // Calculate current streak (consecutive days ending today or yesterday)
        let currentStreak = 0;
        let checkDay = activeDays.has(today) ? today : today - 1;
        if (activeDays.has(checkDay)) {
          while (activeDays.has(checkDay)) {
            currentStreak++;
            checkDay--;
          }
        }

        // Calculate longest streak in the data
        const sortedDays = [...activeDays].sort((a, b) => a - b);
        let longestStreak = 0;
        let tempStreak = 1;
        for (let i = 1; i < sortedDays.length; i++) {
          if (sortedDays[i] === sortedDays[i - 1]! + 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        // Total calls in period
        const totalCalls = rows.reduce((sum, r) => sum + (r.totalCalls ?? 0), 0);

        // Streak emoji and message
        let streakEmoji = "";
        let streakMessage = "";
        if (currentStreak >= 30) {
          streakEmoji = "🏆";
          streakMessage = "Legendary! You've been at it for a month straight.";
        } else if (currentStreak >= 14) {
          streakEmoji = "🔥";
          streakMessage = "On fire! Two weeks and counting.";
        } else if (currentStreak >= 7) {
          streakEmoji = "⚡";
          streakMessage = "One week strong! Keep the momentum.";
        } else if (currentStreak >= 3) {
          streakEmoji = "🌱";
          streakMessage = "Growing! Three days in a row.";
        } else if (currentStreak >= 1) {
          streakEmoji = "✨";
          streakMessage = "You showed up today. Come back tomorrow to build your streak!";
        } else {
          streakEmoji = "💤";
          streakMessage = "Your streak ended. Use any tool to start a new one!";
        }

        // Build activity heatmap (last 14 days)
        let heatmap = "";
        for (let i = 13; i >= 0; i--) {
          const day = today - i;
          heatmap += activeDays.has(day) ? "█" : "░";
        }

        let text = `${streakEmoji} **Usage Streak: ${currentStreak} day${currentStreak !== 1 ? "s" : ""}**\n\n`;
        text += `${streakMessage}\n\n`;
        text += `**Longest Streak:** ${longestStreak} days\n`;
        text += `**Active Days (90d):** ${activeDays.size}\n`;
        text += `**Total Calls (90d):** ${totalCalls.toLocaleString()}\n\n`;
        text += `**Last 14 days:** \`${heatmap}\`\n`;
        text += `*(█ = active, ░ = inactive)*\n\n`;

        // Top tools this period
        const topTools = await ctx.db
          .select({
            toolName: toolCallDaily.toolName,
            calls: sql<number>`SUM(${toolCallDaily.callCount})`,
          })
          .from(toolCallDaily)
          .where(sql`${toolCallDaily.userId} = ${ctx.userId} AND ${toolCallDaily.day} >= ${cutoff}`)
          .groupBy(toolCallDaily.toolName)
          .orderBy(sql`SUM(${toolCallDaily.callCount}) DESC`)
          .limit(5);

        if (topTools.length > 0) {
          text += `**Top Tools:**\n`;
          for (const tool of topTools) {
            text += `- ${tool.toolName}: ${tool.calls} calls\n`;
          }
        }

        return textResult(text);
      }),
  );

  registry.registerBuilt(
    t
      .tool(
        "usage_history",
        "View your tool usage history for a specific date range. " +
          "Shows daily breakdown of tools used and call counts.",
        {
          days: z
            .number()
            .int()
            .min(1)
            .max(90)
            .optional()
            .default(7)
            .describe("Number of days to look back (1–90, default 7)."),
        },
      )
      .meta({ category: "platform", tier: "free" })
      .handler(async ({ input, ctx }) => {
        const cutoff = todayEpochDay() - input.days;

        const rows = await ctx.db
          .select({
            day: toolCallDaily.day,
            toolName: toolCallDaily.toolName,
            callCount: toolCallDaily.callCount,
            errorCount: toolCallDaily.errorCount,
          })
          .from(toolCallDaily)
          .where(sql`${toolCallDaily.userId} = ${ctx.userId} AND ${toolCallDaily.day} >= ${cutoff}`)
          .orderBy(desc(toolCallDaily.day));

        if (rows.length === 0) {
          return textResult(
            `**Usage History (${input.days} days)**\n\nNo tool activity in the last ${input.days} days.`,
          );
        }

        // Group by day
        const dayMap = new Map<number, Array<{ tool: string; calls: number; errors: number }>>();
        for (const row of rows) {
          if (!dayMap.has(row.day)) dayMap.set(row.day, []);
          dayMap.get(row.day)!.push({
            tool: row.toolName,
            calls: row.callCount,
            errors: row.errorCount,
          });
        }

        let text = `**Usage History (${input.days} days)**\n\n`;
        for (const [day, tools] of [...dayMap.entries()].sort((a, b) => b[0] - a[0])) {
          const dateStr = epochDayToDate(day);
          const totalCalls = tools.reduce((s, t) => s + t.calls, 0);
          text += `### ${dateStr} — ${totalCalls} calls\n`;
          for (const tool of tools.sort((a, b) => b.calls - a.calls).slice(0, 10)) {
            const errorNote = tool.errors > 0 ? ` (${tool.errors} errors)` : "";
            text += `- ${tool.tool}: ${tool.calls}${errorNote}\n`;
          }
          text += `\n`;
        }

        return textResult(text);
      }),
  );
}
