/**
 * LearnIt Index Page
 *
 * Knowledge hub landing with:
 * - Clean hero with large "Learn anything" heading
 * - Prominent search bar with autocomplete
 * - Category cards in a generous grid
 * - Popular topic pills
 * - Recently Viewed section (localStorage)
 */

import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { Search, ArrowRight } from "lucide-react";
import { useProgress } from "../../components/learnit/useProgress";

// ─── Static Data ──────────────────────────────────────────────────────────────

interface Category {
  id: string;
  label: string;
  icon: string;
  description: string;
  topicCount: number;
  difficulty: string;
  accent: string;
}

const CATEGORIES: Category[] = [
  {
    id: "web-dev",
    label: "Web Development",
    icon: "🌐",
    description: "Frontend, backend, APIs, and browser technologies",
    topicCount: 48,
    difficulty: "Beginner – Advanced",
    accent: "bg-blue-500/8 border-blue-500/14 hover:border-blue-500/30",
  },
  {
    id: "ai-ml",
    label: "AI & Machine Learning",
    icon: "🤖",
    description: "LLMs, transformers, RAG pipelines, and the MCP protocol",
    topicCount: 36,
    difficulty: "Intermediate – Expert",
    accent: "bg-violet-500/8 border-violet-500/14 hover:border-violet-500/30",
  },
  {
    id: "cloud",
    label: "Cloud & Edge",
    icon: "☁️",
    description: "Edge computing, Cloudflare Workers, serverless patterns",
    topicCount: 32,
    difficulty: "Intermediate – Advanced",
    accent: "bg-sky-500/8 border-sky-500/14 hover:border-sky-500/30",
  },
  {
    id: "devops",
    label: "DevOps",
    icon: "🔧",
    description: "CI/CD, Docker, Kubernetes, and observability",
    topicCount: 28,
    difficulty: "Intermediate – Expert",
    accent: "bg-orange-500/8 border-orange-500/14 hover:border-orange-500/30",
  },
  {
    id: "mobile",
    label: "Mobile",
    icon: "📱",
    description: "React Native, PWA, iOS, Android, and performance",
    topicCount: 24,
    difficulty: "Beginner – Advanced",
    accent: "bg-green-500/8 border-green-500/14 hover:border-green-500/30",
  },
  {
    id: "data",
    label: "Data",
    icon: "📊",
    description: "Databases, pipelines, analytics, and warehousing",
    topicCount: 30,
    difficulty: "Beginner – Advanced",
    accent: "bg-amber-500/8 border-amber-500/14 hover:border-amber-500/30",
  },
  {
    id: "security",
    label: "Security",
    icon: "🔒",
    description: "OAuth, JWT, API security, and zero-trust architecture",
    topicCount: 22,
    difficulty: "Intermediate – Expert",
    accent: "bg-rose-500/8 border-rose-500/14 hover:border-rose-500/30",
  },
  {
    id: "design",
    label: "Design",
    icon: "🎨",
    description: "Design systems, Figma, UX research, and accessibility",
    topicCount: 20,
    difficulty: "Beginner – Advanced",
    accent: "bg-fuchsia-500/8 border-fuchsia-500/14 hover:border-fuchsia-500/30",
  },
];

const POPULAR_TOPICS = [
  { label: "TypeScript", slug: "typescript" },
  { label: "React Hooks", slug: "react-hooks" },
  { label: "GraphQL", slug: "graphql" },
  { label: "Docker", slug: "docker" },
  { label: "Kubernetes", slug: "kubernetes" },
  { label: "WebAssembly", slug: "webassembly" },
  { label: "Rust", slug: "rust" },
  { label: "LLMs", slug: "llms" },
  { label: "MCP Protocol", slug: "mcp-protocol" },
  { label: "Edge Computing", slug: "edge-computing" },
  { label: "WebSockets", slug: "websockets" },
  { label: "OAuth 2.0", slug: "oauth-2" },
] as const;

const AUTOCOMPLETE_SUGGESTIONS = [
  "TypeScript generics",
  "React Server Components",
  "WebAssembly fundamentals",
  "Kubernetes networking",
  "JWT authentication",
  "GraphQL subscriptions",
  "Docker multi-stage builds",
  "LLM fine-tuning",
  "MCP protocol specification",
  "Edge computing patterns",
  "CSS Grid layout",
  "Service Workers API",
  "Rust ownership model",
  "SQL window functions",
  "OAuth 2.0 flows",
  "React Hooks best practices",
  "Cloudflare Workers",
  "Prompt engineering",
  "RAG architecture",
  "Zero-trust security",
];

const RECENTLY_VIEWED_KEY = "learnit-recently-viewed-v1";

interface RecentTopic {
  slug: string;
  label: string;
  viewedAt: number;
}

function loadRecentlyViewed(): RecentTopic[] {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentTopic[];
  } catch {
    return [];
  }
}

// ─── Category Card ─────────────────────────────────────────────────────────────

function CategoryCard({ category, progress }: { category: Category; progress: number }) {
  return (
    <Link
      to="/learnit/$topic"
      params={{ topic: category.id }}
      className={`group flex flex-col gap-4 rounded-2xl border p-6 transition-all duration-300 hover:shadow-[var(--panel-shadow-strong)] hover:-translate-y-0.5 ${category.accent}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-2xl leading-none" aria-hidden="true">
          {category.icon}
        </span>
        {progress > 0 && (
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-primary">
            {progress}%
          </span>
        )}
      </div>

      <div className="flex-1 space-y-1.5">
        <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
          {category.label}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {category.description}
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">{category.topicCount} topics</span>
        <span>{category.difficulty}</span>
      </div>

      {progress > 0 && (
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-border/50">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progress}% complete`}
          />
        </div>
      )}
    </Link>
  );
}

// ─── Search Bar ────────────────────────────────────────────────────────────────

function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const filterSuggestions = useCallback((value: string) => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    const lower = value.toLowerCase();
    const filtered = AUTOCOMPLETE_SUGGESTIONS.filter((s) => s.toLowerCase().includes(lower)).slice(
      0,
      6,
    );
    setSuggestions(filtered);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setFocusedIndex(-1);
    filterSuggestions(value);
    setShowSuggestions(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setFocusedIndex(-1);
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      const suggestion = suggestions[focusedIndex];
      if (suggestion) {
        setQuery(suggestion);
        setShowSuggestions(false);
      }
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const searchSlug = query.trim().toLowerCase().replace(/\s+/g, "-") || "getting-started";

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          {/* Search icon inside input */}
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => query.trim() && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search any topic…"
            aria-label="Search topics"
            aria-autocomplete="list"
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-activedescendant={focusedIndex >= 0 ? `suggestion-${focusedIndex}` : undefined}
            aria-controls="autocomplete-list"
            className="w-full rounded-2xl border border-border bg-card py-3.5 pl-11 pr-4 text-base text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />

          {showSuggestions && suggestions.length > 0 && (
            <ul
              id="autocomplete-list"
              role="listbox"
              aria-label="Topic suggestions"
              className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--panel-shadow-strong)]"
            >
              {suggestions.map((suggestion, i) => (
                <li
                  key={suggestion}
                  id={`suggestion-${i}`}
                  role="option"
                  aria-selected={i === focusedIndex}
                  className={`cursor-pointer px-4 py-3 text-sm transition-colors ${
                    i === focusedIndex
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                  onMouseDown={() => selectSuggestion(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          to="/learnit/$topic"
          params={{ topic: searchSlug }}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-[var(--panel-shadow-strong)] active:scale-[0.98]"
        >
          Search
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function LearnitIndexPage() {
  const { getCategoryProgress, totalCompleted } = useProgress();
  const [recentlyViewed, setRecentlyViewed] = useState<RecentTopic[]>([]);

  useEffect(() => {
    setRecentlyViewed(loadRecentlyViewed());
  }, []);

  return (
    <div className="rubik-container rubik-page">
      <div className="rubik-stack">
        {/* ── Hero ── */}
        <section className="mx-auto max-w-3xl space-y-8 pt-8 text-center">
          <div className="rubik-eyebrow mx-auto border-primary/14 bg-primary/8 text-primary">
            Knowledge Hub
          </div>

          <h1 className="tracking-tight text-foreground">Learn anything.</h1>

          <p className="rubik-lede mx-auto text-center text-xl leading-relaxed">
            An AI-powered wiki that explains any topic at exactly the depth you need. Search below
            or browse by category.
          </p>

          {totalCompleted > 0 && (
            <p className="text-sm font-semibold text-primary">
              {totalCompleted} topic{totalCompleted !== 1 ? "s" : ""} completed
            </p>
          )}
        </section>

        {/* ── Search ── */}
        <div className="mx-auto w-full max-w-2xl">
          <SearchBar />
        </div>

        {/* ── Categories ── */}
        <section aria-labelledby="categories-heading" className="space-y-8">
          <div className="flex items-baseline justify-between">
            <h2 id="categories-heading" className="text-fluid-h3 text-foreground">
              Browse by category
            </h2>
            <span className="text-sm text-muted-foreground">{CATEGORIES.length} categories</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <CategoryCard key={cat.id} category={cat} progress={getCategoryProgress(cat.id)} />
            ))}
          </div>
        </section>

        {/* ── Popular Topics ── */}
        <section aria-labelledby="popular-heading" className="space-y-8">
          <h2 id="popular-heading" className="text-fluid-h3 text-foreground">
            Popular topics
          </h2>

          <div className="flex flex-wrap gap-3">
            {POPULAR_TOPICS.map((topic) => (
              <Link
                key={topic.slug}
                to="/learnit/$topic"
                params={{ topic: topic.slug }}
                className="inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow-sm"
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.6rem] font-bold text-primary"
                  aria-hidden="true"
                >
                  {topic.label.charAt(0)}
                </span>
                {topic.label}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Recently Viewed ── */}
        {recentlyViewed.length > 0 && (
          <section aria-labelledby="recent-heading" className="space-y-8">
            <h2 id="recent-heading" className="text-fluid-h3 text-foreground">
              Recently viewed
            </h2>

            <div className="flex flex-wrap gap-3">
              {recentlyViewed.map((topic) => (
                <Link
                  key={topic.slug}
                  to="/learnit/$topic"
                  params={{ topic: topic.slug }}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:text-foreground"
                >
                  <span className="text-xs text-muted-foreground/60" aria-hidden="true">
                    ↩
                  </span>
                  {topic.label}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
