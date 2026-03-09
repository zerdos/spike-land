import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Clock3 } from "lucide-react";
import { groupAppsByCategory, useApps, type McpAppSummary } from "../hooks/useApps";
import { cn } from "../../styling/cn";

function AppCard({ app, featured = false }: { app: McpAppSummary; featured?: boolean }) {
  const pricingLabel = app.pricing === "premium" ? "premium" : "free";

  return (
    <div
      className={cn(
        "rubik-panel h-full p-5 transition-[border-color,box-shadow] duration-200 hover:border-primary/26 hover:shadow-[var(--panel-shadow-strong)]",
        featured && "border-primary/24 shadow-[var(--panel-shadow-strong)]",
      )}
    >
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted text-2xl">
              {app.emoji || "🔧"}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold leading-tight tracking-[-0.03em] text-foreground transition-colors group-hover:text-primary">
                {app.name}
              </h3>
              {app.tagline && (
                <p className="mt-2 text-sm font-medium text-foreground/80">{app.tagline}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {app.is_new && (
              <span className="rubik-chip border-success/20 bg-success/70 px-2 py-1 text-[10px] text-success-foreground">
                new
              </span>
            )}
            <span className="rubik-chip rubik-chip-accent px-2 py-1 text-[10px]">
              {pricingLabel}
            </span>
          </div>
        </div>

        {app.description && (
          <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">
            {app.description}
          </p>
        )}

        <div className="mt-auto space-y-4">
          <div className="rubik-divider" />
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-muted px-2.5 py-1 font-medium text-muted-foreground">
              {app.category}
            </span>
            <span>{app.tool_count} {app.tool_count === 1 ? "tool" : "tools"}</span>
            {app.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded-full border border-border px-2.5 py-1">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StorePage() {
  const { data: apps, isLoading, isError, error } = useApps();
  const search = "";

  const filteredData = useMemo(() => {
    if (!apps) {
      return { featured: [], newest: [], categories: [], total: 0 };
    }
    const q = search.trim().toLowerCase();
    const filteredApps = q
      ? apps.filter((app) =>
          [app.name, app.description, app.tagline, app.category, ...app.tags]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(q)),
        )
      : apps;

    const grouped = groupAppsByCategory(filteredApps);
    const featured = filteredApps.filter((app) => app.is_featured);
    const newest = filteredApps.filter((app) => app.is_new).slice(0, 6);

    return {
      featured: featured.length > 0 ? featured : filteredApps.slice(0, 6),
      newest,
      categories: grouped,
      total: filteredApps.length,
    };
  }, [apps, search]);

  if (isLoading) {
    return (
      <div className="rubik-container rubik-page rubik-stack">
        <h1 className="text-3xl font-semibold tracking-[-0.05em] text-foreground">App Store</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-[var(--radius-panel)] border border-border bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rubik-container rubik-page rubik-stack">
        <h1 className="text-3xl font-semibold tracking-[-0.05em] text-foreground">App Store</h1>
        <div className="rubik-panel space-y-4 p-8 text-center">
          <p className="text-muted-foreground">
            We couldn't load the app catalog right now. This might be a temporary issue.
          </p>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rubik-container rubik-page rubik-stack">
      <section className="rubik-panel-strong flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <span className="rubik-eyebrow">
            <Sparkles className="h-3.5 w-3.5" />
            App Store
          </span>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-[-0.06em] text-foreground sm:text-5xl">
              Browse product-shaped MCP apps, not disconnected tool listings.
            </h1>
            <p className="rubik-lede">
              Discover public app surfaces, compare capability families, and jump straight into
              the package or runtime view that matters.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <span className="rubik-chip rubik-chip-accent">{filteredData.total} apps</span>
          <span className="rubik-chip">chat • terminal • docs • runtime</span>
        </div>
      </section>

      {filteredData.featured.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">
              Featured Apps
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredData.featured.map((app) => (
              <Link
                key={app.slug}
                to="/apps/$appSlug"
                params={{ appSlug: app.slug }}
                className="group block"
              >
                <AppCard app={app} featured />
              </Link>
            ))}
          </div>
        </section>
      )}

      {filteredData.newest.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">
              New This Week
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredData.newest.map((app) => (
              <Link
                key={app.slug}
                to="/apps/$appSlug"
                params={{ appSlug: app.slug }}
                className="group block"
              >
                <AppCard app={app} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {filteredData.categories.map((group) => (
        <section key={group.category} className="space-y-4">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">
            {group.category}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.apps.map((app) => (
              <Link
                key={app.slug}
                to="/apps/$appSlug"
                params={{ appSlug: app.slug }}
                className="group block"
              >
                <AppCard app={app} />
              </Link>
            ))}
          </div>
        </section>
      ))}

      {filteredData.featured.length === 0 && filteredData.categories.length === 0 && (
        <div className="rubik-panel border-dashed p-12 text-center text-muted-foreground">
          No apps found in the public catalog.
        </div>
      )}
    </div>
  );
}
