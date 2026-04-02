"use client";
import { useEffect, useState } from "react";

interface LatencyStat {
  toolName: string;
  avgLatency: number;
  calls: number;
}

interface McpHealthData {
  totalCalls: number;
  errorRate: string;
  latencyStats: LatencyStat[];
}

export default function McpDashboardPage() {
  const [data, setData] = useState<McpHealthData | null>(null);

  useEffect(() => {
    void fetch("/api/admin/mcp-health")
      .then((res) => res.json())
      .then((d: unknown) => setData(d as McpHealthData));
  }, []);

  if (!data) return <div>Betöltés...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">MCP Megfigyelhetőségi Műszerfal</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="border p-4 rounded shadow">
          <h2 className="font-semibold text-lg">Összes hívás</h2>
          <p className="text-2xl">{data.totalCalls}</p>
        </div>
        <div className="border p-4 rounded shadow">
          <h2 className="font-semibold text-lg">Hibaarány</h2>
          <p className="text-2xl">{data.errorRate}</p>
        </div>
      </div>
      <h2 className="text-xl font-bold mt-8 mb-4">Késleltetési statisztikák</h2>
      <ul>
        {data.latencyStats.map((stat: LatencyStat) => (
          <li key={stat.toolName} className="border-b py-2">
            {stat.toolName}: avg {stat.avgLatency}ms ({stat.calls} calls)
          </li>
        ))}
      </ul>
    </div>
  );
}
