#!/usr/bin/env node
/**
 * Google Analytics 4 MCP Server — Read-only GA4 reporting, realtime, and metadata.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { wrapServerWithLogging, registerFeedbackTool, createErrorShipper } from "@spike-land-ai/mcp-server-base";
import { GoogleAuthClient } from "./auth/google-oauth.js";
import { registerReportTools } from "./tools/reports.js";
import { registerRealtimeTool } from "./tools/realtime.js";
import { registerMetadataTools } from "./tools/metadata.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

const clientId = requireEnv("GOOGLE_CLIENT_ID");
const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");
const refreshToken = requireEnv("GOOGLE_REFRESH_TOKEN");
const propertyId = requireEnv("GA4_PROPERTY_ID");

const server = new McpServer({
  name: "google-analytics-mcp",
  version: "0.1.0",
});

const shipper = createErrorShipper();
process.on("uncaughtException", (err) =>
  shipper.shipError({
    service_name: "google-analytics-mcp",
    message: err.message,
    stack_trace: err.stack,
    severity: "high",
  }),
);
process.on("unhandledRejection", (err: unknown) =>
  shipper.shipError({
    service_name: "google-analytics-mcp",
    message: err instanceof Error ? err.message : String(err),
    stack_trace: err instanceof Error ? err.stack : undefined,
    severity: "high",
  }),
);

wrapServerWithLogging(server, "google-analytics-mcp");

const auth = new GoogleAuthClient({ clientId, clientSecret, refreshToken });

registerReportTools(server, auth, propertyId);
registerRealtimeTool(server, auth, propertyId);
registerMetadataTools(server, auth, propertyId);
registerFeedbackTool(server, { serviceName: "google-analytics-mcp", toolName: "ga4_feedback" });

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("Google Analytics MCP Server running on stdio.");
