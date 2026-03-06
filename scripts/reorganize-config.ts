export const excludedDeps = new Set([
  "@modelcontextprotocol/sdk",
  "zod",
  "vitest",
  "mcp-server-base",
  "types", // assuming local types package
  "typescript",
  "@types/node",
]);

export interface CategoryRule {
  predicate: (deps: Set<string>, originalDeps: Set<string>, pkgKind?: string) => boolean;
  category: string;
}

export const categoryRules: CategoryRule[] = [
  {
    predicate: (_, originalDeps) => originalDeps.has("@modelcontextprotocol/sdk"),
    category: "mcp-tools",
  },
  {
    predicate: (_, originalDeps) => originalDeps.has("react") || originalDeps.has("react-dom"),
    category: "frontend",
  },
  {
    predicate: (_, originalDeps) => originalDeps.has("hono"),
    category: "edge-api",
  },
  {
    predicate: (_, originalDeps) => originalDeps.has("remotion"),
    category: "media",
  },
  {
    predicate: (_, originalDeps) => originalDeps.has("commander"),
    category: "cli",
  },
  {
    predicate: (_, originalDeps) => originalDeps.has("playwright") || originalDeps.has("@playwright/test"),
    category: "testing",
  },
  {
    predicate: (_, __, pkgKind) => pkgKind === "library",
    category: "core",
  },
];

export const fallbackCategory = "utilities";

export const nameOverrides: Record<string, string> = {
  "spike-app": "platform-frontend",
  "spike-edge": "edge-api",
  "spike-land-backend": "backend",
  "code": "monaco-editor",
  "react-ts-worker": "react-engine",
  "shared": "shared-utils",
  "video": "educational-videos",
  "chess-engine": "chess",
  "qa-studio": "browser-automation",
  "state-machine": "statecharts",
  "vibe-dev": "docker-dev",
  "spike-cli": "cli",
  "spike-review": "code-review",
};

export const excludeGlobs = [
  "**/dist/**",
  "**/node_modules/**",
  "**/*.d.ts",
  "**/routeTree.gen.ts",
];
