/**
 * Auth MCP Tools
 *
 * Authentication validation and protected route verification tools.
 * Uses the shared tool-builder for tRPC-grade type safety.
 */

import { z } from "zod";
import type { ToolRegistry } from "../tool-registry";
import { freeTool, textResult } from "../tool-builder/procedures";

export function registerAuthTools(
  registry: ToolRegistry,
  userId: string,
): void {
  const t = freeTool(userId);

  registry.registerBuilt(
    t.tool("auth_check_session", "Validate the current user's authentication session and return user info.", {
      session_token: z.string().optional().describe(
        "Optional session token to validate.",
      ),
    })
    .meta({ category: "auth", tier: "free" })
    .handler(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
      if (!user) {
        return textResult(
          "**Error: NOT_FOUND**\nUser session invalid or user not found.\n**Retryable:** false",
        );
      }
      return textResult(
        `**Session Valid**\n\n`
          + `**User:** ${user.name || "unnamed"}\n`
          + `**Email:** ${user.email}\n`
          + `**Role:** ${user.role}\n`
          + `**Member since:** ${user.createdAt.toISOString()}`,
      );
    }),
  );

  registry.registerBuilt(
    t.tool("auth_check_route_access", "Check if the current user has access to a specific route based on their role.", {
      path: z.string().min(1).describe(
        "Route path to check access for (e.g., /admin, /dashboard).",
      ),
    })
    .meta({ category: "auth", tier: "free" })
    .handler(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { role: true },
      });
      if (!user) {
        return textResult(
          "**Access: DENIED**\nUser not authenticated.\n**Retryable:** false",
        );
      }
      const adminRoutes = [
        "/admin",
        "/admin/agents",
        "/admin/emails",
        "/admin/gallery",
        "/admin/jobs",
        "/admin/photos",
      ];
      const isAdminRoute = adminRoutes.some(r => input.path.startsWith(r));
      const hasAccess = !isAdminRoute || user.role === "ADMIN";
      return textResult(
        `**Route Access Check**\n\n`
          + `**Path:** ${input.path}\n`
          + `**Role:** ${user.role}\n`
          + `**Access:** ${hasAccess ? "GRANTED" : "DENIED"}\n`
          + `**Requires Admin:** ${isAdminRoute}`,
      );
    }),
  );

  registry.registerBuilt(
    t.tool("auth_get_profile", "Get the current user's full profile with optional workspace memberships.", {
      include_workspaces: z.boolean().optional().default(false).describe(
        "Include workspace memberships.",
      ),
    })
    .meta({ category: "auth", tier: "free" })
    .handler(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          createdAt: true,
          ...(input.include_workspaces
            ? {
              workspaceMembers: {
                select: {
                  workspace: { select: { id: true, name: true, slug: true } },
                  role: true,
                },
              },
            }
            : {}),
        },
      });
      if (!user) {
        return textResult(
          "**Error: NOT_FOUND**\nUser not found.\n**Retryable:** false",
        );
      }
      let text = `**User Profile**\n\n`;
      text += `**Name:** ${user.name || "unnamed"}\n`;
      text += `**Email:** ${user.email}\n`;
      text += `**Role:** ${user.role}\n`;
      text += `**Avatar:** ${user.image || "(none)"}\n`;
      text += `**Joined:** ${user.createdAt.toISOString()}\n`;
      if (input.include_workspaces && "workspaceMembers" in user) {
        const members = user.workspaceMembers as unknown as Array<
          { workspace: { name: string; slug: string }; role: string }
        >;
        if (members.length > 0) {
          text += `\n**Workspaces:**\n`;
          for (const m of members) {
            text += `- ${m.workspace.name} (\`${m.workspace.slug}\`) — ${m.role}\n`;
          }
        }
      }
      return textResult(text);
    }),
  );
}
