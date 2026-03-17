export interface FileNode {
  absPath: string;
  relPath: string; // relative to src/
  packageName: string;
  externalDeps: Set<string>;
  relativeImports: Set<string>; // abs paths
  resolvedDeps?: Set<string>; // inherited via transitive propagation
}

export interface MovePlan {
  fileNode: FileNode;
  targetDir: string;
  targetFileName: string;
  targetRelPath: string; // new path relative to output dir
}

export interface ManifestPkg {
  kind?: string;
}

/** Per-package alias map: packageName → { prefix: "@/", baseDir: absolute path } */
export type AliasMap = Map<string, { prefix: string; baseDir: string }>;

// ── Lint types ───────────────────────────────────────────────────────────────

export type Severity = "error" | "warning";

export interface LintViolation {
  rule: string;
  file: string;
  package: string;
  message: string;
  severity: Severity;
}

export interface LintResult {
  violations: LintViolation[];
  stats: {
    files: number;
    packages: number;
    rules: number;
    errors: number;
    warnings: number;
    duration: number; // ms
  };
  passed: boolean; // true if zero errors (warnings don't fail)
}

export interface LintContext {
  nodes: FileNode[];
  packageCategories: Map<string, string>;
  categoryDirs: Set<string>;
}

// ── CLI types ────────────────────────────────────────────────────────────────

export interface CliOptions {
  apply: boolean;
  verify: boolean;
  diff: boolean;
  watch: boolean;
  lint: boolean;
  incremental: boolean;
  json: boolean;
  src: string;
  output: string;
}
