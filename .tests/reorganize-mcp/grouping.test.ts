import { describe, it, expect } from "vitest";
import {
  buildNodeLookup,
  resolveImportTarget,
  propagateDeps,
  computePackageCategories,
  resolveAppName,
} from "../../scripts/reorganize/grouping.js";
import type { FileNode } from "../../scripts/reorganize/types.js";

function makeNode(opts: Partial<FileNode> & { absPath: string; packageName: string }): FileNode {
  return {
    relPath: opts.relPath ?? opts.absPath.split("/").pop() ?? "file.ts",
    externalDeps: opts.externalDeps ?? new Set(),
    relativeImports: opts.relativeImports ?? new Set(),
    resolvedDeps: opts.resolvedDeps,
    ...opts,
  };
}

describe("buildNodeLookup", () => {
  it("indexes nodes by absPath", () => {
    const node = makeNode({ absPath: "/src/pkg/index.ts", packageName: "pkg" });
    const lookup = buildNodeLookup([node]);
    expect(lookup.get("/src/pkg/index.ts")).toBe(node);
  });

  it("indexes nodes by path without extension", () => {
    const node = makeNode({ absPath: "/src/pkg/utils.ts", packageName: "pkg" });
    const lookup = buildNodeLookup([node]);
    expect(lookup.get("/src/pkg/utils")).toBe(node);
  });

  it("indexes index files by parent directory", () => {
    const node = makeNode({ absPath: "/src/pkg/core-logic/index.ts", packageName: "pkg" });
    const lookup = buildNodeLookup([node]);
    // /src/pkg/core-logic/index → /src/pkg/core-logic
    expect(lookup.get("/src/pkg/core-logic")).toBe(node);
  });
});

describe("resolveImportTarget", () => {
  it("resolves exact match", () => {
    const node = makeNode({ absPath: "/src/pkg/utils.ts", packageName: "pkg" });
    const lookup = buildNodeLookup([node]);
    expect(resolveImportTarget("/src/pkg/utils.ts", lookup)).toBe(node);
  });

  it("resolves path without extension", () => {
    const node = makeNode({ absPath: "/src/pkg/utils.ts", packageName: "pkg" });
    const lookup = buildNodeLookup([node]);
    expect(resolveImportTarget("/src/pkg/utils", lookup)).toBe(node);
  });

  it("resolves to index file via directory path", () => {
    const node = makeNode({ absPath: "/src/pkg/helpers/index.ts", packageName: "pkg" });
    const lookup = buildNodeLookup([node]);
    expect(resolveImportTarget("/src/pkg/helpers", lookup)).toBe(node);
  });

  it("returns undefined for unknown paths", () => {
    const lookup = buildNodeLookup([]);
    expect(resolveImportTarget("/src/unknown", lookup)).toBeUndefined();
  });
});

describe("propagateDeps", () => {
  it("sets resolvedDeps from externalDeps on a single node", () => {
    const node = makeNode({
      absPath: "/src/pkg/a.ts",
      packageName: "pkg",
      externalDeps: new Set(["react"]),
    });
    propagateDeps([node]);
    expect(node.resolvedDeps?.has("react")).toBe(true);
  });

  it("propagates transitive dependencies through relative imports", () => {
    const dep = makeNode({
      absPath: "/src/pkg/b.ts",
      packageName: "pkg",
      externalDeps: new Set(["drizzle-orm"]),
    });
    const main = makeNode({
      absPath: "/src/pkg/a.ts",
      packageName: "pkg",
      externalDeps: new Set(["react"]),
      relativeImports: new Set(["/src/pkg/b"]),
    });

    propagateDeps([dep, main]);

    // main should now have both react (direct) and drizzle-orm (transitive)
    expect(main.resolvedDeps?.has("react")).toBe(true);
    expect(main.resolvedDeps?.has("drizzle-orm")).toBe(true);
  });

  it("handles nodes with no imports without errors", () => {
    const node = makeNode({
      absPath: "/src/pkg/standalone.ts",
      packageName: "pkg",
      externalDeps: new Set(),
    });
    expect(() => propagateDeps([node])).not.toThrow();
    expect(node.resolvedDeps).toBeDefined();
  });

  it("terminates when circular imports exist", () => {
    const a = makeNode({
      absPath: "/src/pkg/a.ts",
      packageName: "pkg",
      externalDeps: new Set(["lodash"]),
      relativeImports: new Set(["/src/pkg/b"]),
    });
    const b = makeNode({
      absPath: "/src/pkg/b.ts",
      packageName: "pkg",
      externalDeps: new Set(["zod"]),
      relativeImports: new Set(["/src/pkg/a"]),
    });
    // Should not hang — loop limit is 10 rounds
    propagateDeps([a, b]);
    expect(a.resolvedDeps?.has("zod")).toBe(true);
    expect(b.resolvedDeps?.has("lodash")).toBe(true);
  });
});

describe("computePackageCategories", () => {
  it("uses packages.yaml kind to determine category", () => {
    const node = makeNode({
      absPath: "/src/my-cli/main.ts",
      packageName: "my-cli",
      externalDeps: new Set(),
    });
    propagateDeps([node]);

    const result = computePackageCategories([node], { "my-cli": { kind: "cli" } });
    expect(result.get("my-cli")).toBe("cli");
  });

  it("falls back to file-level dep rules when kind is missing", () => {
    const node = makeNode({
      absPath: "/src/my-pkg/handler.ts",
      packageName: "my-pkg",
      externalDeps: new Set(["hono"]),
    });
    propagateDeps([node]);

    const result = computePackageCategories([node], {});
    expect(result.get("my-pkg")).toBe("edge-api");
  });

  it("classifies frontend packages by react dep", () => {
    const node = makeNode({
      absPath: "/src/ui-pkg/app.tsx",
      packageName: "ui-pkg",
      externalDeps: new Set(["react"]),
    });
    propagateDeps([node]);

    const result = computePackageCategories([node], {});
    expect(result.get("ui-pkg")).toBe("frontend");
  });

  it("returns fallback category when no rules match", () => {
    const node = makeNode({
      absPath: "/src/misc/helper.ts",
      packageName: "misc",
      externalDeps: new Set(["lodash"]),
    });
    propagateDeps([node]);

    const result = computePackageCategories([node], {});
    // No rules match lodash, falls back to "utilities"
    expect(result.get("misc")).toBe("utilities");
  });

  it("uses majority category when package has mixed files", () => {
    const files = ["a", "b", "c"].map((name) =>
      makeNode({
        absPath: `/src/mixed/${name}.ts`,
        packageName: "mixed",
        externalDeps: new Set(["hono"]),
      }),
    );
    const reactFile = makeNode({
      absPath: "/src/mixed/component.tsx",
      packageName: "mixed",
      externalDeps: new Set(["react"]),
    });
    const nodes = [...files, reactFile];
    for (const n of nodes) propagateDeps([n]);

    const result = computePackageCategories(nodes, {});
    // 3 hono files → edge-api, 1 react file → frontend; majority wins
    expect(result.get("mixed")).toBe("edge-api");
  });
});

describe("resolveAppName", () => {
  it("uses nameOverrides when available", () => {
    expect(resolveAppName("spike-edge")).toBe("main");
    expect(resolveAppName("spike-app")).toBe("platform-frontend");
  });

  it("strips -mcp suffix for unknown packages", () => {
    expect(resolveAppName("my-tool-mcp")).toBe("my-tool");
  });

  it("strips mcp- prefix for unknown packages", () => {
    expect(resolveAppName("mcp-my-tool")).toBe("my-tool");
  });

  it("returns the name unchanged when no override or suffix applies", () => {
    expect(resolveAppName("state-machine")).toBe("statecharts");
  });

  it("returns plain name for packages with no special handling", () => {
    expect(resolveAppName("my-plain-package")).toBe("my-plain-package");
  });
});
