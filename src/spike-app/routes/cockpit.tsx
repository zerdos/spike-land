import { useEffect, useRef, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { ChatThread } from "@/components/ChatThread";
import type { Message } from "@/components/ChatThread";

const FOUNDER_EMAIL = "zoltan.erdos@spike.land";
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
    description: "Vite SPA fully replaces Next.js. Deploy to Cloudflare Pages.",
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

const KANBAN_COLS: { id: KanbanStatus; label: string; dotClass: string }[] = [
  { id: "planned", label: "Planned", dotClass: "bg-muted-foreground" },
  { id: "in-progress", label: "In Progress", dotClass: "bg-amber-500" },
  { id: "done", label: "Done", dotClass: "bg-green-500" },
];

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-muted text-muted-foreground",
};

// ── Roadmap Board ──────────────────────────────────────────────────────────

function RoadmapBoard() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {KANBAN_COLS.map((col) => {
        const items = MILESTONES.filter((m) => m.status === col.id);
        return (
          <div key={col.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${col.dotClass}`} />
              <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {items.length}
              </span>
            </div>
            <div className="space-y-2">
              {items.map((m) => (
                <div key={m.id} className="rounded-lg border border-border bg-background p-3 space-y-1.5">
                  <p className="text-sm font-medium text-foreground leading-snug">{m.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_BADGE[m.priority]}`}>
                    {m.priority}
                  </span>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">Nothing here yet.</p>
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

      const data = await res.json() as { content?: string; error?: string };
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
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col" style={{ height: "480px" }}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">AI Chat</h3>
        <button
          onClick={clearHistory}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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

// ── Dev Health ─────────────────────────────────────────────────────────────

function DevHealth() {
  const panels = [
    { label: "CI Status", value: "--", note: "Last run: --", color: "bg-muted" },
    { label: "Recent Deploys", value: "--", note: "No recent deploys", color: "bg-muted" },
    { label: "Error Rate (24h)", value: "--", note: "Will wire to /api/cockpit/health", color: "bg-muted" },
    { label: "Worker CPU p99", value: "--", note: "Cloudflare Analytics", color: "bg-muted" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {panels.map((p) => (
        <div key={p.label} className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{p.label}</p>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${p.color}`} />
            <span className="text-xl font-bold text-foreground">{p.value}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{p.note}</p>
        </div>
      ))}
    </div>
  );
}

// ── Metrics Dashboard ──────────────────────────────────────────────────────

function MetricsDashboard() {
  const metrics = [
    { label: "Total Users", value: "--", note: "Will wire to /api/cockpit/metrics" },
    { label: "Active Subscriptions", value: "--", note: "Stripe live data" },
    { label: "Tool Calls (30d)", value: "--", note: "spike-land-mcp usage" },
    { label: "MRR", value: "--", note: "Monthly recurring revenue" },
    { label: "Free Users", value: "--", note: "Users on free tier" },
    { label: "Pro Users", value: "--", note: "Users on Pro plan" },
    { label: "Business Users", value: "--", note: "Users on Business plan" },
    { label: "Churn Rate", value: "--", note: "30-day rolling" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((m) => (
        <div key={m.label} className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{m.label}</p>
          <p className="text-2xl font-bold text-foreground">{m.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{m.note}</p>
        </div>
      ))}
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

// ── Cockpit Page ───────────────────────────────────────────────────────────

export function CockpitPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  if (!user || user.email !== FOUNDER_EMAIL) {
    return <Navigate to="/" />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Founder Cockpit</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Private
        </span>
      </div>

      <Section title="Metrics Dashboard">
        <MetricsDashboard />
      </Section>

      <Section title="Dev Health">
        <DevHealth />
      </Section>

      <Section title="Roadmap Board">
        <RoadmapBoard />
      </Section>

      <Section title="AI Chat">
        <CockpitChat />
      </Section>
    </div>
  );
}
