import { ExternalLink, RefreshCw, Server, Sigma, TimerReset, Waypoints } from "lucide-react";
import { startTransition, useEffect, useState, type ReactNode } from "react";
import { Skeleton } from "../../core-logic/skeleton";

type StatusRangeKey = "60m" | "6h" | "24h";
type ServiceStatus = "up" | "degraded" | "down";

interface StatusPayload {
  overall: "operational" | "partial_degradation" | "major_outage";
  timestamp: string;
  range: {
    key: StatusRangeKey;
    label: string;
    windowMinutes: number;
  };
  summary: {
    up: number;
    degraded: number;
    down: number;
    total: number;
  };
  platform: {
    currentRpm: number;
    totalRequests: number;
    peakRpm: number;
    meanLatencyMs: number | null;
  };
  services: StatusService[];
}

interface StatusService {
  label: string;
  url: string;
  status: ServiceStatus;
  httpStatus: number | null;
  latencyMs: number;
  error: string | null;
  history: {
    summary: {
      totalRequests: number;
      currentRpm: number;
      averageRpm: number;
      currentRpmDelta: number;
      peakRpm: number;
      minLatencyMs: number | null;
      maxLatencyMs: number | null;
      meanLatencyMs: number | null;
      stddevLatencyMs: number | null;
      latestAvgLatencyMs: number | null;
      latestLatencyDeltaMs: number | null;
    };
    chartPoints: Array<{
      bucketStartMs: number;
      requestCount: number;
    }>;
  };
}

const STATUS_API_URL = "https://status.spike.land/api/status";
const RANGE_OPTIONS: Array<{ key: StatusRangeKey; label: string }> = [
  { key: "60m", label: "1h" },
  { key: "6h", label: "6h" },
  { key: "24h", label: "24h" },
];

function formatNumber(value: number, digits = 1): string {
  return value.toFixed(digits).replace(/\.0$/, "");
}

function formatRpm(value: number): string {
  return `${formatNumber(value, value >= 10 ? 0 : 1)} rpm`;
}

function formatDuration(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  if (value >= 1000) {
    return `${formatNumber(value / 1000, 2)}s`;
  }

  return `${formatNumber(value, value >= 100 ? 0 : 1)}ms`;
}

function formatSignedDuration(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "±";
  return `${sign}${formatDuration(Math.abs(value))}`;
}

function formatSignedRpm(value: number): string {
  if (value === 0) {
    return "±0 rpm";
  }

  const sign = value > 0 ? "+" : "-";
  return `${sign}${formatRpm(Math.abs(value))}`;
}

function getOverallLabel(overall: StatusPayload["overall"]): string {
  if (overall === "major_outage") return "Major outage";
  if (overall === "partial_degradation") return "Partial degradation";
  return "All systems operational";
}

type StatusTone = {
  dot: string;
  badge: string;
  badgeText: string;
  border: string;
  bar: string;
  latestBar: string;
  deltaText: string;
};

function getStatusTone(status: ServiceStatus): StatusTone {
  if (status === "down") {
    return {
      dot: "bg-red-500",
      badge: "bg-red-50 dark:bg-red-950/60",
      badgeText: "text-red-700 dark:text-red-400",
      border: "border-red-200 dark:border-red-900",
      bar: "bg-red-300/50 dark:bg-red-800/40",
      latestBar: "bg-red-500",
      deltaText: "text-red-600 dark:text-red-400",
    };
  }

  if (status === "degraded") {
    return {
      dot: "bg-amber-500",
      badge: "bg-amber-50 dark:bg-amber-950/60",
      badgeText: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-900",
      bar: "bg-amber-300/50 dark:bg-amber-800/40",
      latestBar: "bg-amber-500",
      deltaText: "text-amber-600 dark:text-amber-400",
    };
  }

  return {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 dark:bg-emerald-950/60",
    badgeText: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-900",
    bar: "bg-emerald-300/40 dark:bg-emerald-800/30",
    latestBar: "bg-emerald-500",
    deltaText: "text-emerald-600 dark:text-emerald-400",
  };
}

// ─── Metric tile ──────────────────────────────────────────────────

function MetricTile({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span className="text-muted-foreground/60">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-foreground">{value}</p>
      <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

// ─── Request bars ─────────────────────────────────────────────────

function RequestBars({
  points,
  status,
}: {
  points: StatusService["history"]["chartPoints"];
  status: ServiceStatus;
}) {
  const tone = getStatusTone(status);
  const maxRequests = Math.max(1, ...points.map((p) => p.requestCount));

  return (
    <div className="space-y-2.5 rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>Requests / min</span>
        <span>{points.length} buckets</span>
      </div>
      <div className="flex h-20 items-end gap-px">
        {points.map((point, index) => {
          const height =
            point.requestCount === 0
              ? "8%"
              : `${Math.max(8, (point.requestCount / maxRequests) * 100)}%`;
          const isLatest = index === points.length - 1;

          return (
            <div
              key={`${point.bucketStartMs}-${index}`}
              className={`min-w-0 flex-1 rounded-t transition-[height] duration-200 ${
                isLatest ? tone.latestBar : tone.bar
              } ${point.requestCount === 0 ? "opacity-40" : ""}`}
              style={{ height }}
              title={`${new Date(point.bucketStartMs).toISOString()}: ${point.requestCount} rpm`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Stat cell ────────────────────────────────────────────────────

function StatCell({
  label,
  primary,
  secondary,
}: {
  label: string;
  primary: string;
  secondary: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-lg font-bold tabular-nums tracking-tight text-foreground">
        {primary}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{secondary}</p>
    </div>
  );
}

// ─── Service card ─────────────────────────────────────────────────

function ServiceCard({ service, rangeLabel }: { service: StatusService; rangeLabel: string }) {
  const tone = getStatusTone(service.status);

  return (
    <article className={`rounded-2xl border bg-card p-5 ${tone.border}`}>
      <div className="flex flex-col gap-4">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground">{service.label}</p>
            <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{service.url}</p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${tone.badge} ${tone.badgeText}`}
          >
            <span className={`size-1.5 rounded-full ${tone.dot}`} />
            {service.status === "up"
              ? "Operational"
              : service.status === "degraded"
                ? "Degraded"
                : "Down"}
          </span>
        </div>

        {/* Probe tags */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border bg-background/60 px-2.5 py-1">
            Probe {formatDuration(service.latencyMs)}
          </span>
          <span className="rounded-full border border-border bg-background/60 px-2.5 py-1">
            HTTP {service.httpStatus ?? "—"}
          </span>
          <span
            className={`rounded-full border border-border bg-background/60 px-2.5 py-1 ${
              service.error ? tone.deltaText : ""
            }`}
          >
            {service.error ?? "Healthy"}
          </span>
        </div>

        {/* Chart */}
        <RequestBars points={service.history.chartPoints} status={service.status} />

        {/* Stats grid */}
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <StatCell
            label="Current load"
            primary={formatRpm(service.history.summary.currentRpm)}
            secondary={`${formatSignedRpm(service.history.summary.currentRpmDelta)} vs mean`}
          />
          <StatCell
            label="Latency spread"
            primary={formatDuration(service.history.summary.stddevLatencyMs)}
            secondary={`Std deviation — ${rangeLabel.toLowerCase()}`}
          />
          <StatCell
            label="Mean latency"
            primary={formatDuration(service.history.summary.meanLatencyMs)}
            secondary={`Latest ${formatSignedDuration(service.history.summary.latestLatencyDeltaMs)}`}
          />
          <StatCell
            label="Min / max"
            primary={formatDuration(service.history.summary.minLatencyMs)}
            secondary={`Max ${formatDuration(service.history.summary.maxLatencyMs)}`}
          />
          <StatCell
            label="Total requests"
            primary={service.history.summary.totalRequests.toLocaleString()}
            secondary={`Peak ${formatRpm(service.history.summary.peakRpm)}`}
          />
          <StatCell
            label="Window"
            primary={rangeLabel}
            secondary={`Avg ${formatRpm(service.history.summary.averageRpm)}`}
          />
        </div>
      </div>
    </article>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────

function StatusSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-96 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────

export function StatusPage() {
  const [range, setRange] = useState<StatusRangeKey>("6h");
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [payload, setPayload] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadStatus() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${STATUS_API_URL}?range=${range}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Status API returned ${response.status}`);
        }

        const nextPayload = (await response.json()) as StatusPayload;
        if (!cancelled) {
          setPayload(nextPayload);
        }
      } catch (requestError) {
        if (controller.signal.aborted || cancelled) return;
        const message =
          requestError instanceof Error ? requestError.message : "Unable to load system telemetry.";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadStatus();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [range, refreshNonce]);

  const services = payload?.services ?? [];

  const overallTone =
    payload?.overall === "major_outage"
      ? {
          dot: "bg-red-500",
          badge: "bg-red-50 dark:bg-red-950/60",
          text: "text-red-700 dark:text-red-400",
        }
      : payload?.overall === "partial_degradation"
        ? {
            dot: "bg-amber-500",
            badge: "bg-amber-50 dark:bg-amber-950/60",
            text: "text-amber-700 dark:text-amber-400",
          }
        : {
            dot: "bg-emerald-500",
            badge: "bg-emerald-50 dark:bg-emerald-950/60",
            text: "text-emerald-700 dark:text-emerald-400",
          };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* ── Hero banner ── */}
      <section className="rounded-2xl border border-border bg-card p-7 sm:p-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            {/* Overall status pill */}
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${overallTone.badge} ${overallTone.text}`}
            >
              <span className={`size-1.5 rounded-full ${overallTone.dot}`} />
              {getOverallLabel(payload?.overall ?? "operational")}
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              System status
            </h1>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              Live request pressure, latency, and health across every production service. Data is
              pulled directly from the status API.
            </p>

            {/* Range selector + external link */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => startTransition(() => setRange(option.key))}
                  aria-pressed={range === option.key}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    range === option.key
                      ? "border-foreground/20 bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <a
                href="https://status.spike.land"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Dedicated host
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>

          {/* Summary panel */}
          <div className="shrink-0 rounded-xl border border-border bg-muted/30 p-5 sm:min-w-[200px]">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Services
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-foreground">
              {payload ? `${payload.summary.up}/${payload.summary.total}` : "—"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {payload
                ? `${payload.summary.degraded} degraded · ${payload.summary.down} down`
                : "Loading…"}
            </p>
            {payload && (
              <p className="mt-3 font-mono text-[11px] text-muted-foreground/70">
                {payload.timestamp}
              </p>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-400">
            {error}
          </div>
        )}
      </section>

      {loading && !payload ? (
        <StatusSkeleton />
      ) : (
        <>
          {/* ── Metric tiles ── */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile
              label="Current load"
              value={payload ? formatRpm(payload.platform.currentRpm) : "—"}
              hint={payload ? `${payload.summary.total} tracked services` : "Live service demand"}
              icon={<Waypoints className="size-4" />}
            />
            <MetricTile
              label="Total requests"
              value={payload ? payload.platform.totalRequests.toLocaleString() : "—"}
              hint={payload ? payload.range.label : "Rolling window"}
              icon={<Server className="size-4" />}
            />
            <MetricTile
              label="Peak minute"
              value={payload ? formatRpm(payload.platform.peakRpm) : "—"}
              hint="Highest bucket in range"
              icon={<Sigma className="size-4" />}
            />
            <MetricTile
              label="Last refresh"
              value={payload ? new Date(payload.timestamp).toLocaleTimeString() : "—"}
              hint="Status API timestamp"
              icon={<TimerReset className="size-4" />}
            />
          </section>

          {/* ── Service breakdown ── */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Service breakdown
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Request rate, latency floor and ceiling, mean, and deviation per service.
                </p>
              </div>
              <button
                type="button"
                onClick={() => startTransition(() => setRefreshNonce((n) => n + 1))}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <RefreshCw className="size-3.5" />
                Refresh
              </button>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {services.map((service) => (
                <ServiceCard
                  key={service.label}
                  service={service}
                  rangeLabel={payload?.range.label ?? "Range"}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
