import { describe, it, expect } from "vitest";
import { computeMovePlans } from "../../scripts/reorganize/planning.js";
import { propagateDeps } from "../../scripts/reorganize/grouping.js";
import type { FileNode } from "../../scripts/reorganize/types.js";
import path from "node:path";

function makeNode(relPath: string, packageName: string, externalDeps: string[] = []): FileNode {
  const node: FileNode = {
    absPath: `/src/${relPath}`,
    relPath,
    packageName,
    externalDeps: new Set(externalDeps),
    relativeImports: new Set(),
  };
  return node;
}

describe("computeMovePlans", () => {
  it("produces one plan per node", () => {
    const nodes = [
      makeNode("my-pkg/handler.ts", "my-pkg", ["hono"]),
      makeNode("my-pkg/utils.ts", "my-pkg"),
    ];
    for (const n of nodes) propagateDeps([n]);
    const categories = new Map([["my-pkg", "edge-api"]]);

    const plans = computeMovePlans(nodes, categories);
    expect(plans).toHaveLength(2);
  });

  it("assigns correct targetDir based on category and package name", () => {
    const node = makeNode("spike-edge/index.ts", "spike-edge", ["hono"]);
    propagateDeps([node]);
    const categories = new Map([["spike-edge", "edge-api"]]);

    const plans = computeMovePlans([node], categories);
    // spike-edge → nameOverride "main"; hono → "api" dep group
    expect(plans[0].targetDir).toBe(path.join("edge-api", "main", "api"));
  });

  it("places test files in __tests__ subdirectory", () => {
    const node = makeNode("my-pkg/handler.test.ts", "my-pkg");
    propagateDeps([node]);
    const categories = new Map([["my-pkg", "utilities"]]);

    const plans = computeMovePlans([node], categories);
    expect(plans[0].targetDir).toContain("__tests__");
  });

  it("disambiguates files with the same target path within the same package", () => {
    // Two files in the same package with the same basename after flattening
    // (e.g. both would be flattened to "utils.ts" in the same targetDir)
    const nodeA = makeNode("my-pkg/sub-a/utils.ts", "my-pkg");
    const nodeB = makeNode("my-pkg/sub-b/utils.ts", "my-pkg");
    for (const n of [nodeA, nodeB]) propagateDeps([n]);
    const categories = new Map([["my-pkg", "utilities"]]);

    const plans = computeMovePlans([nodeA, nodeB], categories);
    const fileNames = plans.map((p) => p.targetFileName);
    // Both should get unique names — one keeps "utils.ts", the other gets suffixed with package name
    expect(new Set(fileNames).size).toBe(2);
  });

  it("respects fallback category for unknown packages", () => {
    const node = makeNode("unknown-pkg/misc.ts", "unknown-pkg");
    propagateDeps([node]);
    const categories = new Map<string, string>(); // empty — no category assigned

    const plans = computeMovePlans([node], categories);
    // Falls back to "utilities" category
    expect(plans[0].targetDir.startsWith("utilities")).toBe(true);
  });

  it("splits oversized buckets using relative directory structure", () => {
    // Create MAX_BUCKET_SIZE+1 files in the same bucket
    const MAX = 3;
    const nodes = Array.from({ length: MAX + 1 }, (_, i) =>
      makeNode(`bulk-pkg/sub/file${i}.ts`, "bulk-pkg"),
    );
    for (const n of nodes) propagateDeps([n]);
    const categories = new Map([["bulk-pkg", "utilities"]]);

    const plans = computeMovePlans(nodes, categories, MAX);
    // When bucket overflows, subdirectory structure from relPath is preserved
    const withSubDir = plans.filter((p) => p.targetDir.includes("sub"));
    expect(withSubDir.length).toBeGreaterThan(0);
  });
});
