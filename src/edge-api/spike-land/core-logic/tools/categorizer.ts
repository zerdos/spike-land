/**
 * Code Categorizer MCP Tool
 *
 * Analyzes code imports to suggest the appropriate package category
 * and subdirectory based on the monorepo reorganization rules.
 */

import { z } from "zod";
import type { ToolRegistryAdapter } from "../../lazy-imports/types";
import { freeTool } from "../../lazy-imports/procedures-index.ts";
import type { DrizzleDB } from "../../db/db/db-index.ts";

const IMPORT_PATTERNS = [
  /import\s+(?:[\w*{}\s,]+)\s+from\s+["']([^"']+)["']/g,
  /import\(\s*["']([^"']+)["']\s*\)/g,
  /export\s+(?:[\w*{}\s,]+)\s+from\s+["']([^"']+)["']/g,
  /import\s+type\s+(?:[\w*{}\s,]+)\s+from\s+["']([^"']+)["']/g,
];

function parseImports(code: string): string[] {
  const imports = new Set<string>();
  for (const pattern of IMPORT_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(code)) !== null) {
      if (match[1]) imports.add(match[1]);
    }
  }
  return Array.from(imports);
}

interface CategoryRule {
  pattern: string | RegExp;
  category: string;
  reason: string;
}

const CATEGORY_RULES: CategoryRule[] = [
  { pattern: "@modelcontextprotocol/sdk", category: "mcp-tools", reason: "Uses MCP SDK" },
  { pattern: /^react(-dom)?$/, category: "frontend", reason: "Uses React" },
  { pattern: "hono", category: "edge-api", reason: "Uses Hono framework" },
  { pattern: "remotion", category: "media", reason: "Uses Remotion" },
  { pattern: "commander", category: "cli", reason: "Uses Commander CLI framework" },
  { pattern: "@ai-sdk/anthropic", category: "edge-api", reason: "Uses AI SDK (Anthropic)" },
  { pattern: "@ai-sdk/google", category: "edge-api", reason: "Uses AI SDK (Google)" },
  { pattern: "@anthropic-ai/sdk", category: "edge-api", reason: "Uses Anthropic SDK" },
  { pattern: "replicate", category: "edge-api", reason: "Uses Replicate AI" },
  { pattern: "playwright", category: "core", reason: "Uses Playwright (testing)" },
  { pattern: "@playwright/test", category: "core", reason: "Uses Playwright (testing)" },
];

interface SubdirRule {
  pattern: string | RegExp;
  subdir: string;
}

const SUBDIR_RULES: SubdirRule[] = [
  { pattern: /^(playwright|@playwright\/test|vitest)$/, subdir: "testing" },
  { pattern: /^(@ai-sdk\/(anthropic|google)|@anthropic-ai\/sdk)$/, subdir: "ai" },
  { pattern: /^(drizzle-orm|better-sqlite3|@cloudflare\/d1)$/, subdir: "db" },
  { pattern: "hono", subdir: "api" },
  { pattern: /^(commander|dotenv)$/, subdir: "cli" },
  { pattern: /^(react|react-dom|@radix-ui\/|lucide-react)/, subdir: "ui" },
  { pattern: /^node:/, subdir: "node-sys" },
];

function matchesPattern(imp: string, pattern: string | RegExp): boolean {
  if (typeof pattern === "string") return imp === pattern || imp.startsWith(pattern + "/");
  return pattern.test(imp);
}

function categorize(imports: string[]): {
  category: string;
  reason: string;
  matchedRule: string;
  suggestedSubdir: string;
} {
  if (imports.length === 0) {
    return {
      category: "core",
      reason: "No external dependencies",
      matchedRule: "No deps -> core (core-logic)",
      suggestedSubdir: "core-logic",
    };
  }

  for (const rule of CATEGORY_RULES) {
    for (const imp of imports) {
      if (matchesPattern(imp, rule.pattern)) {
        let suggestedSubdir = "lazy-imports";
        for (const sdRule of SUBDIR_RULES) {
          if (matchesPattern(imp, sdRule.pattern)) {
            suggestedSubdir = sdRule.subdir;
            break;
          }
        }
        return {
          category: rule.category,
          reason: rule.reason,
          matchedRule: String(rule.pattern),
          suggestedSubdir,
        };
      }
    }
  }

  return {
    category: "utilities",
    reason: "No specific category rule matched",
    matchedRule: "Fallback -> utilities",
    suggestedSubdir: "lazy-imports",
  };
}

export function registerCategorizerTools(
  registry: ToolRegistryAdapter,
  userId: string,
  db: DrizzleDB,
): void {
  const t = freeTool(userId, db);

  registry.registerBuilt(
    t
      .tool(
        "code_categorize",
        "Analyze code imports and suggest the appropriate package category and subdirectory for the spike-land-ai monorepo.",
        {
          code: z.string().min(1).describe("Source code to analyze."),
        },
      )
      .meta({ category: "codegen", tier: "free" })
      .handler(async ({ input }) => {
        const imports = parseImports(input.code);
        const { category, reason, matchedRule, suggestedSubdir } = categorize(imports);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { category, reason, matchedRule, suggestedSubdir, imports },
                null,
                2,
              ),
            },
          ],
        };
      }),
  );
}
