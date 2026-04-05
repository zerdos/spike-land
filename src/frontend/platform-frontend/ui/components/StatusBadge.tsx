import type { ReactNode } from "react";
import { HelpCircle, Pencil, Settings, Circle, Square, X } from "lucide-react";

type AppStatus = "prompting" | "drafting" | "building" | "live" | "archived" | "deleted";

const statusConfig: Record<AppStatus, { color: string; icon: ReactNode }> = {
  prompting: {
    color:
      "border border-amber-200/60 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400",
    icon: <HelpCircle className="size-3" />,
  },
  drafting: {
    color:
      "border border-sky-200/60 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-400",
    icon: <Pencil className="size-3" />,
  },
  building: {
    color:
      "border border-orange-200/60 bg-orange-50 text-orange-700 dark:border-orange-500/25 dark:bg-orange-500/10 dark:text-orange-400",
    icon: <Settings className="size-3 animate-spin-slow" />,
  },
  live: {
    color:
      "border border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400",
    icon: <Circle className="size-3 fill-current" />,
  },
  archived: {
    color:
      "border border-zinc-200/80 bg-zinc-50 text-zinc-500 dark:border-zinc-600/40 dark:bg-zinc-800/40 dark:text-zinc-400",
    icon: <Square className="size-3" />,
  },
  deleted: {
    color:
      "border border-red-200/60 bg-red-50 text-red-600 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400",
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-[0.04em] shadow-sm transition-colors ${config.color}`}
    >
      {config.icon}
      <span className="capitalize">{status}</span>
    </span>
  );
}

export type { AppStatus };
