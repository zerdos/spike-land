import { describe, it, expect } from "vitest";
import { flattenFilename } from "../../scripts/reorganize/flatten.js";
import path from "node:path";

describe("flattenFilename", () => {
  it("returns filename unchanged for non-index files", () => {
    const relPath = path.join("some-pkg", "core-logic", "utils.ts");
    expect(flattenFilename(relPath, "some-pkg")).toBe("utils.ts");
  });

  it("returns index.ts unchanged when it is directly in the package root", () => {
    // Only 1 segment before the filename — no parent to prefix with
    const relPath = "index.ts";
    expect(flattenFilename(relPath, "some-pkg")).toBe("index.ts");
  });

  it("prefixes index.ts with its parent directory name when nested", () => {
    const relPath = path.join("some-pkg", "core-logic", "index.ts");
    expect(flattenFilename(relPath, "some-pkg")).toBe("core-logic-index.ts");
  });

  it("prefixes index.tsx with its parent directory name when nested", () => {
    const relPath = path.join("some-pkg", "ui", "index.tsx");
    expect(flattenFilename(relPath, "some-pkg")).toBe("ui-index.tsx");
  });

  it("handles deeply nested index files", () => {
    const relPath = path.join("pkg", "a", "b", "c", "index.ts");
    expect(flattenFilename(relPath, "pkg")).toBe("c-index.ts");
  });

  it("handles files without extension", () => {
    const relPath = path.join("pkg", "Makefile");
    expect(flattenFilename(relPath, "pkg")).toBe("Makefile");
  });
});
