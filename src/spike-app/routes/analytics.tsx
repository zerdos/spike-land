import { useCallback, useEffect, useState } from "react";

type TimeRange = "24h" | "7d" | "30d";

interface PlatformEvent {
  id: string;
  event_type: string;
  source: string;
  metadata: string;
  created_at: number;
}

interface AnalyticsSummary {
  totalEvents: number;
  uniqueUsers: number;
  eventsByType: Array<{ event_type: string; count: number }>;
  toolUsage: Array<{ tool_name: string; count: number }>;
}

function MetricCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}

function TimeRangeSelector({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}) {
  const ranges: TimeRange[] = ["24h", "7d", "30d"];
  return (
    <div className="flex gap-1 rounded-lg border bg-gray-50 p-1">
      {ranges.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            value === range
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {range}
        </button>
      ))}
    </div>
  );
}

const API_BASE = "/analytics";

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recentEvents, setRecentEvents] = useState<PlatformEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (range: TimeRange) => {
    setLoading(true);
    try {
      const [summaryRes, eventsRes] = await Promise.all([
        fetch(`${API_BASE}/summary?range=${range}`),
        fetch(`${API_BASE}/events?range=${range}&limit=20`),
      ]);

      if (summaryRes.ok) {
        setSummary(await summaryRes.json() as AnalyticsSummary);
      }
      if (eventsRes.ok) {
        setRecentEvents(await eventsRes.json() as PlatformEvent[]);
      }
    } catch {
      // Network error — keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(timeRange);
  }, [timeRange, fetchData]);

  const toolInvocations = summary?.eventsByType.find(
    (e) => e.event_type === "tool_use",
  )?.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Unique Visitors"
          value={loading ? "..." : String(summary?.uniqueUsers ?? 0)}
          subtitle={timeRange}
        />
        <MetricCard
          label="Tool Invocations"
          value={loading ? "..." : String(toolInvocations)}
          subtitle={timeRange}
        />
        <MetricCard
          label="Event Types"
          value={loading ? "..." : String(summary?.eventsByType.length ?? 0)}
        />
        <MetricCard
          label="Total Events"
          value={loading ? "..." : String(summary?.totalEvents ?? 0)}
          subtitle={timeRange}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tool Usage */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Top Tools by Usage
          </h3>
          {!summary?.toolUsage.length ? (
            <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed text-gray-400">
              {loading ? "Loading..." : "No tool usage data yet"}
            </div>
          ) : (
            <div className="space-y-2">
              {summary.toolUsage.slice(0, 10).map((tool) => (
                <div
                  key={tool.tool_name}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                >
                  <span className="text-sm font-medium text-gray-700">{tool.tool_name}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{
                        width: `${Math.max(
                          12,
                          (tool.count / (summary.toolUsage[0]?.count ?? 1)) * 120,
                        )}px`,
                      }}
                    />
                    <span className="text-xs text-gray-500">{tool.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Recent Activity
          </h3>
          {recentEvents.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed text-gray-400">
              {loading ? "Loading..." : "No recent events"}
            </div>
          ) : (
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                      {event.event_type}
                    </span>
                    <span className="text-sm text-gray-500">{event.source}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Events by Type */}
      {summary?.eventsByType && summary.eventsByType.length > 0 && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Events by Type
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="pb-2 font-medium">Event Type</th>
                  <th className="pb-2 text-right font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {summary.eventsByType.map((entry) => (
                  <tr key={entry.event_type} className="border-b last:border-0">
                    <td className="py-2 font-medium text-gray-900">{entry.event_type}</td>
                    <td className="py-2 text-right text-gray-700">{entry.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
