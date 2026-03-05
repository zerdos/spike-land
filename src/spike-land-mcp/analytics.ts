/** Track an MCP tool call in Analytics Engine. */
export function trackMcpToolCall(
  analytics: AnalyticsEngineDataset | undefined,
  toolName: string,
  durationMs: number,
  success: boolean,
): void {
  if (!analytics) return;
  try {
    analytics.writeDataPoint({
      indexes: ["tool_call"],
      blobs: [toolName, success ? "ok" : "error"],
      doubles: [durationMs, success ? 1 : 0],
    });
  } catch {
    // Best-effort
  }
}
