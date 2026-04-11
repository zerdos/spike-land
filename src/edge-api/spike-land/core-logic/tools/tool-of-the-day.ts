/**
 * Tool of the Day MCP Tool
 *
 * Returns a daily featured tool from the spike.land catalog.
 * Rotates deterministically by day-of-year so every caller sees
 * the same tool on any given UTC calendar day.
 */

import { z } from "zod";
import type { ToolRegistryAdapter } from "../../lazy-imports/types";
import { freeTool } from "../../lazy-imports/procedures-index.ts";
import { textResult } from "../lib/tool-helpers";
import type { DrizzleDB } from "../../db/db/db-index.ts";

// ─── Featured Tool Catalog ────────────────────────────────────────────────────

interface FeaturedTool {
  name: string;
  desc: string;
  category: string;
  example: string;
}

const FEATURED_TOOLS: FeaturedTool[] = [
  {
    name: "codegen",
    desc: "Generate code from natural language",
    category: "development",
    example: "codegen({ language: 'typescript', prompt: 'REST API for todo app' })",
  },
  {
    name: "testgen",
    desc: "Generate test suites for existing code",
    category: "development",
    example: "testgen({ file: 'src/api.ts', framework: 'vitest' })",
  },
  {
    name: "esbuild_compile",
    desc: "Compile TypeScript/JavaScript at the edge",
    category: "development",
    example: "esbuild_compile({ code: 'const x: number = 42;', format: 'esm' })",
  },
  {
    name: "lie_detector",
    desc: "Analyze claims for logical consistency",
    category: "ai-tools",
    example: "lie_detector({ claim: 'This code has no bugs' })",
  },
  {
    name: "store_search",
    desc: "Search the MCP app store",
    category: "store",
    example: "store_search({ query: 'image generation' })",
  },
  {
    name: "quiz_generate",
    desc: "Generate quizzes on any topic",
    category: "learning",
    example: "quiz_generate({ topic: 'TypeScript generics', difficulty: 'medium' })",
  },
  {
    name: "diff_analyze",
    desc: "Analyze code diffs for issues",
    category: "development",
    example: "diff_analyze({ diff: '...' })",
  },
  {
    name: "blog_list_posts",
    desc: "Browse published blog posts",
    category: "content",
    example: "blog_list_posts({ category: 'Technical' })",
  },
  {
    name: "netsim",
    desc: "Simulate network topologies",
    category: "labs",
    example: "netsim({ nodes: 5, topology: 'mesh' })",
  },
  {
    name: "causality_analyze",
    desc: "Analyze cause-effect relationships",
    category: "ai-tools",
    example: "causality_analyze({ scenario: '...' })",
  },
  {
    name: "decisions_matrix",
    desc: "Build decision matrices",
    category: "productivity",
    example: "decisions_matrix({ options: ['A', 'B'], criteria: ['cost', 'speed'] })",
  },
  {
    name: "retro_run",
    desc: "Run team retrospectives",
    category: "team",
    example: "retro_run({ format: 'start-stop-continue' })",
  },
  {
    name: "codebase_explain",
    desc: "Explain unfamiliar codebases",
    category: "development",
    example: "codebase_explain({ path: 'src/' })",
  },
  {
    name: "session_start",
    desc: "Start a persistent work session",
    category: "platform",
    example: "session_start({ goal: 'Build auth system' })",
  },
  {
    name: "arena_challenge",
    desc: "Challenge AI models head-to-head",
    category: "ai-tools",
    example: "arena_challenge({ prompt: 'Write a haiku', models: ['claude', 'gpt4'] })",
  },
  {
    name: "categorizer",
    desc: "Auto-categorize tools and content",
    category: "ai-tools",
    example: "categorizer({ items: ['react hook', 'SQL query'] })",
  },
  {
    name: "bft_verify",
    desc: "Byzantine fault tolerance checker",
    category: "infrastructure",
    example: "bft_verify({ nodes: 7, faulty: 2 })",
  },
  {
    name: "boxes_create",
    desc: "Create isolated sandbox environments",
    category: "development",
    example: "boxes_create({ runtime: 'node', timeout: 30 })",
  },
  {
    name: "crdt_merge",
    desc: "Merge CRDT data structures",
    category: "infrastructure",
    example: "crdt_merge({ type: 'lww-register', a: {}, b: {} })",
  },
  {
    name: "github_admin",
    desc: "Manage GitHub repos and issues",
    category: "development",
    example: "github_admin({ action: 'list_issues', repo: 'my-org/my-repo' })",
  },
  {
    name: "orchestrator",
    desc: "Orchestrate multi-step AI workflows",
    category: "ai-tools",
    example: "orchestrator({ steps: ['research', 'draft', 'review'] })",
  },
  {
    name: "platform_health",
    desc: "Check platform service health",
    category: "platform",
    example: "platform_health({})",
  },
  {
    name: "store_app_rate",
    desc: "Rate and review store apps",
    category: "store",
    example: "store_app_rate({ appSlug: 'codegen', rating: 5, body: 'Amazing!' })",
  },
  {
    name: "byok_store_key",
    desc: "Store your own AI provider API key",
    category: "byok",
    example: "byok_store_key({ provider: 'anthropic', key: 'sk-...' })",
  },
  {
    name: "billing_list_plans",
    desc: "Compare subscription plans",
    category: "billing",
    example: "billing_list_plans({})",
  },
  {
    name: "marketplace_search",
    desc: "Search community-built tools",
    category: "marketplace",
    example: "marketplace_search({ query: 'code review' })",
  },
  {
    name: "get_balance",
    desc: "Check your credit balance",
    category: "billing",
    example: "get_balance({})",
  },
  {
    name: "sandbox_run",
    desc: "Execute code in a sandboxed environment",
    category: "development",
    example: "sandbox_run({ code: 'console.log(2+2)', language: 'javascript' })",
  },
  {
    name: "chat_send",
    desc: "Send messages via Spike Chat",
    category: "communication",
    example: "chat_send({ message: 'Hello!' })",
  },
  {
    name: "req_interview",
    desc: "Run requirements interviews",
    category: "product",
    example: "req_interview({ project: 'New feature X' })",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the UTC day-of-year (1-based) for the given timestamp.
 * Uses only integer arithmetic so behaviour is identical on all runtimes.
 */
function utcDayOfYear(nowMs: number): number {
  const d = new Date(nowMs);
  const startOfYear = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((nowMs - startOfYear) / 86_400_000);
}

function pickTool(dayOffset: number, nowMs: number): FeaturedTool {
  const day = utcDayOfYear(nowMs) + dayOffset;
  const index = ((day % FEATURED_TOOLS.length) + FEATURED_TOOLS.length) % FEATURED_TOOLS.length;
  return FEATURED_TOOLS[index]!;
}

function formatToolSection(label: string, tool: FeaturedTool, verbose: boolean): string {
  const lines: string[] = [];
  lines.push(`## ${label}`);
  lines.push(`**${tool.name}** — ${tool.desc}`);
  lines.push(`Category: \`${tool.category}\``);
  if (verbose) {
    lines.push("");
    lines.push("**Usage example:**");
    lines.push("```");
    lines.push(tool.example);
    lines.push("```");
  }
  return lines.join("\n");
}

// ─── Registration ─────────────────────────────────────────────────────────────

export function registerToolOfTheDayTools(
  registry: ToolRegistryAdapter,
  userId: string,
  db: DrizzleDB,
): void {
  const t = freeTool(userId, db);

  registry.registerBuilt(
    t
      .tool(
        "tool_of_the_day",
        "Returns today's featured tool from the spike.land catalog. " +
          "The selection rotates deterministically by UTC calendar day so every " +
          "caller sees the same tool on a given day. Also shows a brief preview " +
          "of yesterday's tool and tomorrow's tool by name.",
        {
          date_override: z
            .string()
            .optional()
            .describe(
              "ISO 8601 date string (e.g. '2025-06-15') to simulate a specific day. " +
                "Useful for testing or curiosity. Defaults to the current UTC date.",
            ),
        },
      )
      .meta({ category: "store", tier: "free" })
      .examples([
        {
          name: "today",
          input: {},
          description: "Get today's featured tool",
        },
        {
          name: "specific_date",
          input: { date_override: "2025-01-01" },
          description: "See which tool is featured on New Year's Day 2025",
        },
      ])
      .handler(async ({ input }) => {
        const nowMs = input.date_override ? new Date(input.date_override).getTime() : Date.now();

        if (input.date_override && isNaN(nowMs)) {
          return textResult(
            `Invalid date_override: "${input.date_override}". Use ISO 8601 format, e.g. "2025-06-15".`,
          );
        }

        const today = pickTool(0, nowMs);
        const yesterday = pickTool(-1, nowMs);
        const tomorrow = pickTool(1, nowMs);

        const utcDate = new Date(nowMs).toISOString().slice(0, 10);

        const lines: string[] = [];
        lines.push(`# Tool of the Day — ${utcDate}`);
        lines.push("");
        lines.push(formatToolSection("Today's Featured Tool", today, true));
        lines.push("");
        lines.push("---");
        lines.push("");
        lines.push(formatToolSection("Yesterday's Tool", yesterday, false));
        lines.push("");
        lines.push("---");
        lines.push("");
        lines.push("## Tomorrow's Preview");
        lines.push(`**${tomorrow.name}** _(${tomorrow.category})_`);
        lines.push("");
        lines.push(
          `_Showing tool ${(((utcDayOfYear(nowMs) % FEATURED_TOOLS.length) + FEATURED_TOOLS.length) % FEATURED_TOOLS.length) + 1} of ${FEATURED_TOOLS.length} in the featured rotation._`,
        );

        return textResult(lines.join("\n"));
      }),
  );
}
