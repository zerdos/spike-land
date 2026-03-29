import { beforeEach, describe, expect, it } from "vitest";
import { createMockServer, type MockMcpServer } from "../__test-utils__/index.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerEvalCodeTool } from "../../../src/mcp-tools/code-eval/core-logic/evaluator.js";
import { registerAmplifyTestsTool } from "../../../src/mcp-tools/code-eval/core-logic/amplifier.js";
import { registerRateSolutionTool } from "../../../src/mcp-tools/code-eval/core-logic/elo.js";
import { registerGenerateChallengeTool } from "../../../src/mcp-tools/code-eval/core-logic/challenges.js";
import { registerEvalReportTool } from "../../../src/mcp-tools/code-eval/core-logic/report.js";

describe("tool registration", () => {
  let server: MockMcpServer;

  beforeEach(() => {
    server = createMockServer();
  });

  it("registers eval_code tool", () => {
    registerEvalCodeTool(server as unknown as McpServer);
    expect(server.handlers.has("eval_code")).toBe(true);
  });

  it("registers amplify_tests tool", () => {
    registerAmplifyTestsTool(server as unknown as McpServer);
    expect(server.handlers.has("amplify_tests")).toBe(true);
  });

  it("registers rate_solution tool", () => {
    registerRateSolutionTool(server as unknown as McpServer);
    expect(server.handlers.has("rate_solution")).toBe(true);
  });

  it("registers generate_challenge tool", () => {
    registerGenerateChallengeTool(server as unknown as McpServer);
    expect(server.handlers.has("generate_challenge")).toBe(true);
  });

  it("registers eval_report tool", () => {
    registerEvalReportTool(server as unknown as McpServer);
    expect(server.handlers.has("eval_report")).toBe(true);
  });

  it("registers all 5 tools", () => {
    registerEvalCodeTool(server as unknown as McpServer);
    registerAmplifyTestsTool(server as unknown as McpServer);
    registerRateSolutionTool(server as unknown as McpServer);
    registerGenerateChallengeTool(server as unknown as McpServer);
    registerEvalReportTool(server as unknown as McpServer);
    expect(server.handlers.size).toBe(5);
  });
});

describe("eval_code via mock server", () => {
  let server: MockMcpServer;

  beforeEach(() => {
    server = createMockServer();
    registerEvalCodeTool(server as unknown as McpServer);
  });

  it("evaluates correct code", async () => {
    const result = await server.call("eval_code", {
      code: "function solution(a, b) { return a + b; }",
      tests: [{ name: "basic", input: "solution(2, 3)", expected: "5" }],
      timeoutMs: 5000,
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0]!.text);
    expect(data.passed).toBe(1);
    expect(data.passRate).toBe(1);
  });

  it("returns error for empty code", async () => {
    const result = await server.call("eval_code", {
      code: "   ",
      tests: [{ name: "test", input: "solution()", expected: "null" }],
      timeoutMs: 5000,
    });

    expect(result.isError).toBe(true);
  });
});

describe("generate_challenge via mock server", () => {
  let server: MockMcpServer;

  beforeEach(() => {
    server = createMockServer();
    registerGenerateChallengeTool(server as unknown as McpServer);
  });

  it("generates a challenge", async () => {
    const result = await server.call("generate_challenge", {
      difficulty: "easy",
      category: "arrays",
      seed: 42,
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0]!.text);
    expect(data.id).toBeDefined();
    expect(data.title).toBeDefined();
    expect(data.tests.length).toBeGreaterThan(0);
    expect(data.availableCategories).toBeDefined();
    // Reference solution should NOT be in the output
    expect(data.referenceSolution).toBeUndefined();
  });

  it("returns error for impossible category", async () => {
    const result = await server.call("generate_challenge", {
      difficulty: "easy",
      category: "dynamic-programming",
    });

    expect(result.isError).toBe(true);
  });
});
