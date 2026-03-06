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

export function getDependencyGroupName(deps: Set<string>): string {
  if (deps.size === 0) return 'core-logic';

  const has = (name: string) => [...deps].some(d => d.includes(name));

  const tags: string[] = [];
  
  if (has('playwright') || has('testing-library') || has('vitest')) tags.push('testing');
  if (has('ai-sdk') || has('anthropic') || has('google/genai') || has('replicate')) tags.push('ai');
  if (has('drizzle') || has('sql.js') || has('sqlite') || has('better-sqlite3')) tags.push('db');
  if (has('hono')) tags.push('api');
  if (has('remotion')) tags.push('video');
  if (has('commander') || has('dotenv') || has('xterm') || has('readline')) tags.push('cli');
  if (has('react-three')) tags.push('3d');
  if (has('framer-motion') || has('tw-animate')) tags.push('animation');
  if (has('monaco')) tags.push('editor');
  if (has('mcp-server-base') || has('modelcontextprotocol') || has('mcp-image-studio')) tags.push('mcp');
  if (has('cloudflare') || has('workbox')) tags.push('edge');
  
  // React / UI
  if (has('react') || has('radix-ui') || has('lucide') || has('emotion') || has('tailwindcss')) {
      if (!tags.includes('editor') && !tags.includes('video') && !tags.includes('3d')) {
          tags.push('ui');
      }
  }

  // Node built-ins
  if (has('node:') || has('child_process')) {
     if (tags.length === 0) tags.push('node-sys');
  }

  if (tags.length > 0) {
    return tags.slice(0, 3).join('-');
  }

  // fallback: take the first 1-2 deps, sanitize them
  const sorted = Array.from(deps).sort();
  const primary = sorted.slice(0, 2).map(d => d.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''));
  return primary.join('-') || 'misc';
}
