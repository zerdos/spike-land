import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { groupAppsByCategory, useApps } from "../../hooks/useApps";
import { Sparkles } from "lucide-react";
import { useEffect, useMemo } from "react";

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Identity & Access": "Auth, profiles, permissions, and organizational control surfaces.",
  "Browser Automation": "Apps that drive browsers, inspect pages, and automate web workflows.",
  "Code & Developer Tools": "Review, build, debug, and compose developer-facing MCP capabilities.",
  "Agents & Collaboration": "Chat-native and multi-actor workflows around agents, teams, and threads.",
  "Docs & Knowledge": "Runbooks, MDX surfaces, learning flows, and knowledge-oriented apps.",
  "Analytics & Insights": "Dashboards, signals, and reporting surfaces for business and product data.",
  "Commerce & Billing": "Payments, billing operations, and marketplace-facing app families.",
  "Media & Creative": "Image, video, and other creative generation or transformation workflows.",
  "Games & Simulation": "Interactive games, engines, and simulation-oriented MCP apps.",
  "Infrastructure & Ops": "Deployment, orchestration, terminal-heavy workflows, and operational tools.",
  "Integrations & APIs": "Gateway, bridge, and API integration apps that connect external systems.",
  "General Utility": "Cross-cutting MCP apps that do not fit a more specific product family yet.",
};

export function ToolsIndexPage() {
  const search = useSearch({ strict: false }) as { category?: string };
  const navigate = useNavigate();
  const { data: apps, isLoading, isError, error } = useApps();
  const groupedApps = useMemo(() => groupAppsByCategory(apps ?? []), [apps]);
  const activeGroup = useMemo(() => {
    if (groupedApps.length === 0) return null;
    return groupedApps.find((group) => group.category === search.category) ?? groupedApps[0];
  }, [groupedApps, search.category]);

  useEffect(() => {
    if (!activeGroup || search.category === activeGroup.category) return;

    void navigate({
      search: (prev) => ({
        ...prev,
        category: activeGroup.category,
      }),
      replace: true,
    });
  }, [activeGroup, navigate, search.category]);

  const selectCategory = (category: string) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        category,
      }),
    });
  };

  if (isLoading) {
    return (
      <div className="rubik-container rubik-page flex h-64 items-center justify-center">
        <div role="status" aria-live="polite" className="text-muted-foreground animate-pulse">
          Loading apps...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rubik-container rubik-page rubik-stack">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-[-0.05em] text-foreground">MCP Apps</h1>
        </div>
        <div className="rubik-panel space-y-4 p-8 text-center">
          <p className="text-muted-foreground">Unable to load apps. Please try again later.</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
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
            MCP Apps
          </span>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-[-0.06em] text-foreground sm:text-5xl">
              Browse app families before you dive into a specific tool surface.
            </h1>
            <p className="rubik-lede">
              Each category groups stateful MCP workflows by capability so chat, terminal, docs,
              and runtime views stay legible.
            </p>
          </div>
        </div>
        <span className="rubik-chip rubik-chip-accent">
          <Sparkles className="h-3.5 w-3.5" />
          {apps?.length || 0} apps
        </span>
      </section>

      {!apps || apps.length === 0 ? (
        <div className="rubik-panel border-dashed p-12 text-center text-muted-foreground">
          No apps available at the moment.
        </div>
      ) : (
        <div className="space-y-8">
          <p className="text-sm leading-7 text-muted-foreground">
            Browse app families first. Once you pick a category, the grid below only shows the MCP
            apps inside that category.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {groupedApps.map((group) => {
              const isActive = activeGroup?.category === group.category;

              return (
                <button
                  key={group.category}
                  type="button"
                  onClick={() => selectCategory(group.category)}
                  className="rounded-[var(--radius-panel)] border p-5 text-left transition-[border-color,box-shadow] duration-200"
                  style={{
                    borderColor: isActive
                      ? "color-mix(in srgb, var(--primary-color) 45%, transparent)"
                      : "color-mix(in srgb, var(--border-color) 82%, transparent)",
                    background: isActive
                      ? "linear-gradient(180deg, color-mix(in srgb, var(--primary-color) 8%, var(--card-bg)), color-mix(in srgb, var(--card-bg) 92%, transparent))"
                      : "linear-gradient(180deg, color-mix(in srgb, var(--card-bg) 96%, transparent), color-mix(in srgb, var(--muted-bg) 58%, transparent))",
                    boxShadow: isActive ? "var(--panel-shadow-strong)" : "var(--panel-shadow)",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground">{group.category}</h2>
                    <span className="rubik-chip rubik-chip-accent px-2.5 py-1 text-[11px]">
                      {group.apps.length} app{group.apps.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {CATEGORY_DESCRIPTIONS[group.category] ??
                      "A grouped set of MCP apps built around a shared capability family."}
                  </p>
                </button>
              );
            })}
          </div>

          {activeGroup ? (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">{activeGroup.category}</h2>
                  <p className="text-sm text-muted-foreground">
                    {CATEGORY_DESCRIPTIONS[activeGroup.category] ??
                      "A grouped set of MCP apps built around a shared capability family."}
                  </p>
                </div>
                <span className="rubik-chip rubik-chip-accent px-2.5 py-1 text-[11px]">
                  Active Category
                </span>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {activeGroup.apps.map((app) => (
                  <Link
                    key={app.slug}
                    to="/apps/$appSlug"
                    params={{
                      appSlug: app.slug,
                    }}
                    className="rubik-panel group flex flex-col p-6 transition-[border-color,box-shadow] duration-200 hover:border-primary/30 hover:shadow-[var(--panel-shadow-strong)]"
                  >
                    <div className="mb-4 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted text-2xl">
                        {app.emoji || "🔧"}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold tracking-[-0.03em] text-foreground transition-colors group-hover:text-primary">
                          {app.name}
                        </h3>
                        <p className="text-xs font-medium text-muted-foreground">
                          {app.tool_count} {app.tool_count === 1 ? "tool" : "tools"}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="rubik-chip rubik-chip-accent px-2.5 py-1 text-[11px]">
                        {activeGroup.category}
                      </span>
                    </div>

                    <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                      {app.description}
                    </p>

                    <div className="mt-6 flex items-center justify-end text-sm font-semibold text-primary/80 group-hover:text-primary">
                      Launch App{" "}
                      <span
                        aria-hidden="true"
                        className="ml-1 transition-transform group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
