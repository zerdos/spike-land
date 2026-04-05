import { useState } from "react";
import {
  Bug,
  AlertTriangle,
  Trophy,
  ChevronUp,
  ChevronDown,
  Shield,
  Flame,
  Clock,
} from "lucide-react";
import {
  useBugbookList,
  useBugbookLeaderboard,
  useReportBug,
  type BugbookFilters,
  type Bug as BugType,
  type ReportBugInput,
} from "../hooks/useBugbook";

const STATUS_COLORS: Record<string, string> = {
  CANDIDATE: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  ACTIVE: "bg-red-500/15 text-red-600 dark:text-red-400",
  FIXED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  DEPRECATED: "bg-muted text-muted-foreground",
};

const SEVERITY_ICONS: Record<string, typeof Flame> = {
  critical: Flame,
  high: AlertTriangle,
  medium: Shield,
  low: Bug,
};

function EloDisplay({ elo }: { elo: number }) {
  const color =
    elo >= 1600
      ? "text-red-500"
      : elo >= 1400
        ? "text-amber-500"
        : elo >= 1200
          ? "text-blue-500"
          : "text-muted-foreground";
  return <span className={`font-mono font-bold tabular-nums ${color}`}>{elo}</span>;
}

function BugCard({ bug }: { bug: BugType }) {
  const SeverityIcon = SEVERITY_ICONS[bug.severity] ?? Bug;
  const statusClass = STATUS_COLORS[bug.status] ?? STATUS_COLORS.CANDIDATE;

  return (
    <div className="rubik-panel group p-5 transition-[border-color,box-shadow] duration-200 hover:border-primary/24 hover:shadow-[var(--panel-shadow)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="rubik-icon-badge mt-0.5 size-9 shrink-0 rounded-xl">
            <SeverityIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-[-0.02em] text-foreground line-clamp-2">
              {bug.title}
            </h3>
            {bug.description && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                {bug.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span className={`rounded-full px-2 py-0.5 ${statusClass}`}>{bug.status}</span>
              <span>{bug.category}</span>
              <span className="opacity-40">&middot;</span>
              <span>
                {bug.report_count} report{bug.report_count !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <EloDisplay elo={bug.elo} />
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">ELO</span>
        </div>
      </div>
    </div>
  );
}

function LeaderboardPanel() {
  const { data, isLoading } = useBugbookLeaderboard();

  if (isLoading) {
    return (
      <div className="rubik-panel p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {data.topBugs.length > 0 && (
        <div className="rubik-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="size-4 text-amber-500" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Top Bugs by ELO
            </h3>
          </div>
          <div className="space-y-2">
            {data.topBugs.slice(0, 5).map((bug, i) => (
              <div
                key={bug.id}
                className="flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground/60 w-5">#{i + 1}</span>
                  <span className="text-sm font-medium text-foreground truncate">{bug.title}</span>
                </div>
                <EloDisplay elo={bug.elo} />
              </div>
            ))}
          </div>
        </div>
      )}

      {data.topReporters.length > 0 && (
        <div className="rubik-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Top Reporters
            </h3>
          </div>
          <div className="space-y-2">
            {data.topReporters.slice(0, 5).map((reporter, i) => (
              <div
                key={reporter.user_id}
                className="flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground/60 w-5">#{i + 1}</span>
                  <span className="text-sm font-medium text-foreground truncate">
                    {reporter.user_id.slice(0, 8)}...
                  </span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                    {reporter.tier}
                  </span>
                </div>
                <EloDisplay elo={reporter.elo} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportBugForm({ onClose }: { onClose: () => void }) {
  const reportBug = useReportBug();
  const [form, setForm] = useState<ReportBugInput>({
    title: "",
    description: "",
    service_name: "spike-web",
    severity: "medium",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    reportBug.mutate(form, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rubik-panel p-6 space-y-4">
      <h3 className="text-lg font-semibold tracking-[-0.03em]">Report a Bug</h3>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
          Title
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Short description of the issue"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Steps to reproduce, expected vs actual behavior..."
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
            Service
          </label>
          <select
            value={form.service_name}
            onChange={(e) => setForm((f) => ({ ...f, service_name: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="spike-web">Frontend</option>
            <option value="spike-edge">Edge API</option>
            <option value="spike-land-mcp">MCP Registry</option>
            <option value="mcp-auth">Auth</option>
            <option value="spike-land-backend">Backend</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
            Severity
          </label>
          <select
            value={form.severity}
            onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={reportBug.isPending || !form.title.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {reportBug.isPending ? "Submitting..." : "Submit Report"}
        </button>
      </div>

      {reportBug.isError && <p className="text-sm text-destructive">{reportBug.error.message}</p>}
    </form>
  );
}

export function BugbookPage() {
  const [filters, setFilters] = useState<BugbookFilters>({ sort: "elo", limit: 30 });
  const [showReport, setShowReport] = useState(false);
  const { data, isLoading, error } = useBugbookList(filters);

  const statusFilters = [
    { value: undefined, label: "All" },
    { value: "ACTIVE", label: "Active" },
    { value: "CANDIDATE", label: "Candidate" },
    { value: "FIXED", label: "Fixed" },
  ] as const;

  return (
    <div className="rubik-container rubik-page font-sans">
      {/* Header */}
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <div className="rubik-eyebrow border-primary/14 bg-primary/10 text-primary mb-6">
          <Bug className="size-3.5" />
          <span>Public Bug Tracker</span>
        </div>
        <h1 className="text-4xl font-semibold leading-none tracking-[-0.06em] text-foreground sm:text-5xl lg:text-6xl">
          Bug<span className="text-primary">book</span>
        </h1>
        <p className="mt-4 text-lg font-medium leading-8 text-muted-foreground">
          Every bug has an ELO score. Report issues, confirm existing ones, and climb the
          leaderboard. The most impactful bugs rise to the top.
        </p>
      </div>

      {/* Controls */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {statusFilters.map((sf) => (
            <button
              key={sf.label}
              onClick={() => setFilters((f) => ({ ...f, status: sf.value, offset: 0 }))}
              aria-pressed={filters.status === sf.value}
              className={`rounded-full border px-4 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.12em] transition-colors ${
                filters.status === sf.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card">
            <button
              onClick={() => setFilters((f) => ({ ...f, sort: "elo" }))}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                filters.sort === "elo"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ChevronUp className="size-3" /> ELO
            </button>
            <button
              onClick={() => setFilters((f) => ({ ...f, sort: "recent" }))}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                filters.sort === "recent"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="size-3" /> Recent
            </button>
          </div>

          <button
            onClick={() => setShowReport(!showReport)}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Report Bug
          </button>
        </div>
      </div>

      {/* Report form */}
      {showReport && (
        <div className="mb-8">
          <ReportBugForm onClose={() => setShowReport(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Bug list */}
        <div>
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rubik-panel h-24 animate-pulse bg-muted/30" />
              ))}
            </div>
          )}

          {error && (
            <div className="rubik-panel p-8 text-center">
              <Bug className="mx-auto mb-4 size-12 text-muted-foreground/40" />
              <h2 className="text-lg font-semibold text-foreground">Could not load bugs</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The bugbook API may be temporarily unavailable.
              </p>
            </div>
          )}

          {data && data.bugs.length === 0 && (
            <div className="rubik-panel p-12 text-center">
              <Bug className="mx-auto mb-4 size-12 text-primary/30" />
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">
                No bugs found
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {filters.status
                  ? `No ${filters.status.toLowerCase()} bugs right now.`
                  : "The bug tracker is clean. Be the first to report an issue."}
              </p>
            </div>
          )}

          {data && data.bugs.length > 0 && (
            <>
              <div className="space-y-3">
                {data.bugs.map((bug) => (
                  <BugCard key={bug.id} bug={bug} />
                ))}
              </div>

              {data.total > (filters.limit ?? 30) && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        offset: Math.max(0, (f.offset ?? 0) - (f.limit ?? 30)),
                      }))
                    }
                    disabled={(filters.offset ?? 0) === 0}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown className="size-4 rotate-90" />
                  </button>
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    {(filters.offset ?? 0) + 1}–
                    {Math.min((filters.offset ?? 0) + (filters.limit ?? 30), data.total)} of{" "}
                    {data.total}
                  </span>
                  <button
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        offset: (f.offset ?? 0) + (f.limit ?? 30),
                      }))
                    }
                    disabled={(filters.offset ?? 0) + (filters.limit ?? 30) >= data.total}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown className="size-4 -rotate-90" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar: Leaderboard */}
        <aside className="hidden lg:block">
          <LeaderboardPanel />
        </aside>
      </div>
    </div>
  );
}
