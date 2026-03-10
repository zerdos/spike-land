import { useParams } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

const ToolSurface = lazy(() =>
  import("../../components/tool-surface/ToolSurface").then((m) => ({
    default: m.ToolSurface,
  })),
);

export function ToolSurfacePage() {
  const { toolName } = useParams({ strict: false });

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/apps"
          className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          title="Back to Apps"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Tool Surface</h1>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <ToolSurface toolName={toolName ?? ""} defaultExpanded />
      </Suspense>
    </div>
  );
}
