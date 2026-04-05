# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Overview

This is the **spike-land-ai** consolidated monorepo under the `@spike-land-ai`
GitHub org. Source code lives under `src/` and publishable packages live under
`packages/` as deploy shims. The root `package.json` uses two Yarn workspace
globs: `"workspaces": ["packages/*", "src/monaco-editor"]`.

All packages are published to GitHub Packages (`npm.pkg.github.com`) under the
`@spike-land-ai` scope using Changesets. CI/CD is shared via a reusable workflow
in `.github/.github/workflows/ci-publish.yml`.

## Packages

Publishable packages live under `packages/` as deploy shims. Each shim's
`index.ts` re-exports from its source directory under `src/`. The actual
TypeScript source is under `src/` — always edit there.

### Edge Services (Cloudflare Workers)

| Package (packages/)       | Source dir                          | Purpose                                                  |
| ------------------------- | ----------------------------------- | -------------------------------------------------------- |
| `spike-edge`              | `src/edge-api/main`                 | Primary edge API — Hono, proxy routes, experiments       |
| `spike-land-mcp`          | `src/edge-api/spike-land`           | MCP registry — 80+ tools, D1-backed, OAuth               |
| `mcp-auth`                | `src/edge-api/auth`                 | Auth service — Better Auth + Drizzle                     |
| `spike-land-backend`      | `src/edge-api/backend`              | Durable Objects for real-time sync (Hono)                |
| `transpile`               | `src/edge-api/transpile`            | On-demand JS/TS transpilation via esbuild-wasm           |
| `spike-chat`              | `src/edge-api/spike-chat`           | Chat API with context compression                        |
| `image-studio-worker`     | `src/edge-api/image-studio-worker`  | AI image generation edge worker                          |

### Frontend

| Package (packages/)       | Source dir                          | Purpose                                                  |
| ------------------------- | ----------------------------------- | -------------------------------------------------------- |
| `spike-web`               | `src/app` (Astro)                   | Public website / marketing pages                         |
| `src/monaco-editor`       | `src/monaco-editor`                 | Monaco-based collaborative code editor (Yarn workspace)  |

### Core Infrastructure

| Package (packages/)       | Source dir                          | Purpose                                                                                 |
| ------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------- |
| `react-ts-worker`         | `src/core/react-engine`             | From-scratch React with Fiber reconciler, multi-target rendering                        |
| `shared`                  | `src/core/shared-utils`             | Shared types, Zod validations, constants, utilities                                     |
| `block-sdk`               | `src/core/block-sdk`                | Portable D1/IndexedDB/memory storage layer for hosted and offline apps                  |
| `block-tasks`             | `src/core/block-tasks`              | Task management built on block-sdk                                                      |
| `mcp-server-base`         | `src/core/server-base`              | Shared base utilities for MCP servers                                                   |
| `esbuild-wasm`            | `packages/esbuild-wasm`             | Cross-platform esbuild WASM binary                                                      |

### MCP Tools

| Package (packages/)       | Source dir                          | Purpose                                                        |
| ------------------------- | ----------------------------------- | -------------------------------------------------------------- |
| `spike-cli`               | `src/cli/spike-cli`                 | MCP multiplexer CLI with Claude chat integration               |
| `vibe-dev`                | `src/cli/docker-dev`                | Docker-based dev workflow tool                                 |
| `spike-review`            | `src/mcp-tools/code-review`         | AI code review bot with GitHub integration                     |
| `hackernews-mcp`          | `src/mcp-tools/hackernews`          | MCP server for HackerNews read/write                           |
| `mcp-image-studio`        | `src/mcp-tools/image-studio`        | AI image generation, enhancement, albums & pipelines MCP tools |
| `openclaw-mcp`            | `src/mcp-tools/openclaw`            | MCP bridge for OpenClaw gateway                                |
| `esbuild-wasm-mcp`        | `src/mcp-tools/esbuild-wasm`        | MCP server wrapping esbuild-wasm                               |
| `code-eval-mcp`           | `src/mcp-tools/code-eval`           | Code evaluation MCP server                                     |
| `bazdmeg-mcp`             | `src/mcp-tools/bazdmeg`             | Bazdmeg feature set as MCP tools                               |

### Domain Packages

| Package (packages/)       | Source dir                          | Purpose                                              |
| ------------------------- | ----------------------------------- | ---------------------------------------------------- |
| `chess-engine`            | `src/core/chess`                    | Chess ELO engine with game/player/challenge managers |
| `qa-studio`               | `src/core/browser-automation`       | Browser automation utilities (Playwright)            |
| `state-machine`           | `src/core/statecharts`              | Statechart engine with guard parser and CLI          |
| `educational-videos`      | `packages/educational-videos`       | Educational video compositions (Remotion)            |
| `blog`                    | `packages/blog`                     | Blog package (Astro-based)                           |

## Common Commands

Each package has its own scripts. The most common patterns:

```bash
# Org-wide health check (PRs, CI, issues, worktrees, dep drift)
make health
# or: bash .github/scripts/org-health.sh

# Primary edge API (spike-edge / src/edge-api/main)
cd packages/spike-edge
npm run dev           # Local wrangler dev
npm run deploy        # Deploy to production

# MCP registry (spike-land-mcp / src/edge-api/spike-land)
cd packages/spike-land-mcp
npm run dev           # Local wrangler dev
npm run w:deploy:prod # Deploy to production

# Most packages (Node.js / MCP servers)
npm run build         # Build TypeScript
npm test              # Run tests (Vitest)
npm run test:coverage # Tests with coverage

# Cloudflare Workers (spike-land-backend, transpile, spike-land-mcp, mcp-auth, spike-chat)
npm run dev           # Local wrangler dev
npm run dev:remote    # Remote wrangler dev
npm run w:deploy:prod # Deploy to production

# Monaco editor (src/monaco-editor — Yarn workspace, not packages/)
cd src/monaco-editor
npm run dev:vite      # Vite dev server
npm run build:vite    # Build for browser

# react-ts-worker
cd packages/react-ts-worker
yarn build            # Build to dist/
yarn test             # Vitest with jsdom
yarn typecheck        # Type check only

```

## Architecture

### Frontend

`src/monaco-editor` — Monaco-based collaborative code editor (Vite, Yarn workspace).
`packages/spike-web` (source: `src/app`) — Astro-based public website and marketing pages.
`src/frontend/platform-frontend` — Store UI and app-facing pages.

### Edge Services (spike-edge, spike-land-mcp, mcp-auth, spike-land-backend, transpile, spike-chat)

Cloudflare Workers using Hono framework. `spike-edge` (source: `src/edge-api/main`) is the
primary edge API. `spike-land-mcp` (source: `src/edge-api/spike-land`) is the MCP registry
(80+ tools, D1-backed). `mcp-auth` (source: `src/edge-api/auth`) handles authentication
(Better Auth + Drizzle). `spike-land-backend` (source: `src/edge-api/backend`) provides
Durable Objects for real-time sync. `transpile` (source: `src/edge-api/transpile`) provides
esbuild-wasm compilation at the edge. `spike-chat` (source: `src/edge-api/spike-chat`)
handles chat API with context compression.

### Custom React (react-ts-worker)

Full React reimplementation with Fiber reconciler, lane-based scheduling, and
host config pattern for multi-target rendering (DOM, Worker-DOM, server
streaming). Source: `src/core/react-engine`.

### MCP Ecosystem

Multiple MCP servers following a common pattern: `@modelcontextprotocol/sdk` +
Zod validation + Vitest tests. `mcp-server-base` (source: `src/core/server-base`)
provides shared utilities. `spike-land-mcp` (source: `src/edge-api/spike-land`)
acts as the MCP registry aggregating 80+ tools. Additional MCP servers under
`src/mcp-tools/`: esbuild-wasm-mcp, hackernews-mcp, mcp-image-studio, openclaw-mcp,
code-eval-mcp, bazdmeg-mcp.

### App Store Context

spike.land is now positioned as an **open AI app store** built on top of the
MCP runtime. Every store app is a bundle of composable MCP tools, discovery
metadata, and install/recommendation flows.

Key source paths for app-store work:

- `src/edge-api/spike-land` — MCP runtime, categories, store tool families,
  OAuth, wildcard-CORS MCP surface
- `src/edge-api/main` — first-party edge proxy routes, experiments engine,
  public store/tool aggregation routes
- `src/frontend/platform-frontend` — store UI and app-facing pages
- `src/core/block-sdk` — portable D1/IndexedDB/memory storage layer for hosted
  and offline app variants

### Domain Packages

- `chess-engine` (source: `src/core/chess`) — Chess ELO engine with game/player/challenge managers
- `qa-studio` (source: `src/core/browser-automation`) — Browser automation utilities (Playwright)
- `state-machine` (source: `src/core/statecharts`) — Statechart engine with guard parser and CLI

## Directory Layout: src/ vs packages/

Source code lives in `src/`. The `packages/` directory contains **deploy shims**
— thin `wrangler.toml` and `package.json` files that re-export from `src/`
via relative paths (e.g., `export * from "../../src/edge-api/main/api/index"`).

| Directory    | Purpose                                            | When to use                        |
| ------------ | -------------------------------------------------- | ---------------------------------- |
| `src/`       | Source of truth — all TypeScript source, tests      | Development, editing, reading      |
| `packages/`  | Deploy shims — wrangler.toml + re-export index.ts   | CI deployment, `wrangler deploy`   |

Key `src/` layout:

| Path                          | What lives here                                 |
| ----------------------------- | ----------------------------------------------- |
| `src/edge-api/`               | All Cloudflare Workers source (main, spike-land, auth, backend, transpile, spike-chat, image-studio-worker) |
| `src/frontend/`               | Platform frontend UI (`platform-frontend`), Monaco editor |
| `src/cli/`                    | CLI tools (`spike-cli`, `docker-dev`)           |
| `src/mcp-tools/`              | MCP server implementations                      |
| `src/core/`                   | Shared libraries (react-engine, block-sdk, chess, statecharts, shared-utils, server-base) |
| `src/monaco-editor`           | Monaco editor (also a Yarn workspace directly)  |

**Rule:** Always edit files in `src/`. Only modify `packages/` for wrangler
config changes (bindings, routes, migrations, environment settings).

## CI/CD

- Shared workflow: `.github/.github/workflows/ci-publish.yml` (reusable across
  all repos)
- Node 24, GitHub Packages npm registry
- Changesets for versioning and publishing on main branch push

## Dependency Cascade System

When any `@spike-land-ai/*` package publishes, consuming repos automatically
receive a PR bumping the version.

### How it works

1. `ci-publish.yml` `notify` job fires after Changesets publishes
2. Reads `.github/dependency-map.json` to find downstream repos
3. Sends `repository_dispatch` (type: `dependency-updated`) to each consumer
4. Consumer's `receive-dispatch.yml` calls `bump-dependency.yml` (reusable)
5. `bump-dependency.yml` patches `package.json` and opens a PR with auto-merge

### Dependency graph (source → consumers)

| Source package                    | Consuming repos                                                                                                                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `esbuild-wasm`     | esbuild-wasm-mcp, code, transpile, spike-land-backend                                                                    |
| `esbuild-wasm-mcp` | code, spike-land-backend                                                                                                 |
| `@spike-land-ai/code`             | transpile, spike-land-backend                                                                                            |
| `@spike-land-ai/shared`           | mcp-image-studio, spike-land-mcp                                                                                         |
| `@spike-land-ai/eslint-config`    | chess-engine, code, esbuild-wasm-mcp, hackernews-mcp, mcp-image-studio, mcp-server-base, openclaw-mcp, react-ts-worker, shared, spike-app, spike-cli, spike-edge, spike-review, state-machine |
| `@spike-land-ai/tsconfig`         | chess-engine, code, esbuild-wasm-mcp, hackernews-mcp, mcp-image-studio, mcp-server-base, openclaw-mcp, react-ts-worker, shared, spike-cli, spike-review, state-machine                        |

### Key files

- `.github/dependency-map.json` — source-of-truth DAG
- `.github/.github/workflows/bump-dependency.yml` — reusable bump workflow
- `.github/.github/workflows/dep-sync-sweep.yml` — nightly safety-net (06:00
  UTC)
- `.github/scripts/verify-deps.sh` — run locally to check for drift
- `.github/SETUP.md` — PAT setup instructions and how to add new packages

### Verify drift locally

```bash
bash .github/scripts/verify-deps.sh
```

### Excluded repos

- `vinext.spike.land` — uses git-SHA deps, not registry versions
- Leaf MCP servers (hackernews-mcp, mcp-image-studio, openclaw-mcp,
  spike-review, vibe-dev) — no internal deps
- New leaf packages (mcp-auth, spike-edge, qa-studio, state-machine,
  chess-engine) — no internal deps

## Content

User-facing documentation and blog posts live at the umbrella repo root:

- `docs/` — architecture, guides, API docs, best practices (~140 files)
- `content/blog/` — published MDX blog posts (18 files)

App-store-specific docs live primarily under:

- `docs/features/`
- `docs/mcp/`
- `docs/develop/`
- `docs/security/`

## Key Conventions

- TypeScript strict mode across all packages
- Vitest for testing everywhere
- `@spike-land-ai/*` npm scope on GitHub Packages registry
- MCP servers follow: SDK + Zod schema + tool handler pattern
- Never use `any` type — use `unknown` or proper types
- Never use `eslint-disable`, `@ts-ignore`, or `@ts-nocheck`
- All packages use npm scripts within the Yarn workspace.
