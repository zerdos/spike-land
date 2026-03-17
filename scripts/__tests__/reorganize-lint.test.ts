import { describe, it, expect } from "vitest";
import { runLint } from "../reorganize/linting.js";
import type { FileNode, LintContext } from "../reorganize/types.js";

function makeNode(
  overrides: Partial<FileNode> & { relPath: string; packageName: string },
): FileNode {
  return {
    absPath: "/src/" + overrides.relPath,
    relPath: overrides.relPath,
    packageName: overrides.packageName,
    externalDeps: overrides.externalDeps ?? new Set(),
    relativeImports: overrides.relativeImports ?? new Set(),
    resolvedDeps: overrides.resolvedDeps ?? new Set(),
  };
}

function makeCtx(nodes: FileNode[], cats: Record<string, string>): LintContext {
  return {
    nodes,
    packageCategories: new Map(Object.entries(cats)),
    categoryDirs: new Set(),
  };
}

describe("no-frontend-in-core", () => {
  it("flags core package importing react", () => {
    const node = makeNode({
      relPath: "core/shared/utils.ts",
      packageName: "shared",
      externalDeps: new Set(["react"]),
    });
    const result = runLint(makeCtx([node], { shared: "core" }));
    const errors = result.violations.filter((v) => v.rule === "no-frontend-in-core");
    expect(errors).toHaveLength(1);
    expect(errors[0].severity).toBe("error");
  });

  it("allows core package with no frontend deps", () => {
    const node = makeNode({
      relPath: "core/shared/utils.ts",
      packageName: "shared",
      externalDeps: new Set(["zod"]),
    });
    const result = runLint(makeCtx([node], { shared: "core" }));
    const errors = result.violations.filter((v) => v.rule === "no-frontend-in-core");
    expect(errors).toHaveLength(0);
  });

  it("allows frontend package importing react", () => {
    const node = makeNode({
      relPath: "frontend/app/Component.tsx",
      packageName: "app",
      externalDeps: new Set(["react", "react-dom"]),
    });
    const result = runLint(makeCtx([node], { app: "frontend" }));
    const errors = result.violations.filter((v) => v.rule === "no-frontend-in-core");
    expect(errors).toHaveLength(0);
  });
});

describe("no-frontend-in-edge", () => {
  it("flags edge package importing react", () => {
    const node = makeNode({
      relPath: "edge-api/main/handler.ts",
      packageName: "main",
      externalDeps: new Set(["react"]),
    });
    const result = runLint(makeCtx([node], { main: "edge-api" }));
    const errors = result.violations.filter((v) => v.rule === "no-frontend-in-edge");
    expect(errors).toHaveLength(1);
    expect(errors[0].severity).toBe("error");
  });

  it("allows edge package with hono", () => {
    const node = makeNode({
      relPath: "edge-api/main/handler.ts",
      packageName: "main",
      externalDeps: new Set(["hono"]),
    });
    const result = runLint(makeCtx([node], { main: "edge-api" }));
    const errors = result.violations.filter((v) => v.rule === "no-frontend-in-edge");
    expect(errors).toHaveLength(0);
  });
});

describe("no-browser-in-edge", () => {
  it("flags edge package importing monaco-editor", () => {
    const node = makeNode({
      relPath: "edge-api/main/editor.ts",
      packageName: "main",
      externalDeps: new Set(["monaco-editor"]),
    });
    const result = runLint(makeCtx([node], { main: "edge-api" }));
    const errors = result.violations.filter((v) => v.rule === "no-browser-in-edge");
    expect(errors).toHaveLength(1);
  });
});

describe("no-cli-in-mcp", () => {
  it("warns when MCP tool imports commander", () => {
    const node = makeNode({
      relPath: "mcp-tools/image-studio/cli.ts",
      packageName: "image-studio",
      externalDeps: new Set(["commander"]),
    });
    const result = runLint(makeCtx([node], { "image-studio": "mcp-tools" }));
    const warnings = result.violations.filter((v) => v.rule === "no-cli-in-mcp");
    expect(warnings).toHaveLength(1);
    expect(warnings[0].severity).toBe("warning");
  });

  it("allows MCP tool with normal deps", () => {
    const node = makeNode({
      relPath: "mcp-tools/image-studio/tool.ts",
      packageName: "image-studio",
      externalDeps: new Set(["sharp"]),
    });
    const result = runLint(makeCtx([node], { "image-studio": "mcp-tools" }));
    const warnings = result.violations.filter((v) => v.rule === "no-cli-in-mcp");
    expect(warnings).toHaveLength(0);
  });
});

describe("no-circular-package-deps", () => {
  it("detects A→B→A cycle", () => {
    const a = makeNode({
      absPath: "/src/core/a/index.ts",
      relPath: "core/a/index.ts",
      packageName: "a",
      relativeImports: new Set(["/src/core/b/index.ts"]),
    });
    const b = makeNode({
      absPath: "/src/core/b/index.ts",
      relPath: "core/b/index.ts",
      packageName: "b",
      relativeImports: new Set(["/src/core/a/index.ts"]),
    });
    const result = runLint(makeCtx([a, b], { a: "core", b: "core" }));
    const cycles = result.violations.filter((v) => v.rule === "no-circular-package-deps");
    expect(cycles.length).toBeGreaterThanOrEqual(1);
    expect(cycles[0].message).toContain("Circular");
  });

  it("allows acyclic deps", () => {
    const a = makeNode({
      absPath: "/src/core/a/index.ts",
      relPath: "core/a/index.ts",
      packageName: "a",
      relativeImports: new Set(["/src/core/b/index.ts"]),
    });
    const b = makeNode({
      absPath: "/src/core/b/index.ts",
      relPath: "core/b/index.ts",
      packageName: "b",
      relativeImports: new Set(),
    });
    const result = runLint(makeCtx([a, b], { a: "core", b: "core" }));
    const cycles = result.violations.filter((v) => v.rule === "no-circular-package-deps");
    expect(cycles).toHaveLength(0);
  });
});

describe("explicit-category", () => {
  it("warns for packages falling back to utilities", () => {
    const node = makeNode({
      relPath: "utilities/random/index.ts",
      packageName: "random",
    });
    const result = runLint(makeCtx([node], { random: "utilities" }));
    const warnings = result.violations.filter((v) => v.rule === "explicit-category");
    expect(warnings).toHaveLength(1);
    expect(warnings[0].severity).toBe("warning");
  });

  it("no warning for explicitly categorized packages", () => {
    const node = makeNode({
      relPath: "core/shared/index.ts",
      packageName: "shared",
    });
    const result = runLint(makeCtx([node], { shared: "core" }));
    const warnings = result.violations.filter((v) => v.rule === "explicit-category");
    expect(warnings).toHaveLength(0);
  });
});

describe("layer-boundary", () => {
  it("warns when core imports from frontend", () => {
    const coreNode = makeNode({
      absPath: "/src/core/shared/utils.ts",
      relPath: "core/shared/utils.ts",
      packageName: "shared",
      relativeImports: new Set(["/src/frontend/app/Component.tsx"]),
    });
    const frontendNode = makeNode({
      absPath: "/src/frontend/app/Component.tsx",
      relPath: "frontend/app/Component.tsx",
      packageName: "app",
    });
    const result = runLint(makeCtx([coreNode, frontendNode], { shared: "core", app: "frontend" }));
    const layer = result.violations.filter((v) => v.rule === "layer-boundary");
    expect(layer.length).toBeGreaterThanOrEqual(1);
  });

  it("allows frontend importing from core", () => {
    const coreNode = makeNode({
      absPath: "/src/core/shared/utils.ts",
      relPath: "core/shared/utils.ts",
      packageName: "shared",
    });
    const frontendNode = makeNode({
      absPath: "/src/frontend/app/Component.tsx",
      relPath: "frontend/app/Component.tsx",
      packageName: "app",
      relativeImports: new Set(["/src/core/shared/utils.ts"]),
    });
    const result = runLint(makeCtx([coreNode, frontendNode], { shared: "core", app: "frontend" }));
    const layer = result.violations.filter((v) => v.rule === "layer-boundary");
    expect(layer).toHaveLength(0);
  });
});

describe("runLint integration", () => {
  it("passes on clean codebase", () => {
    const node = makeNode({
      relPath: "core/shared/utils.ts",
      packageName: "shared",
      externalDeps: new Set(["zod"]),
    });
    const result = runLint(makeCtx([node], { shared: "core" }));
    expect(result.passed).toBe(true);
    expect(result.stats.rules).toBeGreaterThan(0);
  });

  it("fails when errors exist", () => {
    const node = makeNode({
      relPath: "core/shared/Component.tsx",
      packageName: "shared",
      externalDeps: new Set(["react"]),
    });
    const result = runLint(makeCtx([node], { shared: "core" }));
    expect(result.passed).toBe(false);
    expect(result.stats.errors).toBeGreaterThan(0);
  });

  it("passes with only warnings", () => {
    const node = makeNode({
      relPath: "utilities/random/index.ts",
      packageName: "random",
    });
    const result = runLint(makeCtx([node], { random: "utilities" }));
    expect(result.passed).toBe(true);
    expect(result.stats.warnings).toBeGreaterThan(0);
  });
});
