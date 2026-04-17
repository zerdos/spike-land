#!/usr/bin/env node
/**
 * Google Ads MCP Server — stdio entry point.
 *
 * Reads credentials from env (`GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_REFRESH_TOKEN`,
 * `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_CUSTOMER_ID`,
 * optional `GOOGLE_ADS_LOGIN_CUSTOMER_ID`).
 *
 * If any required var is missing the server still starts but every tool
 * returns a structured `NOT_CONFIGURED` error explaining which env vars to set.
 */

import {
  createErrorShipper,
  registerFeedbackTool,
  startMcpServer,
  wrapServerWithLogging,
} from "@spike-land-ai/mcp-server-base";
import { createGoogleAdsMcpServer } from "./index.js";

const server = createGoogleAdsMcpServer();

const shipper = createErrorShipper();
process.on("uncaughtException", (err) =>
  shipper.shipError({
    service_name: "google-ads-mcp",
    message: err.message,
    stack_trace: err.stack ?? "",
    severity: "high",
  }),
);
process.on("unhandledRejection", (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  shipper.shipError({
    service_name: "google-ads-mcp",
    message: err.message,
    stack_trace: err.stack ?? "",
    severity: "medium",
  });
});

wrapServerWithLogging(server, "google-ads-mcp");
registerFeedbackTool(server, { serviceName: "google-ads-mcp", toolName: "google_ads_feedback" });

await startMcpServer(server);

process.stderr.write("Google Ads MCP Server running on stdio.\n");
