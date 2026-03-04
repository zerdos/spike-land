import { Link } from "@tanstack/react-router";
import { type AppStatus, StatusBadge } from "./StatusBadge";

interface AppCardProps {
  id: string;
  name: string;
  description?: string;
  category?: string;
  status: AppStatus;
  ownerName?: string;
  createdAt?: string;
  toolCount?: number;
}

const categoryColors: Record<string, string> = {
  mcp: "bg-cyan-100 text-cyan-700",
  utility: "bg-purple-100 text-purple-700",
  game: "bg-pink-100 text-pink-700",
  tool: "bg-indigo-100 text-indigo-700",
  social: "bg-teal-100 text-teal-700",
  other: "bg-gray-100 text-gray-600",
};

export function AppCard({
  id,
  name,
  description,
  category,
  status,
  ownerName,
  createdAt,
  toolCount,
}: AppCardProps) {
  return (
    <Link
      to="/apps/$appId"
      params={{ appId: id }}
      search={{ tab: "Overview" }}
      className="block rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold leading-tight">{name}</h3>
          <span className="inline-flex items-center rounded bg-cyan-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-600">
            MCP
          </span>
        </div>
        <StatusBadge status={status} />
      </div>
      {description && <p className="mt-2 line-clamp-2 text-sm text-gray-500">{description}</p>}
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
        {category && (
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${
              categoryColors[category] ?? categoryColors.other
            }`}
          >
            {category}
          </span>
        )}
        {toolCount !== undefined && toolCount > 0 && (
          <span className="text-gray-500">{toolCount} tool{toolCount === 1 ? "" : "s"}</span>
        )}
        {ownerName && <span>{ownerName}</span>}
        {createdAt && (
          <>
            <span>&middot;</span>
            <span>{new Date(createdAt).toLocaleDateString()}</span>
          </>
        )}
      </div>
    </Link>
  );
}

export type { AppCardProps };
