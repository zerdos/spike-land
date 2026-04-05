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
      className="flex items-start gap-3 rounded-xl border border-success/25 bg-success/8 px-4 py-3.5"
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/20">
        <svg
          className="h-3 w-3 text-success-foreground"
          fill="none"
          viewBox="0 0 12 12"
          aria-hidden="true"
        >
          <path
            d="M2 6l3 3 5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <div>
        <p className="text-sm font-semibold text-success-foreground">You're on Pro</p>
        <p className="text-xs text-success-foreground/70 mt-0.5">
          Your subscription is now active. Welcome aboard.
        </p>
      </div>
    </div>
  );
}

function TabBar({ active, onChange }: { active: TabId; onChange: (tab: TabId) => void }) {
  return (
    <div role="tablist" className="flex gap-0 border-b border-border">
      {(["account", "billing"] as TabId[]).map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === tab}
          aria-controls={`panel-${tab}`}
          id={`tab-${tab}`}
          onClick={() => onChange(tab)}
          className={`relative px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            active === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
          {active === tab && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

// A reusable row inside a settings section card
function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-border/60 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function AccountTab({ onLogout }: { onLogout: () => void }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-sm text-muted-foreground">You are not signed in.</p>
        <Link
          to="/login"
          className="text-sm font-medium text-primary hover:text-primary/80 underline-offset-4 underline"
        >
          Sign in to your account
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="rubik-panel p-5">
        <div className="flex items-center gap-4 pb-4 border-b border-border/60">
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name ?? "User avatar"}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary ring-2 ring-border"
            >
              {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 space-y-0.5">
            {user.name && (
              <p className="text-base font-semibold text-foreground truncate">{user.name}</p>
            )}
            {user.email && <p className="text-sm text-muted-foreground truncate">{user.email}</p>}
          </div>
        </div>

        <div className="pt-1">
          <SettingsRow label="Display name" value={user.name ?? "—"} />
          <SettingsRow label="Email address" value={user.email ?? "—"} />
        </div>
      </div>

      {/* Danger zone */}
      <div className="rubik-panel p-5 border-destructive/20">
        <h3 className="text-sm font-semibold text-foreground mb-1">Session</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Signing out will end your current session on this device.
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-destructive/40 hover:text-destructive hover:bg-destructive/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

const PLAN_BADGE: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  pro: "bg-primary/10 text-primary",
  business: "bg-success/10 text-success-foreground",
};

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
      <div className="py-12 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3.5 text-sm text-destructive"
      >
        <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M8 5v4M8 11h.01M2 8a6 6 0 1112 0A6 6 0 012 8z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        {error}
      </div>
    );
  }

  const planLabel = billing ? billing.plan.charAt(0).toUpperCase() + billing.plan.slice(1) : "—";

  return (
    <div className="space-y-6">
      {/* Current plan card */}
      <div className="rubik-panel p-5">
        <div className="flex items-start justify-between pb-4 border-b border-border/60">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Current plan</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Your active subscription details</p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PLAN_BADGE[billing?.plan ?? "free"]}`}
          >
            {planLabel}
          </span>
        </div>

        <div className="pt-1">
          <SettingsRow
            label="Status"
            value={
              billing?.status
                ? billing.status.charAt(0).toUpperCase() + billing.status.slice(1)
                : "—"
            }
          />
          {billing?.currentPeriodEnd && (
            <SettingsRow
              label="Renews on"
              value={new Date(billing.currentPeriodEnd).toLocaleDateString("en-GB", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {billing?.plan !== "free" && (
          <button
            type="button"
            onClick={handleManageSubscription}
            disabled={portalLoading}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-primary/30 hover:text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {portalLoading ? "Opening portal…" : "Manage subscription"}
          </button>
        )}

        {billing?.plan === "free" && (
          <Link
            to="/pricing"
            className="rounded-xl border border-transparent bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
    <div className="rubik-container rubik-page">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Page header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and subscription preferences.
          </p>
        </div>

        {showSuccess && <SuccessBanner />}

        {/* Settings card */}
        <div className="rubik-panel overflow-hidden">
          {/* Tab navigation flush with card top */}
          <div className="px-6 pt-5">
            <TabBar active={activeTab} onChange={setActiveTab} />
          </div>

          {/* Tab content */}
          <div
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className="p-6"
          >
            {activeTab === "account" && <AccountTab onLogout={logout} />}
            {activeTab === "billing" && <BillingTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
