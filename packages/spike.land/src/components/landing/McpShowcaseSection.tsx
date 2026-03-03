"use client";

import { MCP_CATEGORIES } from "@/components/mcp/mcp-tool-registry";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import {
  ArrowRight,
  Bot,
  Code2,
  FileText,
  Layers,
  ShoppingBag,
  Trophy,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "platform-core": <Layers className="w-5 h-5" />,
  development: <Code2 className="w-5 h-5" />,
  "ai-creative": <Bot className="w-5 h-5" />,
  "content-media": <FileText className="w-5 h-5" />,
  commerce: <ShoppingBag className="w-5 h-5" />,
  games: <Trophy className="w-5 h-5" />,
};

const toolCategories = MCP_CATEGORIES.filter((c) => c.toolCount > 0)
  .sort((a, b) => b.toolCount - a.toolCount)
  .slice(0, 6)
  .map((c) => ({ id: c.id, name: c.name, toolCount: c.toolCount }));

export function McpShowcaseSection() {
  return (
    <section className="py-20">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            80+ MCP Tools
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Connect your AI agents to a curated registry of tools — from code editing
            and image generation to chess engines and app publishing. One endpoint,
            everything your agent needs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {toolCategories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-accent-foreground/20 transition-colors duration-200"
            >
              <span className="shrink-0 text-muted-foreground">
                {CATEGORY_ICONS[cat.id] ?? <Layers className="w-5 h-5" />}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat.toolCount} tools</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Button asChild variant="outline" className="gap-2 group">
            <Link href="/mcp">
              Explore All Tools
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
