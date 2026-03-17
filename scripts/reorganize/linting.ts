import path from "node:path";
import type { FileNode, LintViolation, LintContext, LintResult } from "./types.js";
import { lintExceptions } from "../reorganize-config.js";

// ── Layer hierarchy ──────────────────────────────────────────────────────────
// Lower index = lower layer. A layer cannot import from a higher layer.
// "core" is the foundation. "frontend"/"media" are the top.
const LAYERS: Record<string, number> = {
  core: 0,
  utilities: 1,
  "edge-api": 2,
  "mcp-tools": 3,
  cli: 4,
  frontend: 5,
  media: 6,
  testing: 7,
};

function layerOf(category: string): number {
  return LAYERS[category] ?? 1; // unknown → utilities level
}

// ── Forbidden dep sets per category ──────────────────────────────────────────
const FRONTEND_DEPS = new Set([
  "react",
  "react-dom",
  "react-dom/client",
  "@tanstack/react-router",
  "@tanstack/react-query",
]);
const CLI_DEPS = new Set(["commander", "inquirer", "ora", "chalk", "prompts"]);
const BROWSER_ONLY_DEPS = new Set(["monaco-editor", "@monaco-editor/react"]);

// ── Rule implementations ─────────────────────────────────────────────────────

/** R1: Core packages cannot import frontend dependencies */
function noFrontendInCore(ctx: LintContext): LintViolation[] {
  const violations: LintViolation[] = [];
  for (const n of ctx.nodes) {
    const cat = ctx.packageCategories.get(n.packageName);
    if (cat !== "core") continue;
    const bad = [...n.externalDeps].filter((d) => FRONTEND_DEPS.has(d));
    if (bad.length > 0) {
      violations.push({
        rule: "no-frontend-in-core",
        file: n.relPath,
        package: n.packageName,
        message: `Core package imports frontend deps: ${bad.join(", ")}`,
        severity: "error",
      });
    }
  }
  return violations;
}

/** R2: Edge-api packages cannot import frontend dependencies */
function noFrontendInEdge(ctx: LintContext): LintViolation[] {
  const violations: LintViolation[] = [];
  for (const n of ctx.nodes) {
    const cat = ctx.packageCategories.get(n.packageName);
    if (cat !== "edge-api") continue;
    const bad = [...n.externalDeps].filter((d) => FRONTEND_DEPS.has(d));
    if (bad.length > 0) {
      violations.push({
        rule: "no-frontend-in-edge",
        file: n.relPath,
        package: n.packageName,
        message: `Edge package imports frontend deps: ${bad.join(", ")}`,
        severity: "error",
      });
    }
  }
  return violations;
}

/** R3: MCP tools should not import CLI-specific dependencies */
function noCliInMcp(ctx: LintContext): LintViolation[] {
  const violations: LintViolation[] = [];
  for (const n of ctx.nodes) {
    const cat = ctx.packageCategories.get(n.packageName);
    if (cat !== "mcp-tools") continue;
    const bad = [...n.externalDeps].filter((d) => CLI_DEPS.has(d));
    if (bad.length > 0) {
      violations.push({
        rule: "no-cli-in-mcp",
        file: n.relPath,
        package: n.packageName,
        message: `MCP package imports CLI deps: ${bad.join(", ")}`,
        severity: "warning",
      });
    }
  }
  return violations;
}

/** R4: Edge-api cannot import browser-only dependencies */
function noBrowserInEdge(ctx: LintContext): LintViolation[] {
  const violations: LintViolation[] = [];
  for (const n of ctx.nodes) {
    const cat = ctx.packageCategories.get(n.packageName);
    if (cat !== "edge-api") continue;
    const bad = [...n.externalDeps].filter((d) => BROWSER_ONLY_DEPS.has(d));
    if (bad.length > 0) {
      violations.push({
        rule: "no-browser-in-edge",
        file: n.relPath,
        package: n.packageName,
        message: `Edge package imports browser-only deps: ${bad.join(", ")}`,
        severity: "error",
      });
    }
  }
  return violations;
}

/** R5: Detect circular package-level dependencies */
function noCircularPackageDeps(ctx: LintContext): LintViolation[] {
  // Build absPath → packageName lookup
  const pathToPkg = new Map<string, string>();
  for (const n of ctx.nodes) {
    pathToPkg.set(n.absPath, n.packageName);
    const noExt = n.absPath.replace(/\.(tsx?|jsx?)$/, "");
    pathToPkg.set(noExt, n.packageName);
    if (noExt.endsWith("/index")) {
      pathToPkg.set(noExt.slice(0, -6), n.packageName);
    }
  }

  // Build package → Set<package> dependency graph
  const graph = new Map<string, Set<string>>();
  for (const n of ctx.nodes) {
    if (!graph.has(n.packageName)) graph.set(n.packageName, new Set());
    for (const imp of n.relativeImports) {
      const target =
        pathToPkg.get(imp) ||
        pathToPkg.get(imp.replace(/\.(tsx?|jsx?)$/, "")) ||
        pathToPkg.get(imp + "/index");
      if (target && target !== n.packageName) {
        graph.get(n.packageName)!.add(target);
      }
    }
  }

  // Tarjan's SCC to find cycles
  const violations: LintViolation[] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();
  const reported = new Set<string>();

  function dfs(pkg: string, trail: string[]): void {
    if (stack.has(pkg)) {
      const idx = trail.indexOf(pkg);
      const cycle = trail.slice(idx).concat(pkg);
      const key = [...cycle].slice(0, -1).sort().join("↔");
      if (!reported.has(key)) {
        reported.add(key);
        violations.push({
          rule: "no-circular-package-deps",
          file: cycle[0] + "/",
          package: cycle[0],
          message: `Circular: ${cycle.join(" → ")}`,
          severity: "warning",
        });
      }
      return;
    }
    if (visited.has(pkg)) return;
    visited.add(pkg);
    stack.add(pkg);
    for (const dep of graph.get(pkg) || []) {
      dfs(dep, [...trail, pkg]);
    }
    stack.delete(pkg);
  }

  for (const pkg of graph.keys()) dfs(pkg, []);
  return violations;
}

/** R6: Packages with fallback "utilities" category should be explicitly categorized */
function packagesShouldHaveExplicitCategory(ctx: LintContext): LintViolation[] {
  const violations: LintViolation[] = [];
  const seen = new Set<string>();
  for (const n of ctx.nodes) {
    if (seen.has(n.packageName)) continue;
    seen.add(n.packageName);
    const cat = ctx.packageCategories.get(n.packageName);
    if (cat === "utilities") {
      violations.push({
        rule: "explicit-category",
        file: n.packageName + "/",
        package: n.packageName,
        message: `Package '${n.packageName}' has no explicit category — falls back to 'utilities'`,
        severity: "warning",
      });
    }
  }
  return violations;
}

/** R7: Layer boundary enforcement — lower layers cannot import from higher layers */
function enforceLayerBoundaries(ctx: LintContext): LintViolation[] {
  // Build absPath → category lookup
  const pathToCat = new Map<string, string>();
  for (const n of ctx.nodes) {
    const cat = ctx.packageCategories.get(n.packageName) || "utilities";
    pathToPkgCat(n.absPath, cat, pathToCat);
  }

  const violations: LintViolation[] = [];
  for (const n of ctx.nodes) {
    const myCat = ctx.packageCategories.get(n.packageName) || "utilities";
    const myLayer = layerOf(myCat);

    for (const imp of n.relativeImports) {
      const targetCat = resolveCategory(imp, pathToCat);
      if (!targetCat || targetCat === myCat) continue;
      const targetLayer = layerOf(targetCat);
      if (targetLayer > myLayer) {
        violations.push({
          rule: "layer-boundary",
          file: n.relPath,
          package: n.packageName,
          message: `'${myCat}' (layer ${myLayer}) imports from '${targetCat}' (layer ${targetLayer})`,
          severity: "warning",
        });
        break; // one violation per file is enough
      }
    }
  }
  return violations;
}

function pathToPkgCat(absPath: string, cat: string, map: Map<string, string>): void {
  map.set(absPath, cat);
  const noExt = absPath.replace(/\.(tsx?|jsx?)$/, "");
  map.set(noExt, cat);
  if (noExt.endsWith("/index")) map.set(noExt.slice(0, -6), cat);
}

function resolveCategory(imp: string, map: Map<string, string>): string | undefined {
  return map.get(imp) || map.get(imp.replace(/\.(tsx?|jsx?)$/, "")) || map.get(imp + "/index");
}

// ── Rule registry ────────────────────────────────────────────────────────────

const ALL_RULES = [
  {
    name: "no-frontend-in-core",
    description: "Core packages cannot import React/frontend deps",
    fn: noFrontendInCore,
  },
  {
    name: "no-frontend-in-edge",
    description: "Edge-api packages cannot import React/frontend deps",
    fn: noFrontendInEdge,
  },
  {
    name: "no-browser-in-edge",
    description: "Edge-api packages cannot import browser-only deps",
    fn: noBrowserInEdge,
  },
  { name: "no-cli-in-mcp", description: "MCP tools should not import CLI deps", fn: noCliInMcp },
  {
    name: "no-circular-package-deps",
    description: "No circular package-level dependencies",
    fn: noCircularPackageDeps,
  },
  {
    name: "explicit-category",
    description: "Packages should have explicit category",
    fn: packagesShouldHaveExplicitCategory,
  },
  {
    name: "layer-boundary",
    description: "Lower layers cannot import from higher layers",
    fn: enforceLayerBoundaries,
  },
] as const;

// ── Public API ───────────────────────────────────────────────────────────────

export function runLint(ctx: LintContext): LintResult {
  const start = Date.now();
  const allViolations: LintViolation[] = [];

  for (const rule of ALL_RULES) {
    const raw = rule.fn(ctx);
    // Filter known exceptions
    for (const v of raw) {
      const key = `${v.rule}:${v.package}`;
      if (!lintExceptions.has(key)) {
        allViolations.push(v);
      }
    }
  }

  const packages = new Set(ctx.nodes.map((n) => n.packageName));
  const errors = allViolations.filter((v) => v.severity === "error").length;
  const warnings = allViolations.filter((v) => v.severity === "warning").length;

  return {
    violations: allViolations,
    stats: {
      files: ctx.nodes.length,
      packages: packages.size,
      rules: ALL_RULES.length,
      errors,
      warnings,
      duration: Date.now() - start,
    },
    passed: errors === 0,
  };
}

/** List available rules (for --help) */
export function listRules(): Array<{ name: string; description: string }> {
  return ALL_RULES.map((r) => ({ name: r.name, description: r.description }));
}

/**
 * Backward-compatible entry point used by the main script.
 * Returns error count (non-zero = fail).
 */
export function checkLint(
  nodes: FileNode[],
  packageCategories: Map<string, string>,
  categoryDirs?: Set<string>,
): number {
  const result = runLint({
    nodes,
    packageCategories,
    categoryDirs: categoryDirs || new Set(),
  });

  for (const v of result.violations) {
    const icon = v.severity === "error" ? "✗" : "⚠";
    console.warn(`  ${icon} [${v.rule}] ${v.package}/${path.basename(v.file)}: ${v.message}`);
  }

  return result.stats.errors;
}
