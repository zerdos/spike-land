import { useEffect, useRef, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { ChatThread } from "../components/ChatThread";
import { apiUrl } from "../../core-logic/api";
import type { Message } from "../components/ChatThread";

const ADMIN_EMAILS = new Set(["hello@spike.land"]);
const CHAT_STORAGE_KEY = "cockpit_chat_history";

// ── Types ──────────────────────────────────────────────────────────────────

type KanbanStatus = "planned" | "in-progress" | "done";

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: KanbanStatus;
  priority: "high" | "medium" | "low";
}

// ── Static roadmap data ────────────────────────────────────────────────────

const MILESTONES: Milestone[] = [
  {
    id: "m1",
    title: "Stripe billing integration",
    description: "Pro $29/mo, Business $99/mo. Checkout, webhooks, invoice.paid.",
    status: "in-progress",
    priority: "high",
  },
  {
    id: "m2",
    title: "Onboarding flow",
    description: "Welcome modal (3 steps), interests selection, tool suggestions.",
    status: "in-progress",
    priority: "high",
  },
  {
    id: "m3",
    title: "MCP registry v2",
    description: "Tool versioning, categories, search, install counts, ratings.",
    status: "planned",
    priority: "high",
  },
  {
    id: "m4",
    title: "Marketplace revenue share",
    description: "price_cents on tools, tool_purchases table, paid install flow.",
    status: "planned",
    priority: "medium",
  },
  {
    id: "m5",
    title: "Credit system",
    description: "D1 migration, metering middleware, balance widget, buy credits.",
    status: "planned",
    priority: "medium",
  },
  {
    id: "m6",
    title: "Auth hardening",
    description: "CSP headers, rate limiting, BYOK encryption, security audit.",
    status: "planned",
    priority: "medium",
  },
  {
    id: "m7",
    title: "Landing page v2",
    description: "New hero, social proof, pricing comparison table, CTA A/B test.",
    status: "planned",
    priority: "low",
  },
  {
    id: "m8",
    title: "spike-app launch",
    description: "Vite SPA deployed to Cloudflare Pages.",
    status: "done",
    priority: "high",
  },
  {
    id: "m9",
    title: "WhatsApp integration",
    description: "Cloud API integration — link phone, OTP flow, messaging.",
    status: "done",
    priority: "medium",
  },
  {
    id: "m10",
    title: "AWS decommission",
    description: "All AWS infra torn down. Platform runs 100% on Cloudflare.",
    status: "done",
    priority: "high",
  },
];

const KANBAN_COLS: { id: KanbanStatus; label: string; dotClass: string; headerClass: string }[] = [
  {
    id: "planned",
    label: "Planned",
    dotClass: "bg-muted-foreground",
    headerClass: "text-muted-foreground",
  },
  {
    id: "in-progress",
    label: "In Progress",
    dotClass: "bg-amber-500",
    headerClass: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "done",
    label: "Done",
    dotClass: "bg-success",
    headerClass: "text-success-foreground",
  },
];

// Priority badge uses design system semantic tokens — no raw color values
const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/20 text-warning-foreground",
  low: "bg-muted text-muted-foreground",
};

// ── Roadmap Board ──────────────────────────────────────────────────────────

function RoadmapBoard() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {KANBAN_COLS.map((col) => {
        const items = MILESTONES.filter((m) => m.status === col.id);
        return (
          <div key={col.id} className="rubik-panel p-4 space-y-3">
            <div className="flex items-center gap-2.5 pb-1">
              <span className={`h-2 w-2 rounded-full ${col.dotClass}`} />
              <h3 className={`text-xs font-bold uppercase tracking-wider ${col.headerClass}`}>
                {col.label}
              </h3>
              <span className="ml-auto rounded-full bg-muted/80 border border-border/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {items.length}
              </span>
            </div>
            <div className="space-y-2">
              {items.map((m) => (
                <div
                  key={m.id}
                  className="group rounded-xl border border-border/70 bg-background/70 p-3 space-y-2 hover:border-border transition-colors"
                >
                  <p className="text-sm font-semibold text-foreground leading-snug">{m.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${PRIORITY_BADGE[m.priority]}`}
                  >
                    {m.priority}
                  </span>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-xs text-muted-foreground/60 py-6 text-center">
                  Nothing here yet.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── AI Chat ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the AI assistant embedded in the spike.land founder cockpit.
spike.land is an AI development platform running on Cloudflare Workers with 80+ MCP tools.
Key packages: spike-app (Vite+TanStack Router), spike-edge (Hono edge API), spike-land-mcp (MCP registry),
mcp-auth (Better Auth), spike-land-backend (Durable Objects).
Help the founder with architecture decisions, product roadmap, debugging, and platform strategy.`;

function CockpitChat() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Message[]) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  async function handleSend(content: string) {
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsLoading(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/proxy/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = (await res.json()) as { content?: string; error?: string };
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.content ?? data.error ?? "No response",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        const errMsg: Message = {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: `Error: ${err.message}`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function clearHistory() {
    setMessages([]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
  }

  return (
    <div className="rubik-panel overflow-hidden flex flex-col" style={{ height: "480px" }}>
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground">AI Assistant</h3>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wide">
            Claude
          </span>
        </div>
        <button
          type="button"
          onClick={clearHistory}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
        >
          Clear history
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <ChatThread messages={messages} onSendMessage={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}

// ── Experiments Dashboard ──────────────────────────────────────────────

interface DashboardExperiment {
  id: string;
  name: string;
  dimension: string;
  status: string;
  winner: string | null;
  trafficPct: number;
  createdAt: number;
}

interface VariantMetric {
  variantId: string;
  impressions: number;
  donations: number;
  revenue: number;
  fistbumps: number;
  donateRate: number;
  revenuePerImpression: number;
  conversionRate: number;
}

interface ExperimentMetrics {
  experimentId: string;
  name: string;
  status: string;
  winner: string | null;
  variants: VariantMetric[];
}

interface EvalResult {
  ready: boolean;
  reason?: string;
  graduated?: boolean;
  winner?: string | null;
  probabilities?: Record<string, number>;
  improvement?: number;
  controlRate?: number;
  winnerRate?: number;
  runtimeHours?: number;
}

// Status badge uses design system semantic tokens
const STATUS_BADGE: Record<string, string> = {
  active: "bg-success/15 text-success-foreground",
  graduated: "bg-info/15 text-info-foreground",
  paused: "bg-warning/20 text-warning-foreground",
};

function ExperimentCard({ exp }: { exp: DashboardExperiment }) {
  const [metrics, setMetrics] = useState<ExperimentMetrics | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    fetch(apiUrl(`/experiments/${exp.id}/metrics`))
      .then((r) => r.json() as Promise<ExperimentMetrics>)
      .then(setMetrics)
      // Expected: network failure — panel stays empty until next expand
      .catch(() => {});
  }, [expanded, exp.id]);

  const runEvaluation = async () => {
    setEvaluating(true);
    try {
      const res = await fetch(apiUrl(`/experiments/${exp.id}/evaluate`), { method: "POST" });
      const data = (await res.json()) as EvalResult;
      setEvalResult(data);
    } catch {
      setEvalResult({ ready: false, reason: "Request failed" });
    } finally {
      setEvaluating(false);
    }
  };

  const runtimeDays = Math.round((Date.now() - exp.createdAt) / 86400000);

  return (
    <div className="rubik-panel overflow-hidden transition-shadow">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`shrink-0 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE[exp.status] ?? "bg-muted text-muted-foreground"}`}
          >
            {exp.status}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{exp.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {exp.dimension} &middot; {runtimeDays}d running
            </p>
          </div>
        </div>
        <svg
          className={`ml-4 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {expanded && metrics && (
        <div className="border-t border-border px-5 py-4 space-y-4 bg-muted/20">
          <div className="overflow-x-auto rounded-xl border border-border/60 bg-background">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40">
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">
                    Variant
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-muted-foreground">
                    Impressions
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-muted-foreground">
                    Donations
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Rate</th>
                  <th className="text-right py-2 px-3 font-semibold text-muted-foreground">
                    Revenue
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-muted-foreground">
                    Fistbumps
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {metrics.variants.map((v) => (
                  <tr
                    key={v.variantId}
                    className={`transition-colors ${metrics.winner === v.variantId ? "bg-success/8" : "hover:bg-muted/30"}`}
                  >
                    <td className="py-2.5 px-3 font-medium text-foreground">
                      {v.variantId}
                      {metrics.winner === v.variantId && (
                        <span className="ml-1.5 rounded-full bg-success/15 px-1.5 py-0.5 text-[9px] font-bold text-success-foreground uppercase tracking-wide">
                          winner
                        </span>
                      )}
                    </td>
                    <td className="text-right py-2.5 px-3 text-muted-foreground">
                      {v.impressions.toLocaleString()}
                    </td>
                    <td className="text-right py-2.5 px-3 text-muted-foreground">{v.donations}</td>
                    <td className="text-right py-2.5 px-3 text-muted-foreground">
                      {(v.donateRate * 100).toFixed(2)}%
                    </td>
                    <td className="text-right py-2.5 px-3 font-semibold text-foreground">
                      ${(v.revenue / 100).toFixed(2)}
                    </td>
                    <td className="text-right py-2.5 px-3 text-muted-foreground">{v.fistbumps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={runEvaluation}
              disabled={evaluating || exp.status !== "active"}
              className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
            >
              {evaluating ? "Evaluating…" : "Run evaluation"}
            </button>

            {evalResult && (
              <div className="text-xs text-muted-foreground">
                {!evalResult.ready ? (
                  <span>{evalResult.reason}</span>
                ) : evalResult.graduated ? (
                  <span className="font-semibold text-success-foreground">
                    Graduated — winner: {evalResult.winner} (+{evalResult.improvement}%)
                  </span>
                ) : (
                  <span>
                    P(best):{" "}
                    {Object.entries(evalResult.probabilities ?? {})
                      .map(([k, v]) => `${k}: ${(v * 100).toFixed(1)}%`)
                      .join(", ")}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ExperimentsDashboard() {
  const [data, setData] = useState<{
    experiments: DashboardExperiment[];
    revenue24h: number;
  } | null>(null);

  useEffect(() => {
    fetch(apiUrl("/experiments/dashboard"))
      .then((r) => r.json() as Promise<{ experiments: DashboardExperiment[]; revenue24h: number }>)
      .then(setData)
      // Expected: network failure — dashboard stays in loading spinner state
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="rubik-panel p-10 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Experiment revenue stat */}
      <div className="rubik-panel p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            24h experiment revenue
          </p>
          <p className="text-3xl font-bold text-foreground mt-1 tabular-nums">
            ${data.revenue24h.toFixed(2)}
          </p>
        </div>
        <span className="rounded-full bg-muted border border-border/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          {data.experiments.length} experiment{data.experiments.length !== 1 ? "s" : ""}
        </span>
      </div>

      {data.experiments.length === 0 ? (
        <div className="rubik-panel p-10 flex flex-col items-center justify-center gap-2">
          <p className="text-sm font-medium text-muted-foreground">No active experiments</p>
          <p className="text-xs text-muted-foreground/60 text-center max-w-xs">
            Create an experiment via the experiments API to start tracking variants.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.experiments.map((exp) => (
            <ExperimentCard key={exp.id} exp={exp} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Dev Health ─────────────────────────────────────────────────────────────

interface ErrorSummary {
  total: number;
  topCodes: Array<{ error_code: string; count: number }>;
  range: string;
}

function DevHealth() {
  const [errorSummary, setErrorSummary] = useState<ErrorSummary | null>(null);

  useEffect(() => {
    fetch("/errors/summary?range=24h")
      .then((r) => {
        if (!r.ok) return null;
        return r.json() as Promise<ErrorSummary>;
      })
      .then((data) => {
        if (data) setErrorSummary(data);
      })
      // Expected: network failure — error count badge stays hidden
      .catch(() => {});
  }, []);

  const errorCount = errorSummary?.total ?? "--";
  const errorColor = errorSummary
    ? errorSummary.total === 0
      ? "bg-success"
      : errorSummary.total < 10
        ? "bg-amber-500"
        : "bg-destructive"
    : "bg-muted-foreground/40";
  const topCode = errorSummary?.topCodes[0];
  const errorNote = topCode
    ? `Top: ${topCode.error_code} (${topCode.count})`
    : errorSummary
      ? "No errors"
      : "Loading…";

  const panels = [
    { label: "CI Status", value: "--", note: "Last run: --", color: "bg-muted-foreground/40" },
    {
      label: "Recent Deploys",
      value: "--",
      note: "No recent deploys",
      color: "bg-muted-foreground/40",
    },
    { label: "Errors (24h)", value: String(errorCount), note: errorNote, color: errorColor },
    {
      label: "Worker CPU p99",
      value: "--",
      note: "Cloudflare Analytics",
      color: "bg-muted-foreground/40",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {panels.map((p) => (
        <div key={p.label} className="rubik-panel p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            {p.label}
          </p>
          <div className="flex items-baseline gap-2.5">
            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${p.color}`} />
            <span className="text-2xl font-bold text-foreground tabular-nums">{p.value}</span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{p.note}</p>
        </div>
      ))}
    </div>
  );
}

// ── Metrics Dashboard ──────────────────────────────────────────────────────

interface CockpitMetrics {
  userCount: number;
  activeSubscriptions: number;
  toolCount: number;
  mrr: number;
  recentSignups: Array<{ id: string; email: string; created_at: string }>;
  servicePurchases: number;
  recentServicePurchases: Array<{
    service: string;
    email: string | null;
    status: string;
    created_at: number;
  }>;
}

function MetricsDashboard() {
  const [data, setData] = useState<CockpitMetrics | null>(null);

  useEffect(() => {
    fetch(apiUrl("/cockpit/metrics"))
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json() as Promise<CockpitMetrics>;
      })
      .then(setData)
      // Expected: network failure — metrics show "--" placeholders
      .catch(() => {});
  }, []);

  const fmt = (n: number) => n.toLocaleString();
  const metrics = [
    { label: "Total Users", value: data ? fmt(data.userCount) : "--", highlight: false },
    {
      label: "Active Subscriptions",
      value: data ? fmt(data.activeSubscriptions) : "--",
      highlight: false,
    },
    { label: "MCP Tools", value: data ? fmt(data.toolCount) : "--", highlight: false },
    { label: "MRR", value: data ? `$${fmt(data.mrr)}` : "--", highlight: true },
    {
      label: "Service Purchases",
      value: data ? fmt(data.servicePurchases) : "--",
      highlight: false,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={`rubik-panel p-5 ${m.highlight ? "rubik-panel-strong" : ""}`}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {m.label}
            </p>
            <p className="text-3xl font-bold text-foreground tabular-nums">{m.value}</p>
          </div>
        ))}
      </div>

      {data && data.recentSignups.length > 0 && (
        <div className="rubik-panel p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Recent signups
          </h4>
          <div className="space-y-0 divide-y divide-border/60">
            {data.recentSignups.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-foreground truncate">{u.email}</span>
                <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data && data.recentServicePurchases.length > 0 && (
        <div className="rubik-panel p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Service purchases
          </h4>
          <div className="space-y-0 divide-y divide-border/60">
            {data.recentServicePurchases.map((p, i) => (
              <div
                key={`${p.service}-${p.created_at}-${i}`}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 rounded-full bg-success/15 border border-success/20 px-2 py-0.5 text-[10px] font-bold text-success-foreground uppercase tracking-wide">
                    {p.service.replace(/_/g, " ")}
                  </span>
                  <span className="truncate text-foreground">{p.email ?? "guest"}</span>
                </div>
                <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!data && (
        <div className="rubik-panel p-10 flex flex-col items-center justify-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-border border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading metrics…</p>
        </div>
      )}
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-0.5">
        <h2 className="text-base font-bold text-foreground tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

// ── Cockpit Page ───────────────────────────────────────────────────────────

export function CockpitPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!ADMIN_EMAILS.has(user.email)) {
    return <Navigate to="/" />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-16">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 pb-2 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Founder Cockpit</h1>
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-bold text-primary uppercase tracking-wide">
              Private
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success" />
          <span className="text-xs text-muted-foreground">All systems operational</span>
        </div>
      </div>

      <Section title="Experiments" description="A/B test variants and revenue impact.">
        <ExperimentsDashboard />
      </Section>

      <Section title="Key Metrics" description="Users, subscriptions, MRR, and tool installs.">
        <MetricsDashboard />
      </Section>

      <Section title="Dev Health" description="CI, deploys, error rates, and Worker performance.">
        <DevHealth />
      </Section>

      <Section title="Roadmap" description="Product milestones by status.">
        <RoadmapBoard />
      </Section>

      <Section title="AI Assistant" description="Context-aware chat with platform knowledge.">
        <CockpitChat />
      </Section>
    </div>
  );
}
