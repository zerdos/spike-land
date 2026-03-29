#!/usr/bin/env node

/**
 * Code Eval Arena — MCP Server
 *
 * LLM coding benchmark evaluation with:
 * - Sandboxed code execution
 * - EvalPlus-style test amplification
 * - CodeElo-inspired Elo rating
 * - Parameterized challenge generation
 * - Full eval pipeline orchestration
 */

import {
  createErrorShipper,
  createMcpServer,
  registerFeedbackTool,
  startMcpServer,
  wrapServerWithLogging,
} from "@spike-land-ai/mcp-server-base";
import { registerAmplifyTestsTool } from "../core-logic/amplifier.js";
import { registerGenerateChallengeTool } from "../core-logic/challenges.js";
import { registerEvalCodeTool } from "../core-logic/evaluator.js";
import { registerRateSolutionTool } from "../core-logic/elo.js";
import { registerEvalReportTool } from "../core-logic/report.js";

// ─── Server Setup ────────────────────────────────────────────────────────────

const server = createMcpServer({
  name: "code-eval-mcp",
  version: "0.1.0",
});

// ─── Error Shipping ──────────────────────────────────────────────────────────

const shipper = createErrorShipper();

process.on("uncaughtException", (err) =>
  shipper.shipError({
    service_name: "code-eval-mcp",
    message: err.message,
    stack_trace: err.stack ?? "",
    severity: "high",
  }),
);

process.on("unhandledRejection", (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  shipper.shipError({
    service_name: "code-eval-mcp",
    message: err.message,
    stack_trace: err.stack ?? "",
    severity: "medium",
  });
});

// ─── Logging ─────────────────────────────────────────────────────────────────

wrapServerWithLogging(server, "code-eval-mcp");

// ─── Tool Registration ──────────────────────────────────────────────────────

registerEvalCodeTool(server);
registerAmplifyTestsTool(server);
registerRateSolutionTool(server);
registerGenerateChallengeTool(server);
registerEvalReportTool(server);
registerFeedbackTool(server, { serviceName: "code-eval-mcp" });

// ─── Start ───────────────────────────────────────────────────────────────────

await startMcpServer(server);
