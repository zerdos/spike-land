import { Link } from "@tanstack/react-router";
import { type AppStatus, StatusBadge } from "./StatusBadge";
import {
  Clock,
  User,
  Package,
  Zap,
  Boxes,
  Gamepad2,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "../../styling/cn";

interface AppCardProps {
  id: string;
  name: string;
  description?: string;
  category?: "mcp" | "utility" | "game" | "tool" | "social" | "other";
  status: AppStatus;
  ownerName?: string;
  createdAt?: string;
  toolCount?: number;
}

const CATEGORY_CONFIG = {
  mcp: {
    label: "MCP",
    pill: "border border-primary/20 bg-primary/10 text-primary",
    icon: Boxes,
    emoji: "🧩",
  },
  utility: {
    label: "Utility",
    pill: "border border-border bg-muted/80 text-muted-foreground",
    icon: Package,
    emoji: "🔧",
  },
  game: {
    label: "Game",
    pill: "border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: Gamepad2,
    emoji: "🎮",
  },
  tool: {
    label: "Tool",
    pill: "border border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    icon: Zap,
    emoji: "⚡",
  },
  social: {
    label: "Social",
    pill: "border border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400",
    icon: MessageSquare,
    emoji: "💬",
  },
  other: {
    label: "Other",
    pill: "border border-border bg-muted/80 text-muted-foreground",
    icon: Package,
    emoji: "📦",
  },
};

export function AppCard({
  id,
  name,
  description,
  category = "other",
  status,
  ownerName,
  createdAt,
  toolCount,
}: AppCardProps) {
  const config = CATEGORY_CONFIG[category];

  return (
    <Link
      to="/packages/$appId"
      params={{ appId: id }}
      search={{ tab: "Overview" }}
      aria-label={`View app: ${name}`}
      className="group block h-full rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-lg"
    >
      <div className="flex h-full flex-col gap-5">
        {/* Top row: icon + status badge */}
        <div className="flex items-start justify-between gap-3">
          {/* App icon — emoji at 48 px, rounded-2xl with subtle ring */}
          <div
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-muted/40 text-2xl leading-none shadow-sm transition-transform duration-200 group-hover:scale-105"
          >
            {config.emoji}
          </div>

          {/* Status badge top-right */}
          <StatusBadge status={status} />
        </div>

        {/* Name — bold, tight tracking */}
        <h3 className="text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
          {name}
        </h3>

        {/* Description — two lines max */}
        {description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto space-y-3">
          <div className="h-px w-full bg-border/40" />

          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              {/* Category pill */}
              <span
                className={cn(
                  "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5",
                  "text-[10px] font-semibold uppercase tracking-widest",
                  config.pill,
                )}
              >
                <config.icon className="size-2.5" aria-hidden="true" />
                {config.label}
              </span>

              {/* Secondary metadata: tools · owner · date */}
              <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-medium text-muted-foreground">
                {toolCount !== undefined && toolCount > 0 && (
                  <span className="flex items-center gap-1" title={`${toolCount} tools available`}>
                    <Package className="size-3" aria-hidden="true" />
                    {toolCount} {toolCount === 1 ? "tool" : "tools"}
                  </span>
                )}
                {ownerName && (
                  <span className="flex items-center gap-1">
                    <User className="size-3" aria-hidden="true" />
                    <span className="max-w-[96px] truncate">{ownerName}</span>
                  </span>
                )}
                {createdAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" aria-hidden="true" />
                    {new Date(createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Arrow button — fades in on hover */}
            <div
              aria-hidden="true"
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                "border border-border/60 bg-background text-muted-foreground",
                "opacity-0 transition-all duration-200",
                "group-hover:opacity-100 group-hover:border-primary/30 group-hover:text-primary",
              )}
            >
              <ArrowUpRight className="size-3.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export type { AppCardProps };
