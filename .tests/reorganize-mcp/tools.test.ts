import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMockServer } from "@spike-land-ai/mcp-server-base";

// ── Mock runPipeline before importing tool registrations ──────────────────────

const mockRunPipeline = vi.fn();
const mockReadPackagesYaml = vi.fn();

vi.mock("../../src/mcp-tools/reorganize/core-logic/pipeline.js", () => ({
  runPipeline: mockRunPipeline,
}));

vi.mock("../../scripts/reorganize/utils.js", () => ({ readPackagesYaml: mockReadPackagesYaml }));

// Lazy imports AFTER mocks are in place
const { registerAnalyzeTool } = await import(
  "../../src/mcp-tools/reorganize/core-logic/analyze.js"
);
const { registerDiscoverTool } = await import(
  "../../src/mcp-tools/reorganize/core-logic/discover.js"
);
const { registerLintTool } = await import("../../src/mcp-tools/reorganize/core-logic/lint.js");
const { registerStatusTool } = await import("../../src/mcp-tools/reorganize/core-logic/status.js");

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFileNode(relPath: string, packageName: string, externalDeps: string[] = []) {
  return {
    absPath: `/src/${relPath}`,
    relPath,
    packageName,
    externalDeps: new Set(externalDeps),
    relativeImports: new Set<string>(),
  };
}

// ── reorganize_analyze ────────────────────────────────────────────────────────

describe("reorganize_analyze", () => {
  let server: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    server = createMockServer();
    registerAnalyzeTool(server as unknown as McpServer);
  });

  it("registers the tool", () => {
    expect(server.handlers.has("reorganize_analyze")).toBe(true);
  });

  it("returns summary mode by default", async () => {
    mockRunPipeline.mockResolvedValue({
      plans: [
        {
          fileNode: makeFileNode("a/handler.ts", "a"),
          targetDir: "edge-api/main",
          targetFileName: "handler.ts",
          targetRelPath: "edge-api/main/handler.ts",
        },
        {
          fileNode: makeFileNode("a/utils.ts", "a"),
          targetDir: "edge-api/main",
          targetFileName: "utils.ts",
          targetRelPath: "edge-api/main/utils.ts",
        },
        {
          fileNode: makeFileNode("b/index.ts", "b"),
          targetDir: "utilities/b",
          targetFileName: "index.ts",
          targetRelPath: "utilities/b/index.ts",
        },
      ],
    });

    const result = await server.call("reorganize_analyze", {});
    expect(result.isError).toBeUndefined();

    const data = JSON.parse(result.content[0].text);
    expect(data.totalFiles).toBe(3);
    expect(Array.isArray(data.categories)).toBe(true);
    expect(data.categories[0].name).toBe("edge-api");
    expect(data.categories[0].count).toBe(2);
    expect(Array.isArray(data.topDirs)).toBe(true);
  });

  it("returns full diff mapping in diff mode", async () => {
    mockRunPipeline.mockResolvedValue({
      plans: [
        {
          fileNode: makeFileNode("pkg/old.ts", "pkg"),
          targetDir: "utilities/pkg",
          targetFileName: "old.ts",
          targetRelPath: "utilities/pkg/old.ts",
        },
      ],
    });

    const result = await server.call("reorganize_analyze", { mode: "diff" });
    expect(result.isError).toBeUndefined();

    const data = JSON.parse(result.content[0].text);
    expect(data.total).toBe(1);
    expect(data.plans[0].oldPath).toBe("pkg/old.ts");
    expect(data.plans[0].newPath).toBe("utilities/pkg/old.ts");
  });

  it("handles pipeline failure gracefully", async () => {
    mockRunPipeline.mockRejectedValue(new Error("ts-morph parse error"));
    // createMockServer catches handler errors and returns isError:true
    const result = await server.call("reorganize_analyze", {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("ts-morph parse error");
  });
});

// ── reorganize_discover ───────────────────────────────────────────────────────

describe("reorganize_discover", () => {
  let server: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    server = createMockServer();
    registerDiscoverTool(server as unknown as McpServer);
  });

  it("registers the tool", () => {
    expect(server.handlers.has("reorganize_discover")).toBe(true);
  });

  it("aggregates files by package with external deps", async () => {
    mockRunPipeline.mockResolvedValue({
      nodes: [
        makeFileNode("pkg-a/a1.ts", "pkg-a", ["hono"]),
        makeFileNode("pkg-a/a2.ts", "pkg-a", ["hono", "drizzle-orm"]),
        makeFileNode("pkg-b/b1.ts", "pkg-b", ["react"]),
      ],
      packageCategories: new Map([
        ["pkg-a", "edge-api"],
        ["pkg-b", "frontend"],
      ]),
    });

    const result = await server.call("reorganize_discover", {});
    expect(result.isError).toBeUndefined();

    const data = JSON.parse(result.content[0].text);
    expect(data.fileCount).toBe(3);
    expect(data.packageCount).toBe(2);

    const pkgA = data.packages.find((p: { name: string }) => p.name === "pkg-a");
    expect(pkgA.category).toBe("edge-api");
    expect(pkgA.fileCount).toBe(2);
    expect(pkgA.externalDeps).toContain("drizzle-orm");
    expect(pkgA.externalDeps).toContain("hono");
  });

  it("sorts packages by file count descending", async () => {
    mockRunPipeline.mockResolvedValue({
      nodes: [
        makeFileNode("small-pkg/a.ts", "small-pkg"),
        makeFileNode("big-pkg/a.ts", "big-pkg"),
        makeFileNode("big-pkg/b.ts", "big-pkg"),
        makeFileNode("big-pkg/c.ts", "big-pkg"),
      ],
      packageCategories: new Map([
        ["small-pkg", "utilities"],
        ["big-pkg", "utilities"],
      ]),
    });

    const result = await server.call("reorganize_discover", {});
    const data = JSON.parse(result.content[0].text);
    expect(data.packages[0].name).toBe("big-pkg");
    expect(data.packages[0].fileCount).toBe(3);
  });

  it("assigns unknown category when package is not in the map", async () => {
    mockRunPipeline.mockResolvedValue({
      nodes: [makeFileNode("orphan/file.ts", "orphan")],
      packageCategories: new Map(),
    });

    const result = await server.call("reorganize_discover", {});
    const data = JSON.parse(result.content[0].text);
    expect(data.packages[0].category).toBe("unknown");
  });
});

// ── reorganize_lint ───────────────────────────────────────────────────────────

describe("reorganize_lint", () => {
  let server: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    server = createMockServer();
    registerLintTool(server as unknown as McpServer);
  });

  it("registers the tool", () => {
    expect(server.handlers.has("reorganize_lint")).toBe(true);
  });

  it("passes when no core packages import react", async () => {
    mockRunPipeline.mockResolvedValue({
      nodes: [makeFileNode("core-pkg/utils.ts", "core-pkg", ["zod"])],
      packageCategories: new Map([["core-pkg", "core"]]),
    });

    const result = await server.call("reorganize_lint", {});
    expect(result.isError).toBeUndefined();

    const data = JSON.parse(result.content[0].text);
    expect(data.passed).toBe(true);
    expect(data.violationCount).toBe(0);
    expect(data.violations).toHaveLength(0);
  });

  it("detects core packages importing react", async () => {
    mockRunPipeline.mockResolvedValue({
      nodes: [makeFileNode("core-pkg/component.tsx", "core-pkg", ["react", "react-dom"])],
      packageCategories: new Map([["core-pkg", "core"]]),
    });

    const result = await server.call("reorganize_lint", {});
    const data = JSON.parse(result.content[0].text);
    expect(data.passed).toBe(false);
    expect(data.violationCount).toBe(1);
    expect(data.violations[0].package).toBe("core-pkg");
    expect(data.violations[0].reason).toContain("react");
  });

  it("ignores frontend packages importing react", async () => {
    mockRunPipeline.mockResolvedValue({
      nodes: [makeFileNode("ui-pkg/app.tsx", "ui-pkg", ["react"])],
      packageCategories: new Map([["ui-pkg", "frontend"]]),
    });

    const result = await server.call("reorganize_lint", {});
    const data = JSON.parse(result.content[0].text);
    expect(data.passed).toBe(true);
    expect(data.violations).toHaveLength(0);
  });

  it("reports multiple violations across different files", async () => {
    mockRunPipeline.mockResolvedValue({
      nodes: [
        makeFileNode("core-pkg/a.tsx", "core-pkg", ["react"]),
        makeFileNode("core-pkg/b.tsx", "core-pkg", ["react-dom"]),
      ],
      packageCategories: new Map([["core-pkg", "core"]]),
    });

    const result = await server.call("reorganize_lint", {});
    const data = JSON.parse(result.content[0].text);
    expect(data.violationCount).toBe(2);
  });
});

// ── reorganize_status ─────────────────────────────────────────────────────────

describe("reorganize_status", () => {
  let server: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    server = createMockServer();
    registerStatusTool(server as unknown as McpServer);
  });

  it("registers the tool", () => {
    expect(server.handlers.has("reorganize_status")).toBe(true);
  });

  it("returns packages sorted alphabetically", async () => {
    mockReadPackagesYaml.mockResolvedValue({
      "z-pkg": { kind: "cli" },
      "a-pkg": { kind: "library" },
      "m-pkg": {},
    });

    const result = await server.call("reorganize_status", {});
    expect(result.isError).toBeUndefined();

    const data = JSON.parse(result.content[0].text);
    expect(data.packageCount).toBe(3);
    expect(data.packages[0].name).toBe("a-pkg");
    expect(data.packages[2].name).toBe("z-pkg");
  });

  it("marks packages with no kind as unspecified", async () => {
    mockReadPackagesYaml.mockResolvedValue({
      "my-pkg": {},
    });

    const result = await server.call("reorganize_status", {});
    const data = JSON.parse(result.content[0].text);
    expect(data.packages[0].kind).toBe("unspecified");
  });

  it("preserves the kind from packages.yaml", async () => {
    mockReadPackagesYaml.mockResolvedValue({
      "auth-pkg": { kind: "mcp-server" },
    });

    const result = await server.call("reorganize_status", {});
    const data = JSON.parse(result.content[0].text);
    expect(data.packages[0].kind).toBe("mcp-server");
  });

  it("handles empty packages.yaml", async () => {
    mockReadPackagesYaml.mockResolvedValue({});

    const result = await server.call("reorganize_status", {});
    const data = JSON.parse(result.content[0].text);
    expect(data.packageCount).toBe(0);
    expect(data.packages).toHaveLength(0);
  });
});
