import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowRight, Search, Sparkles, X, Grid3X3 } from "lucide-react";
import { useCallback, useDeferredValue, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CategoryRail, HeroShelf, StoreSection } from "../components/storefront";
import { AppCard } from "../components/store";
import { groupAppsByCategory, useApps } from "../hooks/useApps";
import type { McpAppSummary } from "../hooks/useApps";

// ---------------------------------------------------------------------------
// Search helpers
// ---------------------------------------------------------------------------

function normalizeSearchToken(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesSearch(app: McpAppSummary, query: string): boolean {
  if (!query) return true;
  const token = normalizeSearchToken(query);
  const haystack = [app.name, app.description, app.tagline, app.category, ...app.tags]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return token.split(" ").every((part) => haystack.includes(part));
}

/** Converts a display category name to the URL slug used by the category detail route. */
function categoryToSlug(category: string): string {
  return encodeURIComponent(
    category
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, ""),
  );
}

// ---------------------------------------------------------------------------
// Skeleton helpers
// ---------------------------------------------------------------------------

function HeroSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card">
      <div className="flex flex-col gap-8 p-8 md:flex-row md:items-center md:p-12">
        <div className="flex-1 space-y-6">
          <div className="rubik-panel h-6 w-28 animate-pulse rounded-full" />
          <div className="space-y-3">
            <div className="rubik-panel h-10 animate-pulse rounded-xl" />
            <div className="rubik-panel h-10 w-3/4 animate-pulse rounded-xl" />
          </div>
          <div className="rubik-panel h-11 w-28 animate-pulse rounded-full" />
        </div>
        <div className="hidden md:block">
          <div className="rubik-panel h-48 w-48 animate-pulse rounded-[2rem]" />
        </div>
      </div>
    </div>
  );
}

function HeroHeaderSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/30 bg-gradient-to-br from-card via-card to-muted/20">
      <div className="px-8 pb-10 pt-12 sm:px-12 sm:pb-12 sm:pt-16 md:px-16 md:pt-20">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <div className="rubik-panel mx-auto h-6 w-32 animate-pulse rounded-full" />
          <div className="space-y-3">
            <div className="rubik-panel mx-auto h-14 w-3/4 animate-pulse rounded-2xl" />
            <div className="rubik-panel mx-auto h-6 w-2/3 animate-pulse rounded-xl" />
          </div>
          <div className="rubik-panel mx-auto h-12 max-w-lg animate-pulse rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search input
// ---------------------------------------------------------------------------

interface StoreSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

function StoreSearchInput({ value, onChange }: StoreSearchInputProps) {
  const { t } = useTranslation("store");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = useCallback(() => {
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div className="relative flex items-center">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        aria-label={t("searchPlaceholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="h-12 w-full rounded-2xl border border-border/60 bg-background/80 pl-11 pr-10 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 backdrop-blur-sm"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label={t("searchClear")}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category pill bar (mobile + hero area)
// ---------------------------------------------------------------------------

interface CategoryPillBarProps {
  groupedApps: ReturnType<typeof groupAppsByCategory>;
  activeCategory: string | null;
  isDiscover: boolean;
  onSelectCategory: (category: string | null) => void;
  isLoading?: boolean;
}

function CategoryPillBar({
  groupedApps,
  activeCategory,
  isDiscover,
  onSelectCategory,
  isLoading = false,
}: CategoryPillBarProps) {
  const { t } = useTranslation("store");
  const pillRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusIndex = useCallback(
    (index: number) => {
      const total = 1 + groupedApps.length;
      const clamped = (index + total) % total;
      pillRefs.current[clamped]?.focus();
    },
    [groupedApps.length],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        focusIndex(currentIndex + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        focusIndex(currentIndex - 1);
      }
    },
    [focusIndex],
  );

  if (isLoading) {
    return (
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-2" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items have no stable identity
            <div key={i} className="rubik-panel h-9 w-24 shrink-0 animate-pulse rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div role="group" aria-label={t("categoryRailLabel")} className="flex gap-2">
        <button
          ref={(el) => {
            pillRefs.current[0] = el;
          }}
          type="button"
          aria-selected={isDiscover}
          onClick={() => onSelectCategory(null)}
          onKeyDown={(e) => handleKeyDown(e, 0)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150 ${
            isDiscover
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground"
          }`}
        >
          {t("discover")}
        </button>
        {groupedApps.map((group, i) => (
          <button
            key={group.category}
            ref={(el) => {
              pillRefs.current[i + 1] = el;
            }}
            type="button"
            aria-selected={activeCategory === group.category}
            onClick={() => onSelectCategory(group.category)}
            onKeyDown={(e) => handleKeyDown(e, i + 1)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150 ${
              activeCategory === group.category
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            {group.category}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search results section
// ---------------------------------------------------------------------------

interface SearchResultsProps {
  apps: McpAppSummary[];
  query: string;
  onClearSearch: () => void;
}

function SearchResults({ apps, query, onClearSearch }: SearchResultsProps) {
  const { t } = useTranslation("store");

  if (apps.length === 0) {
    return (
      <div className="rubik-panel flex flex-col items-center gap-4 border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">{t("searchNoResults")}</p>
        <button
          type="button"
          onClick={onClearSearch}
          className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          {t("searchNoResultsCta")}
        </button>
      </div>
    );
  }

  const countKey = apps.length === 1 ? "searchResultsCount" : "searchResultsCount_other";
  const countLabel = t(countKey, { count: apps.length });

  return (
    <section className="space-y-4 pt-2" aria-live="polite" aria-atomic="true">
      <div className="flex items-end justify-between border-b border-border/40 pb-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            &ldquo;{query}&rdquo;
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{countLabel}</p>
        </div>
        <button
          type="button"
          onClick={onClearSearch}
          className="text-sm font-bold text-primary transition-colors hover:text-primary/80"
        >
          {t("searchClear")}
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => (
          <AppCard key={app.slug} app={app} layout="grid" />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// StorePage hero header section
// ---------------------------------------------------------------------------

interface StoreHeroHeaderProps {
  appsCount: number;
  categoriesCount: number;
  searchInput: string;
  onSearchChange: (value: string) => void;
}

function StoreHeroHeader({
  appsCount,
  categoriesCount,
  searchInput,
  onSearchChange,
}: StoreHeroHeaderProps) {
  const { t } = useTranslation("store");

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/30 bg-gradient-to-br from-card via-card to-muted/20">
      {/* Subtle background decoration */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-transparent" />
      <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/4 blur-3xl" />

      <div className="relative px-8 pb-10 pt-12 sm:px-12 sm:pb-12 sm:pt-16 md:px-16 md:pt-20">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t("appStore")}
          </div>

          {/* Heading + subtitle */}
          <div className="space-y-3">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {t("heroSubtitle")}
            </p>
          </div>

          {/* Search bar — centered, prominent */}
          <div className="mx-auto max-w-lg pt-2">
            <StoreSearchInput value={searchInput} onChange={onSearchChange} />
          </div>

          {/* Stats chips */}
          <div className="flex items-center justify-center gap-3 flex-wrap pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Grid3X3 className="size-3" />
              {t("appsCount", { count: appsCount })}
            </span>
            <span className="inline-flex items-center rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
              {t("categoriesCount", { count: categoriesCount })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StorePage
// ---------------------------------------------------------------------------

export function StorePage() {
  const { t } = useTranslation("store");
  const search = useSearch({ strict: false }) as { category?: string };
  const navigate = useNavigate();
  const { data: apps, isLoading, isError, error } = useApps();

  const [searchInput, setSearchInput] = useState("");
  const deferredQuery = useDeferredValue(searchInput);

  const groupedApps = useMemo(() => groupAppsByCategory(apps ?? []), [apps]);
  const featuredApps = useMemo(
    () => (apps ?? []).filter((app) => app.is_featured).slice(0, 4),
    [apps],
  );
  const newestApps = useMemo(() => (apps ?? []).filter((app) => app.is_new).slice(0, 8), [apps]);
  const activeGroup = useMemo(() => {
    if (!search.category) return null;
    return groupedApps.find((group) => group.category === search.category) ?? null;
  }, [groupedApps, search.category]);
  const recommendedApps = useMemo(() => (apps ?? []).slice(3, 11), [apps]);

  const searchResults = useMemo(() => {
    if (!deferredQuery.trim()) return [];
    return (apps ?? []).filter((app) => matchesSearch(app, deferredQuery));
  }, [apps, deferredQuery]);

  const isSearching = deferredQuery.trim().length > 0;

  const selectCategory = (category: string | null) => {
    if (category === null) {
      void navigate({
        to: "/apps",
        search: (prev) => ({ ...prev, category: undefined }),
      });
    } else {
      void navigate({
        to: "/apps/category/$categorySlug",
        params: { categorySlug: categoryToSlug(category) },
      });
    }
  };

  const clearSearch = useCallback(() => {
    setSearchInput("");
  }, []);

  // ----- Loading state -----
  if (isLoading) {
    return (
      <div className="rubik-container-wide rubik-page flex flex-col gap-8 xl:flex-row">
        {/* Sidebar skeleton */}
        <aside className="hidden xl:block xl:w-64 xl:shrink-0">
          <div className="sticky top-6 space-y-4">
            <div className="rubik-panel animate-pulse p-5">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-8 w-32 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-full animate-pulse rounded bg-muted" />
            </div>
            <div className="rubik-panel p-3">
              <CategoryRail
                groups={[]}
                activeCategory={null}
                onSelectCategory={() => undefined}
                isLoading
              />
            </div>
          </div>
        </aside>

        {/* Main skeleton */}
        <main className="min-w-0 flex-1 space-y-8">
          <HeroHeaderSkeleton />
          <CategoryPillBar
            groupedApps={[]}
            activeCategory={null}
            isDiscover
            onSelectCategory={() => undefined}
            isLoading
          />
          <HeroSkeleton />
          <StoreSection
            title={t("topFreeApps")}
            subtitle={t("topFreeAppsDesc")}
            apps={[]}
            layout="list"
            isLoading
            skeletonCount={6}
          />
          <StoreSection
            title={t("newNoteworthy")}
            apps={[]}
            layout="grid"
            isLoading
            skeletonCount={3}
          />
        </main>
      </div>
    );
  }

  // ----- Error state -----
  if (isError) {
    return (
      <div className="rubik-container rubik-page rubik-stack">
        <div className="rubik-panel space-y-4 p-8 text-center">
          <p className="font-display text-lg font-semibold text-foreground">{t("loadError")}</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : t("loadError")}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }

  // ----- Empty state -----
  if (!apps || apps.length === 0) {
    return (
      <div className="rubik-container rubik-page rubik-stack">
        <div className="rubik-panel flex flex-col items-center gap-4 border-dashed p-12 text-center">
          <p className="text-muted-foreground">{t("emptyStore")}</p>
          <button
            type="button"
            onClick={() => selectCategory(null)}
            className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            {t("emptyCta")}
          </button>
        </div>
      </div>
    );
  }

  const isDiscover = activeGroup === null;

  return (
    <div className="rubik-container-wide rubik-page flex flex-col gap-8 xl:flex-row">
      {/* Sidebar — desktop only */}
      <aside className="hidden xl:block xl:w-64 xl:shrink-0">
        <div className="sticky top-6 space-y-4">
          <div className="rubik-panel p-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t("navigation")}
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
              {t("appStore")}
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {t("sidebarDescription")}
            </p>
          </div>

          <div className="rubik-panel p-3">
            <CategoryRail
              groups={groupedApps}
              activeCategory={activeGroup?.category ?? null}
              onSelectCategory={selectCategory}
            />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 space-y-8">
        {/* Hero header — full-width banner with centered search */}
        <StoreHeroHeader
          appsCount={apps.length}
          categoriesCount={groupedApps.length}
          searchInput={searchInput}
          onSearchChange={setSearchInput}
        />

        {/* Category filter pills — shown below hero, scrollable */}
        <div className="space-y-3">
          <CategoryPillBar
            groupedApps={groupedApps}
            activeCategory={activeGroup?.category ?? null}
            isDiscover={isDiscover}
            onSelectCategory={selectCategory}
          />
          {!isDiscover && activeGroup && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t("categoryBrowse", {
                  count: activeGroup.apps.length,
                  apps: activeGroup.apps.length === 1 ? t("app") : t("apps"),
                })}
              </p>
              <button
                type="button"
                onClick={() => selectCategory(null)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
              >
                {t("backToDiscover")}
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Content area */}
        {isSearching ? (
          <SearchResults apps={searchResults} query={deferredQuery} onClearSearch={clearSearch} />
        ) : isDiscover ? (
          <>
            <HeroShelf featuredApps={featuredApps.length > 0 ? featuredApps : apps.slice(0, 1)} />

            <StoreSection
              title={t("topFreeApps")}
              subtitle={t("topFreeAppsDesc")}
              apps={apps.slice(0, 9)}
              layout="list"
            />

            <StoreSection
              title={newestApps.length > 0 ? t("newNoteworthy") : t("recommended")}
              subtitle={newestApps.length > 0 ? t("newNoteworthyDesc") : t("recommendedDesc")}
              apps={newestApps.length > 0 ? newestApps : recommendedApps}
              layout="grid"
            />

            {groupedApps.slice(0, 3).map((group) => (
              <StoreSection
                key={group.category}
                title={group.category}
                subtitle={t("categorySlice", { category: group.category })}
                apps={group.apps.slice(0, 3)}
                categoryName={group.category}
                layout="grid"
                onViewAll={() =>
                  navigate({
                    to: "/apps/category/$categorySlug",
                    params: { categorySlug: categoryToSlug(group.category) },
                  })
                }
              />
            ))}
          </>
        ) : (
          <>
            {/* Category header */}
            <section className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {t("categoryView")}
                </p>
                <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                  {activeGroup.category}
                </h1>
              </div>
              <button
                type="button"
                onClick={() => selectCategory(null)}
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-primary/30 hover:text-primary"
              >
                {t("discoverCategories")}
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>

            {/* Category apps grid — 3 columns on desktop */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeGroup.apps.map((app) => (
                <AppCard
                  key={app.slug}
                  app={app}
                  categoryName={activeGroup.category}
                  layout="grid"
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
