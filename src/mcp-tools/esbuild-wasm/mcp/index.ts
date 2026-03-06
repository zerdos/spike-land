#!/usr/bin/env node
import { createMcpServer, startMcpServer, wrapServerWithLogging, registerFeedbackTool, createErrorShipper } from "@spike-land-ai/mcp-server-base";
import { registerInitializeTool } from "../core-logic/initialize.js";
import { registerStatusTool } from "../core-logic/status.js";
import { registerTransformTool } from "../lazy-imports/transform.js";
import { registerBuildTool } from "../lazy-imports/build.js";
import { registerAnalyzeTool } from "../lazy-imports/analyze.js";
import { registerFormatMessagesTool } from "../lazy-imports/format-messages.js";
import { registerContextTool } from "../lazy-imports/context.js";

const server = createMcpServer({
  name: "esbuild-wasm-mcp",
  version: "0.27.4",
});

const shipper = createErrorShipper();
process.on('uncaughtException', (err) => shipper.shipError({ service_name: "esbuild-wasm-mcp", message: err.message, stack_trace: err.stack, severity: "high" }));
process.on('unhandledRejection', (err: unknown) => shipper.shipError({ service_name: "esbuild-wasm-mcp", message: err instanceof Error ? err.message : String(err), stack_trace: err instanceof Error ? err.stack : undefined, severity: "high" }));

wrapServerWithLogging(server, "esbuild-wasm-mcp");

registerInitializeTool(server);
registerStatusTool(server);
registerTransformTool(server);
registerBuildTool(server);
registerAnalyzeTool(server);
registerFormatMessagesTool(server);
registerContextTool(server);
registerFeedbackTool(server, { serviceName: "esbuild-wasm-mcp", toolName: "esbuild_feedback" });

await startMcpServer(server);
