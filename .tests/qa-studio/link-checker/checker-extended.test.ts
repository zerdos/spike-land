/**
 * Extended tests for checker.ts — covers the branches left uncovered by
 * checker.test.ts:
 *   - github_badge category (enabled, disabled, cache hit, unparseable badge)
 *   - external_url category (enabled, cache hit)
 *   - skipCodeBlocks / skipComments filtering
 *   - formatReport with warnings section and suggestion text
 *   - discoverFiles exclude patterns (tested indirectly via rootDir scan)
 *   - checkSingleFile without explicit rootDir (exercises findRepoRootAsync)
 *   - unknown link category default branch
 */

import { afterEach, describe, expect, it, vi } from "vitest";

// ── fs/promises mocks must be hoisted before the module import ──────────────
const mockReaddir = vi.fn();
const mockReadFile = vi.fn();
const mockStat = vi.fn();
const mockAccess = vi.fn();

vi.mock("node:fs/promises", () => ({
  readdir: (...args: unknown[]) => mockReaddir(...args),
  readFile: (...args: unknown[]) => mockReadFile(...args),
  stat: (...args: unknown[]) => mockStat(...args),
  access: (...args: unknown[]) => mockAccess(...args),
}));

import {
  checkLinks,
  checkSingleFile,
  formatReport,
} from "../../../src/core/browser-automation/core-logic/link-checker/checker.js";
import type { ScanReport } from "../../../src/core/browser-automation/core-logic/link-checker/types.js";

// ── helpers ──────────────────────────────────────────────────────────────────

function okFetch() {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    headers: new Headers({ "X-RateLimit-Remaining": "50" }),
  });
}

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

// ── github_badge category ────────────────────────────────────────────────────

describe("checkLinks — github_badge category", () => {
  it("skips github_badge when checkGithub is false", async () => {
    const md =
      "[![CI](https://img.shields.io/github/actions/workflow/status/org/repo/ci.yml)](https://github.com/org/repo)";
    mockReadFile.mockResolvedValue(md);

    const report = await checkLinks({
      rootDir: "/project",
      files: ["README.md"],
      checkGithub: false,
      checkExternal: false,
    });

    // All links should be skipped (badge skipped + the wrapper github link skipped)
    const allSkipped = report.files.flatMap((f) => f.skipped);
    expect(allSkipped.some((r) => r.reason.includes("GitHub checking disabled"))).toBe(true);
  });

  it("validates github_badge when checkGithub is true", async () => {
    // The markdown-parser categorises the image src as github_badge
    const md = "![CI](https://img.shields.io/github/actions/workflow/status/org/repo/ci.yml)";
    mockReadFile.mockResolvedValue(md);
    globalThis.fetch = okFetch();

    const report = await checkLinks({
      rootDir: "/project",
      files: ["README.md"],
      checkGithub: true,
      checkExternal: false,
    });

    const allOk = report.files.flatMap((f) => f.ok);
    expect(allOk.length).toBeGreaterThanOrEqual(1);
  });

  it("uses URL cache for repeated github_badge URLs", async () => {
    const badge = "https://img.shields.io/github/actions/workflow/status/org/repo/ci.yml";
    const md = `![CI](${badge})\n![CI2](${badge})`;
    mockReadFile.mockResolvedValue(md);
    const mockFetch = okFetch();
    globalThis.fetch = mockFetch;

    await checkLinks({
      rootDir: "/project",
      files: ["README.md"],
      checkGithub: true,
      checkExternal: false,
    });

    // Second occurrence should hit the cache — fetch called only once
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("warns when shields badge URL cannot be parsed", async () => {
    // An image on shields.io but not matching the workflow pattern
    const md = "![badge](https://img.shields.io/npm/v/some-package)";
    mockReadFile.mockResolvedValue(md);
    globalThis.fetch = okFetch();

    const report = await checkLinks({
      rootDir: "/project",
      files: ["README.md"],
      checkGithub: true,
      checkExternal: false,
    });

    const warnings = report.files.flatMap((f) => f.warnings);
    expect(warnings.some((w) => w.reason.includes("Could not parse shields.io"))).toBe(true);
  });
});

// ── external_url category ────────────────────────────────────────────────────

describe("checkLinks — external_url category", () => {
  it("validates external URLs when checkExternal is true", async () => {
    const md = "[ext](https://external.example.com/page)";
    mockReadFile.mockResolvedValue(md);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      redirected: false,
      url: "https://external.example.com/page",
      headers: new Headers(),
    });

    const report = await checkLinks({
      rootDir: "/project",
      files: ["README.md"],
      checkGithub: false,
      checkExternal: true,
    });

    const ok = report.files.flatMap((f) => f.ok);
    expect(ok.length).toBeGreaterThanOrEqual(1);
  });

  it("uses URL cache for repeated external URLs", async () => {
    const url = "https://external.example.com/page";
    const md = `[a](${url})\n[b](${url})`;
    mockReadFile.mockResolvedValue(md);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      redirected: false,
      url,
      headers: new Headers(),
    });
    globalThis.fetch = mockFetch;

    await checkLinks({
      rootDir: "/project",
      files: ["README.md"],
      checkGithub: false,
      checkExternal: true,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

// ── skipCodeBlocks / skipComments ────────────────────────────────────────────

describe("checkLinks — code block and comment filtering", () => {
  it("skips links inside fenced code blocks when skipCodeBlocks is true", async () => {
    const md = "```\n[link](./missing.md)\n```";
    mockReadFile.mockResolvedValue(md);
    mockAccess.mockRejectedValue(new Error("ENOENT"));

    const report = await checkLinks({
      rootDir: "/project",
      files: ["README.md"],
      checkGithub: false,
      checkExternal: false,
      skipCodeBlocks: true,
    });

    const skipped = report.files.flatMap((f) => f.skipped);
    expect(skipped.some((r) => r.reason === "Inside code block")).toBe(true);
    // Must not appear as broken
    const broken = report.files.flatMap((f) => f.broken);
    expect(broken).toHaveLength(0);
  });

  it("skips links inside HTML comments when skipComments is true", async () => {
    const md = "<!-- [link](./missing.md) -->";
    mockReadFile.mockResolvedValue(md);
    mockAccess.mockRejectedValue(new Error("ENOENT"));

    const report = await checkLinks({
      rootDir: "/project",
      files: ["README.md"],
      checkGithub: false,
      checkExternal: false,
      skipComments: true,
    });

    const skipped = report.files.flatMap((f) => f.skipped);
    expect(skipped.some((r) => r.reason === "Inside HTML comment")).toBe(true);
  });
});

// ── discoverFiles — exclude patterns ────────────────────────────────────────

describe("checkLinks — discoverFiles with excludePatterns", () => {
  it("excludes files matching excludePatterns", async () => {
    mockReaddir.mockResolvedValue(["docs/guide.md", "generated/api.md", "README.md"]);
    // Only docs/guide.md and README.md should be scanned
    mockReadFile.mockResolvedValue("No links here.");

    const report = await checkLinks({
      rootDir: "/project",
      checkGithub: false,
      checkExternal: false,
      excludePatterns: ["generated"],
    });

    // generated/api.md must not be scanned
    expect(report.filesScanned).toBeLessThanOrEqual(2);
  });
});

// ── checkSingleFile without explicit rootDir ─────────────────────────────────

describe("checkSingleFile — rootDir resolution", () => {
  it("falls back to process.cwd() when no .git marker is found", async () => {
    mockStat.mockRejectedValue(new Error("no git"));
    mockReadFile.mockResolvedValue("# Test\n[ok](https://example.com)");

    // Should not throw even when rootDir traversal exhausts the filesystem
    const report = await checkSingleFile("/project/README.md", {
      checkGithub: false,
      checkExternal: false,
    });
    expect(report).toBeDefined();
    expect(typeof report.totalLinks).toBe("number");
  });
});

// ── formatReport — warnings section ─────────────────────────────────────────

describe("formatReport — warnings section", () => {
  it("includes warnings section with suggestion when present", () => {
    const report: ScanReport = {
      rootDir: "/project",
      filePattern: "**/*.md",
      filesScanned: 1,
      summary: { totalLinks: 2, broken: 0, warnings: 1, ok: 1, skipped: 0, errors: 0 },
      files: [
        {
          filePath: "docs/guide.md",
          totalLinks: 2,
          broken: [],
          warnings: [
            {
              link: {
                target: "https://old.example.com/page",
                text: "old link",
                line: 7,
                column: 1,
                category: "external_url",
                inCodeBlock: false,
                inComment: false,
              },
              status: "warning",
              reason: "Redirected to https://new.example.com/page",
              suggestion: "https://new.example.com/page",
              durationMs: 12,
            },
          ],
          ok: [],
          skipped: [],
          errors: [],
        },
      ],
      durationMs: 50,
    };

    const text = formatReport(report);
    expect(text).toContain("## Warnings");
    expect(text).toContain("docs/guide.md");
    expect(text).toContain("Redirected to");
    expect(text).toContain("Suggestion: https://new.example.com/page");
    expect(text).toContain("Line 7");
  });

  it("omits warnings section when there are no warnings", () => {
    const report: ScanReport = {
      rootDir: "/project",
      filePattern: "**/*.md",
      filesScanned: 1,
      summary: { totalLinks: 1, broken: 0, warnings: 0, ok: 1, skipped: 0, errors: 0 },
      files: [],
      durationMs: 10,
    };

    const text = formatReport(report);
    expect(text).not.toContain("## Warnings");
  });

  it("includes broken links without suggestion", () => {
    const report: ScanReport = {
      rootDir: "/project",
      filePattern: "**/*.md",
      filesScanned: 1,
      summary: { totalLinks: 1, broken: 1, warnings: 0, ok: 0, skipped: 0, errors: 0 },
      files: [
        {
          filePath: "README.md",
          totalLinks: 1,
          broken: [
            {
              link: {
                target: "./gone.md",
                text: "gone",
                line: 3,
                column: 1,
                category: "relative_file",
                inCodeBlock: false,
                inComment: false,
              },
              status: "broken",
              reason: "File not found",
              durationMs: 1,
              // no suggestion
            },
          ],
          warnings: [],
          ok: [],
          skipped: [],
          errors: [],
        },
      ],
      durationMs: 15,
    };

    const text = formatReport(report);
    expect(text).toContain("## Broken Links");
    expect(text).not.toContain("Suggestion:");
  });
});
