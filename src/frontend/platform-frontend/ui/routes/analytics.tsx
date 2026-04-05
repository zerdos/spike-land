import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import type { TimeRange, DashboardData } from "../components/analytics/types";
import { isRealtimeRange } from "../components/analytics/useGA4Data";
import { OverviewTab } from "../components/analytics/OverviewTab";
import { AcquisitionTab } from "../components/analytics/AcquisitionTab";
import { BehaviorTab } from "../components/analytics/BehaviorTab";
import { AudienceTab } from "../components/analytics/AudienceTab";
import { PlatformTab } from "../components/analytics/PlatformTab";
import { EventsTab } from "../components/analytics/EventsTab";
import { RealTimeMetrics } from "../components/analytics/RealTimeMetrics";

const ADMIN_EMAILS = new Set(["hello@spike.land", "hello@spike.land"]);

type TabId =
  | "overview"
  | "acquisition"
  | "behavior"
  | "audience"
  | "platform"
  | "events"
  | "realtime";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "acquisition", label: "Acquisition" },
  { id: "behavior", label: "Behavior" },
  { id: "audience", label: "Audience" },
  { id: "platform", label: "Platform" },
  { id: "events", label: "Events" },
  { id: "realtime", label: "Real-time" },
];

const RANGE_GROUPS: { label: string; ranges: TimeRange[] }[] = [
  { label: "Realtime", ranges: ["1m", "5m", "15m"] },
  { label: "Short", ranges: ["1h", "6h", "24h"] },
  { label: "Medium", ranges: ["7d", "30d"] },
  { label: "Long", ranges: ["3mo", "6mo", "1y", "3y"] },
];

const AUTO_REFRESH: Partial<Record<TimeRange, number>> = {
  "1m": 10_000,
  "5m": 30_000,
  "15m": 60_000,
  "1h": 120_000,
};

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 1000) return "just now";
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return `${Math.floor(diff / 86400_000)}d ago`;
}

function TimeRangeSelector({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Time range"
      className="flex items-center gap-0.5 overflow-x-auto rounded-xl border border-border bg-muted/60 p-1 backdrop-blur-sm"
    >
      {RANGE_GROUPS.map((group, gi) => (
        <div key={group.label} className="flex items-center gap-0.5">
          {gi > 0 && (
            <span className="mx-1 h-3.5 w-px bg-border/60 select-none" aria-hidden="true" />
          )}
          {group.ranges.map((range) => (
            <button
              key={range}
              type="button"
              aria-pressed={value === range}
              onClick={() => onChange(range)}
              className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                value === range
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function LiveIndicator({ lastUpdated }: { lastUpdated: number | null }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-success/10 border border-success/20 px-3 py-1">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      <span className="text-xs font-semibold text-success-foreground tracking-wide">Live</span>
      {lastUpdated && (
        <span className="text-xs text-muted-foreground border-l border-success/20 pl-2 ml-0.5">
          {relativeTime(lastUpdated)}
        </span>
      )}
    </div>
  );
}

const D1_API_BASE = "/analytics";

export function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [d1Data, setD1Data] = useState<DashboardData | null>(null);
  const [d1Loading, setD1Loading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchD1Data = useCallback(async (range: TimeRange, isAutoRefresh = false) => {
    if (!isAutoRefresh) setD1Loading(true);
    try {
      const res = await fetch(`${D1_API_BASE}/dashboard?range=${range}`, {
        credentials: "include",
      });
      if (res.ok) {
        setD1Data((await res.json()) as DashboardData);
        setLastUpdated(Date.now());
      }
    } catch {
      // Network error — keep existing data
    } finally {
      if (!isAutoRefresh) setD1Loading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || !ADMIN_EMAILS.has(user.email)) return;
    fetchD1Data(timeRange);
  }, [timeRange, fetchD1Data, user]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const refreshMs = AUTO_REFRESH[timeRange];
    if (!refreshMs) return;

    const handleVisibility = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        fetchD1Data(timeRange, true);
        intervalRef.current = setInterval(() => fetchD1Data(timeRange, true), refreshMs);
      }
    };

    intervalRef.current = setInterval(() => fetchD1Data(timeRange, true), refreshMs);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [timeRange, fetchD1Data]);

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  if (!user || !ADMIN_EMAILS.has(user.email)) {
    return <Navigate to="/" />;
  }

  const isRealtime = isRealtimeRange(timeRange);

  return (
    <div className="space-y-6 pb-12">
      {/* Page header — Stripe-style: title left, controls right */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
            {isRealtime && <LiveIndicator lastUpdated={lastUpdated} />}
          </div>
          {!isRealtime && lastUpdated && (
            <p className="text-sm text-muted-foreground">Updated {relativeTime(lastUpdated)}</p>
          )}
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Tab navigation — underline style */}
      <div className="relative">
        <div className="flex items-center gap-0 overflow-x-auto border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none ${
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content panels */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && <OverviewTab range={timeRange} />}
        {activeTab === "acquisition" && <AcquisitionTab range={timeRange} />}
        {activeTab === "behavior" && <BehaviorTab range={timeRange} d1Data={d1Data} />}
        {activeTab === "audience" && <AudienceTab range={timeRange} />}
        {activeTab === "platform" && (
          <PlatformTab range={timeRange} data={d1Data} loading={d1Loading} />
        )}
        {activeTab === "events" && <EventsTab range={timeRange} d1Data={d1Data} />}
        {activeTab === "realtime" && <RealTimeMetrics />}
      </div>
    </div>
  );
}
