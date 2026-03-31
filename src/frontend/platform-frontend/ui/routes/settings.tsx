import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { apiFetch } from "../../core-logic/api";

type TabId = "account" | "billing";

interface BillingStatus {
  plan: "free" | "pro" | "business";
  status: string;
  currentPeriodEnd?: string;
}

function SuccessBanner() {
  return (
    <div
      role="alert"
      className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-primary"
    >
      Welcome to Pro! Your subscription is now active.
    </div>
  );
}

function TabBar({ active, onChange }: { active: TabId; onChange: (tab: TabId) => void }) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-border">
      {(["account", "billing"] as TabId[]).map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === tab}
          aria-controls={`panel-${tab}`}
          id={`tab-${tab}`}
          onClick={() => onChange(tab)}
          className={`px-4 py-2.5 text-sm font-medium capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            active === tab
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );
}

function AccountTab({ onLogout }: { onLogout: () => void }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Loading account…</div>;
  }

  if (!user) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Not signed in.{" "}
        <Link to="/login" className="text-primary underline hover:text-primary/80">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name ?? "User avatar"}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground"
          >
            {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="space-y-0.5">
          {user.name && <p className="text-base font-semibold text-foreground">{user.name}</p>}
          {user.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
        </div>
      </div>

      <div className="rubik-panel p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium text-foreground">{user.name ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Email</span>
          <span className="font-medium text-foreground">{user.email ?? "—"}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="rounded-[calc(var(--radius-control)-0.1rem)] border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:border-destructive/40 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Sign out
      </button>
    </div>
  );
}

function BillingTab() {
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch("/api/billing/status")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as BillingStatus;
        if (!cancelled) setBilling(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load billing info");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleManageSubscription = useCallback(async () => {
    setPortalLoading(true);
    try {
      const res = await apiFetch("/api/billing/portal", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { url: string };
      window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">Loading billing info…</div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {error}
      </div>
    );
  }

  const planLabel = billing ? billing.plan.charAt(0).toUpperCase() + billing.plan.slice(1) : "—";

  return (
    <div className="space-y-6">
      <div className="rubik-panel p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Current plan</span>
          <span className="font-semibold text-foreground">{planLabel}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className="font-medium text-foreground capitalize">{billing?.status ?? "—"}</span>
        </div>
        {billing?.currentPeriodEnd && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Renews</span>
            <span className="font-medium text-foreground">
              {new Date(billing.currentPeriodEnd).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {billing?.plan !== "free" && (
          <button
            type="button"
            onClick={handleManageSubscription}
            disabled={portalLoading}
            className="rounded-[calc(var(--radius-control)-0.1rem)] border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/24 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {portalLoading ? "Opening…" : "Manage Subscription"}
          </button>
        )}

        {billing?.plan === "free" && (
          <Link
            to="/pricing"
            className="rounded-[calc(var(--radius-control)-0.1rem)] border border-transparent bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-foreground/92 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Upgrade to Pro
          </Link>
        )}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { logout } = useAuth();

  const search = new URLSearchParams(window.location.search);
  const tabParam = search.get("tab");
  const showSuccess = search.get("success") === "1";

  const initialTab: TabId = tabParam === "billing" ? "billing" : "account";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  return (
    <div className="rubik-container rubik-page rubik-stack">
      <div className="rubik-panel p-6 sm:p-8 space-y-6">
        <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">Settings</h1>

        {showSuccess && <SuccessBanner />}

        <TabBar active={activeTab} onChange={setActiveTab} />

        <div id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
          {activeTab === "account" && <AccountTab onLogout={logout} />}
          {activeTab === "billing" && <BillingTab />}
        </div>
      </div>
    </div>
  );
}
