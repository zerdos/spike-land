import type { ReactNode } from "react";
import { HelpCircle, Pencil, Settings, Circle, Square, X } from "lucide-react";

type AppStatus = "prompting" | "drafting" | "building" | "live" | "archived" | "deleted";

const statusConfig: Record<AppStatus, { color: string; icon: ReactNode }> = {
  prompting: {
    color: "border border-warning/20 bg-warning/70 text-warning-foreground",
    icon: <HelpCircle className="size-3" />,
  },
  drafting: {
    color: "border border-info/20 bg-info/70 text-info-foreground",
    icon: <Pencil className="size-3" />,
  },
  building: {
    color: "border border-warning/20 bg-warning/70 text-warning-foreground",
    icon: <Settings className="size-3 animate-spin-slow" />,
  },
  live: {
    color: "border border-success/20 bg-success/70 text-success-foreground",
    icon: <Circle className="size-3 fill-current" />,
  },
  archived: {
    color: "border border-border bg-muted/80 text-muted-foreground",
    icon: <Square className="size-3" />,
  },
  deleted: {
    color: "border border-destructive/20 bg-destructive/70 text-destructive-foreground",
    icon: <X className="size-3" />,
  },
};

interface StatusBadgeProps {
  status: AppStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.drafting;
  return (
    <span
      role="status"
      aria-label={`Status: ${status}`}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] transition-colors ${config.color}`}
    >
      {config.icon}
      <span className="capitalize">{status}</span>
    </span>
  );
}

export type { AppStatus };
