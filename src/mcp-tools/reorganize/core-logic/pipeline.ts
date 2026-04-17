import path from "node:path";
import { spawnSync } from "node:child_process";
import { glob } from "glob";
import { Project } from "ts-morph";

import { excludeGlobs } from "../../../../scripts/reorganize-config.js";
import { readPackagesYaml } from "../../../../scripts/reorganize/utils.js";
import { discoverFiles } from "../../../../scripts/reorganize/discovery.js";
import {
  propagateDeps,
  computePackageCategories,
} from "../../../../scripts/reorganize/grouping.js";
import { computeMovePlans } from "../../../../scripts/reorganize/planning.js";
import type {
  FileNode,
  MovePlan,
  AliasMap,
  ManifestPkg,
} from "../../../../scripts/reorganize/types.js";

export interface PipelineResult {
  project: Project;
  nodes: FileNode[];
  aliasMap: AliasMap;
  packageCategories: Map<string, string>;
  plans: MovePlan[];
  packagesYaml: Record<string, ManifestPkg>;
  srcDir: string;
}

export interface PipelineOptions {
  /**
   * Legacy flag — when true, defaults the diff base to `HEAD` (uncommitted
   * changes). Prefer `since` for an explicit ref.
   */
  incremental?: boolean;
  /**
   * Git ref (e.g. `HEAD~1`, `origin/main`, or a SHA). When set, the pipeline
   * intersects its candidate file set with the output of
   * `git diff --name-only --diff-filter=ACMR <since>...HEAD` and only
   * processes files that appear in both. When unset, every TypeScript file in
   * `srcDir` is processed (full sweep) — identical to legacy behavior.
   *
   * Falls back to the `REORGANIZE_SINCE` environment variable so CI can opt in
   * without changing call sites.
   */
  since?: string;
}

/**
 * Injection seam used by tests to swap the git invocation. Production code
 * should not call this directly — pass `since` to {@link runPipeline} instead.
 */
export interface GitDiffRunner {
  (since: string, cwd: string): string[] | null;
}

function defaultGitDiff(since: string, cwd: string): string[] | null {
  const result = spawnSync(
    "git",
    ["diff", "--name-only", "--diff-filter=ACMR", `${since}...HEAD`],
    { cwd, encoding: "utf-8" },
  );
  if (result.error || result.status !== 0) {
    const reason =
      result.error?.message ?? result.stderr?.trim() ?? `git exited with code ${result.status}`;
    console.warn(
      `[reorganize] git diff failed for since='${since}' (${reason}); falling back to full sweep.`,
    );
    return null;
  }
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

let gitDiffRunner: GitDiffRunner = defaultGitDiff;

/** Test-only helper to override the git diff invocation. */
export function __setGitDiffRunnerForTests(runner: GitDiffRunner | null): void {
  gitDiffRunner = runner ?? defaultGitDiff;
}

function normalizeOptions(arg: PipelineOptions | boolean | undefined): PipelineOptions {
  if (typeof arg === "boolean") return { incremental: arg };
  return arg ?? {};
}

function resolveSince(opts: PipelineOptions): string | undefined {
  if (opts.since && opts.since.length > 0) return opts.since;
  const envSince = process.env.REORGANIZE_SINCE;
  if (envSince && envSince.length > 0) return envSince;
  if (opts.incremental) return "HEAD";
  return undefined;
}

export async function runPipeline(
  srcDir?: string,
  options?: PipelineOptions | boolean,
): Promise<PipelineResult> {
  const opts = normalizeOptions(options);
  const resolvedSrcDir = srcDir
    ? path.resolve(process.cwd(), srcDir)
    : path.resolve(process.cwd(), "src");

  const packagesYaml = await readPackagesYaml();

  const project = new Project({
    tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
  });

  const allFiles = await glob("**/*.{ts,tsx}", {
    cwd: resolvedSrcDir,
    ignore: excludeGlobs,
    absolute: true,
  });

  // Incremental filtering — intersect candidate files with git diff output.
  const since = resolveSince(opts);
  let candidateFiles = allFiles;
  if (since) {
    const diff = gitDiffRunner(since, process.cwd());
    if (diff !== null) {
      const cwd = process.cwd();
      const diffAbs = new Set(
        diff
          .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
          .map((f) => path.resolve(cwd, f)),
      );
      candidateFiles = allFiles.filter((f) => diffAbs.has(f));
    }
    // If diff === null, defaultGitDiff has already logged a warning and we
    // proceed with the full sweep — don't crash the pipeline.
  }

  project.addSourceFilesAtPaths(candidateFiles);

  const { nodes: allNodes, aliasMap } = await discoverFiles(project, resolvedSrcDir);

  // When filtering, candidateFiles is a strict subset of allFiles; intersect
  // discovered nodes against it so callers only see the changed slice.
  const nodes =
    since && candidateFiles.length !== allFiles.length
      ? allNodes.filter((node) => candidateFiles.includes(node.absPath))
      : allNodes;

  propagateDeps(nodes);

  const packageCategories = computePackageCategories(nodes, packagesYaml);
  const plans = computeMovePlans(nodes, packageCategories);

  return {
    project,
    nodes,
    aliasMap,
    packageCategories,
    plans,
    packagesYaml,
    srcDir: resolvedSrcDir,
  };
}
