#!/usr/bin/env node
/**
 * PageIndex MCP Server — Vectorless, reasoning-based RAG.
 *
 * Fa-struktúrájú dokumentum indexelés, oldalszintű hivatkozások,
 * és self-improving kontextus loop.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  wrapServerWithLogging,
  registerFeedbackTool,
  createErrorShipper,
} from "@spike-land-ai/mcp-server-base";
import { PageIndexClient } from "../core-logic/client.js";
import { InsightStore } from "../core-logic/self-improve.js";
import { registerPageIndexTools } from "../core-logic/tools.js";

const apiKey = process.env.PAGEINDEX_API_KEY;
if (!apiKey) {
  process.stderr.write("PAGEINDEX_API_KEY environment variable is required.\n");
  process.exit(1);
}

const server = new McpServer({
  name: "pageindex-mcp",
  version: "1.0.0",
});

const shipper = createErrorShipper();
process.on("uncaughtException", (err) =>
  shipper.shipError({
    service_name: "pageindex-mcp",
    message: err.message,
    stack_trace: err.stack,
    severity: "high",
  }),
);
process.on("unhandledRejection", (err: unknown) =>
  shipper.shipError({
    service_name: "pageindex-mcp",
    message: err instanceof Error ? err.message : String(err),
    stack_trace: err instanceof Error ? err.stack : undefined,
    severity: "high",
  }),
);

wrapServerWithLogging(server, "pageindex-mcp");

const client = new PageIndexClient({ apiKey });
const insightStore = new InsightStore();

registerPageIndexTools(server, client, insightStore);
registerFeedbackTool(server, { serviceName: "pageindex-mcp", toolName: "pageindex_feedback" });

const transport = new StdioServerTransport();
await server.connect(transport);

process.stderr.write("PageIndex MCP Server running on stdio.\n");
