import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";

// ── Mocks for the heavyweight collaborators in the pipeline ──────────────────
// We mock everything *except* the diff-filtering logic itself so the test stays
// focused on the new behavior in pipeline.ts.

const readPackagesYamlMock = vi.fn();
vi.mock("../../scripts/reorganize/utils.js", () => ({
  readPackagesYaml: readPackagesYamlMock,
  extractRootPackage: (p: string) => p.split(path.sep)[0] ?? p,
}));

interface FakeNode {
  absPath: string;
  relPath: string;
  packageName: string;
  externalDeps: Set<string>;
  relativeImports: Set<string>;
}

const discoverFilesMock = vi.fn(async (project: { getSourceFiles: () => unknown[] }) => {
  // Build one FakeNode per source file added to the project.
  const sourceFiles = project.getSourceFiles() as Array<{ getFilePath: () => string }>;
  const nodes: FakeNode[] = sourceFiles.map((sf) => {
    const absPath = sf.getFilePath();
    return {
      absPath,
      relPath: path.basename(absPath),
      packageName: "fakepkg",
      externalDeps: new Set<string>(),
      relativeImports: new Set<string>(),
    };
  });
  return { nodes, aliasMap: new Map() };
});
vi.mock("../../scripts/reorganize/discovery.js", () => ({
  discoverFiles: discoverFilesMock,
}));

vi.mock("../../scripts/reorganize/grouping.js", () => ({
  propagateDeps: vi.fn(),
  computePackageCategories: vi.fn(() => new Map<string, string>()),
}));

vi.mock("../../scripts/reorganize/planning.js", () => ({
  computeMovePlans: vi.fn(() => []),
}));

vi.mock("../../scripts/reorganize-config.js", () => ({
  excludeGlobs: [],
}));

// ts-morph's Project — we only need addSourceFilesAtPaths + getSourceFiles.
vi.mock("ts-morph", () => {
  class Project {
    private files: string[] = [];
    constructor(_opts: unknown) {}
    addSourceFilesAtPaths(paths: string[]): void {
      this.files.push(...paths);
    }
    getSourceFiles(): Array<{ getFilePath: () => string }> {
      return this.files.map((p) => ({ getFilePath: () => p }));
    }
  }
  return { Project };
});

// ── Lazy import so all mocks are in place first ──────────────────────────────
const { runPipeline, __setGitDiffRunnerForTests } = await import(
  "../../src/mcp-tools/reorganize/core-logic/pipeline.js"
);

// ── Test fixtures ────────────────────────────────────────────────────────────

let tmpDir: string;
let originalCwd: string;
let warnSpy: ReturnType<typeof vi.spyOn>;

async function makeFile(rel: string): Promise<string> {
  const abs = path.join(tmpDir, rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, "export {};\n");
  return abs;
}

beforeEach(async () => {
  vi.clearAllMocks();
  delete process.env.REORGANIZE_SINCE;

  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "reorg-pipeline-"));
  originalCwd = process.cwd();
  process.chdir(tmpDir);

  await makeFile("src/a.ts");
  await makeFile("src/b.ts");
  await makeFile("src/c.tsx");

  // tsconfig.json must exist so ts-morph Project init does not throw — our
  // mock ignores it but the real constructor would need it.
  await fs.writeFile(path.join(tmpDir, "tsconfig.json"), "{}");

  readPackagesYamlMock.mockResolvedValue({});
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(async () => {
  __setGitDiffRunnerForTests(null);
  process.chdir(originalCwd);
  await fs.rm(tmpDir, { recursive: true, force: true });
  warnSpy.mockRestore();
});

describe("runPipeline incremental filtering", () => {
  it("processes all files when `since` is unset (full sweep, unchanged behavior)", async () => {
    const result = await runPipeline("src");
    const paths = result.nodes.map((n) => path.basename(n.absPath)).sort();
    expect(paths).toEqual(["a.ts", "b.ts", "c.tsx"]);
  });

  it("filters to only the diff'd files when `since` is set", async () => {
    __setGitDiffRunnerForTests((since, _cwd) => {
      expect(since).toBe("origin/main");
      // Only b.ts changed.
      return ["src/b.ts"];
    });

    const result = await runPipeline("src", { since: "origin/main" });
    const paths = result.nodes.map((n) => path.basename(n.absPath));
    expect(paths).toEqual(["b.ts"]);
  });

  it("reads REORGANIZE_SINCE env var as a fallback", async () => {
    process.env.REORGANIZE_SINCE = "HEAD~1";
    let observed: string | undefined;
    __setGitDiffRunnerForTests((since, _cwd) => {
      observed = since;
      return ["src/a.ts", "src/c.tsx"];
    });

    const result = await runPipeline("src");
    expect(observed).toBe("HEAD~1");
    const paths = result.nodes.map((n) => path.basename(n.absPath)).sort();
    expect(paths).toEqual(["a.ts", "c.tsx"]);
  });

  it("explicit `since` option overrides the env var", async () => {
    process.env.REORGANIZE_SINCE = "HEAD~5";
    let observed: string | undefined;
    __setGitDiffRunnerForTests((since, _cwd) => {
      observed = since;
      return ["src/a.ts"];
    });

    await runPipeline("src", { since: "feature-branch" });
    expect(observed).toBe("feature-branch");
  });

  it("falls back to a full sweep with a warning when git diff fails", async () => {
    __setGitDiffRunnerForTests(() => {
      // Simulate the production path: defaultGitDiff logged + returned null.
      console.warn("[reorganize] git diff failed for since='bad-ref'; falling back to full sweep.");
      return null;
    });

    const result = await runPipeline("src", { since: "bad-ref" });
    const paths = result.nodes.map((n) => path.basename(n.absPath)).sort();
    expect(paths).toEqual(["a.ts", "b.ts", "c.tsx"]);
    expect(warnSpy).toHaveBeenCalled();
    const message = warnSpy.mock.calls[0][0] as string;
    expect(message).toContain("git diff failed");
  });

  it("ignores non-TypeScript entries from the diff", async () => {
    __setGitDiffRunnerForTests(() => ["src/a.ts", "README.md", "package.json"]);

    const result = await runPipeline("src", { since: "HEAD~1" });
    const paths = result.nodes.map((n) => path.basename(n.absPath));
    expect(paths).toEqual(["a.ts"]);
  });

  it("returns an empty node set when the diff has no overlap with src/", async () => {
    __setGitDiffRunnerForTests(() => ["docs/changelog.md", "scripts/foo.ts"]);

    const result = await runPipeline("src", { since: "HEAD~1" });
    expect(result.nodes).toEqual([]);
  });

  it("legacy boolean second argument (true) defaults `since` to HEAD", async () => {
    let observed: string | undefined;
    __setGitDiffRunnerForTests((since) => {
      observed = since;
      return ["src/a.ts"];
    });

    await runPipeline("src", true);
    expect(observed).toBe("HEAD");
  });

  it("legacy boolean second argument (false) leaves the full sweep intact", async () => {
    const runner = vi.fn(() => ["src/a.ts"]);
    __setGitDiffRunnerForTests(runner);

    const result = await runPipeline("src", false);
    expect(runner).not.toHaveBeenCalled();
    expect(result.nodes).toHaveLength(3);
  });
});
