import { useEffect, useState } from "react";

interface StoreTool {
  name: string;
  description: string;
  category?: string;
  version?: string;
  stability?: string;
}

interface StoreCategory {
  name: string;
  tools: StoreTool[];
}

interface StoreData {
  categories: StoreCategory[];
  featured: StoreTool[];
  total: number;
}

function ToolCard({ tool, featured = false }: { tool: StoreTool; featured?: boolean }) {
  const categoryColors: Record<string, string> = {
    marketplace: "bg-info text-info-foreground",
    ai: "bg-primary/10 text-primary",
    storage: "bg-success/50 text-success-foreground",
    auth: "bg-destructive/50 text-destructive-foreground",
    code: "bg-accent text-accent-foreground",
    analytics: "bg-warning/50 text-warning-foreground",
    career: "bg-secondary text-secondary-foreground",
    other: "bg-muted text-muted-foreground",
  };

  const cat = tool.category ?? "other";
  const colorClass = categoryColors[cat] ?? categoryColors.other;

  return (
    <div
      className={`rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md hover:bg-muted/50 ${featured ? "ring-1 ring-primary/20" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold leading-tight text-foreground">{tool.name}</h3>
          <span className="inline-flex items-center rounded bg-info px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-info-foreground">
            MCP
          </span>
        </div>
        {tool.stability === "stable" && (
          <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-medium text-success-foreground">
            stable
          </span>
        )}
      </div>
      {tool.description && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{tool.description}</p>
      )}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span className={`rounded-full px-2 py-0.5 font-medium ${colorClass}`}>{cat}</span>
        {tool.version && <span>v{tool.version}</span>}
      </div>
    </div>
  );
}

export function StorePage() {
  const [data, setData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/store/tools")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load store (${res.status})`);
        return res.json<StoreData>();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">MCP Tool Store</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl border border-border bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">MCP Tool Store</h1>
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">MCP Tool Store</h1>
        <span className="text-sm text-muted-foreground">{data.total} tools</span>
      </div>

      {data.featured.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Featured</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.featured.map((tool) => (
              <ToolCard key={tool.name} tool={tool} featured />
            ))}
          </div>
        </section>
      )}

      {data.categories.map((cat) => (
        <section key={cat.name} className="space-y-3">
          <h2 className="text-lg font-semibold capitalize">{cat.name}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cat.tools.map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
