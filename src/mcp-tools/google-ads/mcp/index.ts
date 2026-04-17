/**
 * Google Ads MCP — public exports.
 *
 * Tool registration helpers (`registerCampaignTools`, `registerKeywordTools`,
 * `registerReportingTools`, `registerLifecycleTools`) plus a `createGoogleAdsMcpServer`
 * factory that wires the env-configured client into all tools.
 *
 * The actual stdio entry point lives in `./server.ts`.
 */

import { createMcpServer, errorResult, jsonResult } from "@spike-land-ai/mcp-server-base";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerCampaignTools } from "./campaigns.js";
import { registerKeywordTools } from "./keywords.js";
import { registerReportingTools } from "./reporting.js";
import { registerLifecycleTools } from "./lifecycle.js";
import { clientFromEnv, parseGoogleAdsEnv } from "../core-logic/env.js";

export * from "./campaigns.js";
export * from "./keywords.js";
export * from "./reporting.js";
export * from "./lifecycle.js";
export { parseGoogleAdsEnv, clientFromEnv } from "../core-logic/env.js";

/**
 * Build a fully wired Google Ads MCP server.
 *
 * If env vars are missing the server still starts but every tool returns a
 * structured `{ ok: false, error: "GOOGLE_ADS_* env vars not configured" }`
 * response so the LLM can surface the problem instead of crashing.
 */
export function createGoogleAdsMcpServer(
  source: Record<string, string | undefined> = process.env,
): McpServer {
  const server = createMcpServer({ name: "google-ads-mcp", version: "0.1.0" });
  const parsed = parseGoogleAdsEnv(source);

  if (!parsed.ok) {
    registerNotConfiguredTools(server, parsed.missing);
    return server;
  }

  const client = clientFromEnv(parsed.env);
  registerCampaignTools(server, client);
  registerKeywordTools(server, client);
  registerReportingTools(server, client);
  registerLifecycleTools(server, client);
  return server;
}

const TOOL_NAMES = [
  "ads_list_campaigns",
  "ads_get_campaign",
  "ads_create_campaign",
  "ads_update_campaign",
  "ads_list_ad_groups",
  "ads_pause_campaign",
  "ads_resume_campaign",
  "ads_keyword_performance",
  "ads_audience_insights",
  "ads_campaign_performance",
  "ads_account_metrics",
  "ads_search_terms_report",
] as const;

function registerNotConfiguredTools(server: McpServer, missing: readonly string[]): void {
  // Register every tool name with a minimal placeholder schema so MCP clients
  // can still discover the tool surface and get a clear error explaining what
  // env vars must be set before the server can talk to the Google Ads API.
  for (const name of TOOL_NAMES) {
    const errorMessage = `GOOGLE_ADS_* env vars not configured: missing ${missing.join(", ")}`;
    server.tool(
      name,
      `Google Ads tool — currently unavailable: ${errorMessage}`,
      { _hint: z.string().optional().describe("Unused — env vars are not configured") },
      async () => {
        const payload = jsonResult({ ok: false, error: errorMessage, missing });
        const fallback = errorResult("NOT_CONFIGURED", errorMessage, false);
        return { ...payload, isError: fallback.isError };
      },
    );
  }
}
