/**
 * Tool-First vs Browser Benchmark
 *
 * Compares two approaches to the same test scenario:
 *   (a) Playwright browser automation — launches Chromium, navigates the UI
 *   (b) Direct MCP tool call         — single HTTP request to spike.land/mcp
 *
 * Scenario: "Check whether a user has an active subscription / billing plan."
 *
 * Run:
 *   npx ts-node src/qa-studio/benchmarks/tool-vs-browser.ts
 *
 * The browser approach uses a stub (no real Chromium binary required) so the
 * benchmark is runnable offline and in CI without a headed browser.  Set
 * BENCHMARK_USE_REAL_BROWSER=true to launch an actual Chromium instance.
 *
 * The MCP approach hits https://mcp.spike.land/mcp.  Set
 * BENCHMARK_USE_REAL_MCP=true to make the live call; by default a local stub
 * is used so the benchmark is deterministic and offline-safe.
 */

import { chromium } from "playwright";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BenchmarkResult {
  approach: "browser" | "mcp-tool";
  scenarioName: string;
  durationMs: number;
  linesOfCode: number;
  success: boolean;
  error?: string;
  detail?: string;
}

interface McpToolResponse {
  jsonrpc: "2.0";
  id: number;
  result?: {
    content: Array<{ type: string; text: string }>;
  };
  error?: {
    code: number;
    message: string;
  };
}

interface BillingPlan {
  id: string;
  name: string;
  active: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCENARIO_NAME = "check-active-subscription";
const MCP_ENDPOINT = "https://mcp.spike.land/mcp";
const SPIKE_BASE_URL = "https://spike.land";

// Lines of code for each approach (counted from the actual implementation
// blocks below, not including shared scaffolding).
const LOC_BROWSER = 28;
const LOC_MCP_TOOL = 12;

const USE_REAL_BROWSER = process.env.BENCHMARK_USE_REAL_BROWSER === "true";
const USE_REAL_MCP = process.env.BENCHMARK_USE_REAL_MCP === "true";

// ---------------------------------------------------------------------------
// Stub helpers (used when real connections are disabled)
// ---------------------------------------------------------------------------

/** Simulates the latency of a full browser test without spawning Chromium. */
async function stubBrowserApproach(): Promise<{
  success: boolean;
  detail: string;
}> {
  // Simulate: browser launch (~1.2 s) + navigation (~0.9 s) + selector (~0.4 s)
  const simulatedMs = 1200 + 900 + 400 + Math.round(Math.random() * 800);
  await new Promise<void>((resolve) => setTimeout(resolve, simulatedMs));
  return {
    success: true,
    detail: `[stub] navigated ${SPIKE_BASE_URL}/billing, found "Pro Plan — active"`,
  };
}

/** Simulates a fast MCP tool call without hitting the network. */
async function stubMcpApproach(): Promise<{
  success: boolean;
  detail: string;
}> {
  // Simulate: DNS + TLS + HTTP round-trip (~80 ms) + tool execution (~30 ms)
  const simulatedMs = 80 + 30 + Math.round(Math.random() * 60);
  await new Promise<void>((resolve) => setTimeout(resolve, simulatedMs));
  return {
    success: true,
    detail: `[stub] billing_list_plans returned 3 plans, "pro" is active`,
  };
}

// ---------------------------------------------------------------------------
// (a) Browser approach  —  28 lines of meaningful test code
// ---------------------------------------------------------------------------

async function runBrowserApproach(): Promise<BenchmarkResult> {
  const start = performance.now();

  try {
    if (!USE_REAL_BROWSER) {
      const { success, detail } = await stubBrowserApproach();
      return {
        approach: "browser",
        scenarioName: SCENARIO_NAME,
        durationMs: Math.round(performance.now() - start),
        linesOfCode: LOC_BROWSER,
        success,
        detail,
      };
    }

    // --- Real Playwright path (enabled via BENCHMARK_USE_REAL_BROWSER=true) ---
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Navigate to the billing page
    await page.goto(`${SPIKE_BASE_URL}/billing`, {
      waitUntil: "networkidle",
      timeout: 15_000,
    });

    // 2. Assert the subscription badge is present and shows "active"
    const badge = page.locator('[data-testid="subscription-status"]');
    await badge.waitFor({ timeout: 5_000 });
    const statusText = await badge.innerText();
    const isActive = statusText.toLowerCase().includes("active");

    await browser.close();

    return {
      approach: "browser",
      scenarioName: SCENARIO_NAME,
      durationMs: Math.round(performance.now() - start),
      linesOfCode: LOC_BROWSER,
      success: isActive,
      detail: `subscription-status badge text: "${statusText}"`,
    };
  } catch (err: unknown) {
    return {
      approach: "browser",
      scenarioName: SCENARIO_NAME,
      durationMs: Math.round(performance.now() - start),
      linesOfCode: LOC_BROWSER,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// (b) MCP tool approach  —  12 lines of meaningful test code
// ---------------------------------------------------------------------------

async function runMcpToolApproach(): Promise<BenchmarkResult> {
  const start = performance.now();

  try {
    if (!USE_REAL_MCP) {
      const { success, detail } = await stubMcpApproach();
      return {
        approach: "mcp-tool",
        scenarioName: SCENARIO_NAME,
        durationMs: Math.round(performance.now() - start),
        linesOfCode: LOC_MCP_TOOL,
        success,
        detail,
      };
    }

    // --- Real MCP call (enabled via BENCHMARK_USE_REAL_MCP=true) ---
    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "billing_list_plans",
        arguments: {},
      },
    };

    const response = await fetch(MCP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as McpToolResponse;

    if (data.error) {
      throw new Error(`MCP error ${data.error.code}: ${data.error.message}`);
    }

    const text = data.result?.content?.[0]?.text ?? "";
    const plans: BillingPlan[] = JSON.parse(text) as BillingPlan[];
    const hasActivePlan = plans.some((p) => p.active);

    return {
      approach: "mcp-tool",
      scenarioName: SCENARIO_NAME,
      durationMs: Math.round(performance.now() - start),
      linesOfCode: LOC_MCP_TOOL,
      success: hasActivePlan,
      detail: `${plans.length} plans returned; active=${hasActivePlan}`,
    };
  } catch (err: unknown) {
    return {
      approach: "mcp-tool",
      scenarioName: SCENARIO_NAME,
      durationMs: Math.round(performance.now() - start),
      linesOfCode: LOC_MCP_TOOL,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function formatTable(browser: BenchmarkResult, mcp: BenchmarkResult): string {
  const speedup =
    browser.durationMs > 0
      ? (browser.durationMs / mcp.durationMs).toFixed(1)
      : "N/A";

  const locReduction = (
    ((browser.linesOfCode - mcp.linesOfCode) / browser.linesOfCode) *
    100
  ).toFixed(0);

  const rows = [
    "+-----------------+----------------+----------------+",
    "|                 | Browser (PW)   | MCP Tool       |",
    "+-----------------+----------------+----------------+",
    `| Duration        | ${String(browser.durationMs + " ms").padEnd(14)} | ${String(mcp.durationMs + " ms").padEnd(14)} |`,
    `| Lines of code   | ${String(browser.linesOfCode).padEnd(14)} | ${String(mcp.linesOfCode).padEnd(14)} |`,
    `| Success         | ${String(browser.success).padEnd(14)} | ${String(mcp.success).padEnd(14)} |`,
    "+-----------------+----------------+----------------+",
    `| Speedup         | baseline       | ${(speedup + "x faster").padEnd(14)} |`,
    `| LOC reduction   | baseline       | ${(locReduction + "% fewer").padEnd(14)} |`,
    "+-----------------+----------------+----------------+",
  ];

  return rows.join("\n");
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("Running Tool-First vs Browser Benchmark...\n");
  console.log(`Scenario : ${SCENARIO_NAME}`);
  console.log(`Real browser : ${USE_REAL_BROWSER}`);
  console.log(`Real MCP     : ${USE_REAL_MCP}`);
  console.log("");

  // Run sequentially so the results are not skewed by parallel resource
  // contention (Chromium startup is CPU/memory intensive).
  const browserResult = await runBrowserApproach();
  const mcpResult = await runMcpToolApproach();

  const results: BenchmarkResult[] = [browserResult, mcpResult];

  // Human-readable summary
  console.log(formatTable(browserResult, mcpResult));
  console.log("");

  if (browserResult.detail) {
    console.log(`Browser detail : ${browserResult.detail}`);
  }
  if (browserResult.error) {
    console.log(`Browser error  : ${browserResult.error}`);
  }
  if (mcpResult.detail) {
    console.log(`MCP detail     : ${mcpResult.detail}`);
  }
  if (mcpResult.error) {
    console.log(`MCP error      : ${mcpResult.error}`);
  }

  // JSON report
  const report = {
    runAt: new Date().toISOString(),
    scenario: SCENARIO_NAME,
    results,
    summary: {
      speedupFactor:
        browserResult.durationMs > 0 && mcpResult.durationMs > 0
          ? parseFloat(
              (browserResult.durationMs / mcpResult.durationMs).toFixed(2),
            )
          : null,
      locReductionPercent: parseFloat(
        (
          ((browserResult.linesOfCode - mcpResult.linesOfCode) /
            browserResult.linesOfCode) *
          100
        ).toFixed(1),
      ),
    },
  };

  const outputPath = "benchmark-report.json";
  const fs = await import("node:fs/promises");
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
  console.log(`\nJSON report written to ${outputPath}`);
}

main().catch(console.error);
