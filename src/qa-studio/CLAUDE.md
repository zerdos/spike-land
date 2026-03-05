# CLAUDE.md

## Overview

QA Studio browser automation utilities for spike.land. Dual runtime:
- **Node.js CLI**: Playwright adapter (local dev, CI)
- **Cloudflare Workers**: Puppeteer adapter (Browser Rendering API, production)

Published as `@spike-land-ai/qa-studio`.

## Commands

```bash
npm run build         # Compile TypeScript
npm run dev           # Watch mode (tsc --watch)
npm test              # Run tests (Vitest)
npm run test:coverage # Tests with coverage
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
```

## Architecture

```
src/qa-studio/
  adapter.ts              # BrowserAdapter + BrowserPage interfaces, shared rebuildTree()
  adapter-playwright.ts   # Playwright impl (Node.js)
  adapter-puppeteer.ts    # @cloudflare/puppeteer impl (CF Workers)
  browser-session.ts      # Thin facade: tab management, idle timeout, snapshots
  narrate.ts              # Full + compact narration engines
  tools.ts                # 10 MCP tools (web_navigate, web_read, etc.)
  types.ts                # TypeScript type definitions
  session-do.ts           # BrowserSessionDO Durable Object
  worker-entry.ts         # Hono app (CF Workers entry)
  env.ts                  # Workers Env bindings type
  mcp-server.ts           # Node.js MCP server entry (STDIO/HTTP)
  http-server.ts          # Express SSE transport (legacy, to be removed)
  index.ts                # Re-exports

packages/qa-studio/
  wrangler.toml           # Deploy config for CF Workers
  package.json            # npm package config
```

### Adapter Pattern

`BrowserAdapter` + `BrowserPage` interfaces in `adapter.ts` abstract away the
browser backend. Both adapters use CDP `Accessibility.getFullAXTree` via the
shared `rebuildTree()` function to produce identical `AccessibilityNode` trees.

### Narration Modes

- **compact** (default): Token-efficient, ~40-60% smaller. Short landmark names,
  collapsed interactive siblings, truncated text.
- **full**: Verbose, screen-reader style. All details.
- **landmark**: Compact narration of a single landmark section.

### MCP Server Modes

1. **STDIO Transport**: `npm run mcp` (default, local dev)
2. **HTTP Transport**: `npm run mcp:http` (Express SSE, local web UI)
3. **CF Workers**: `cd packages/qa-studio && npx wrangler deploy`

## Peer Dependencies

- `playwright` (optional, for Node.js CLI mode)
- `@cloudflare/puppeteer` (for Workers mode, bundled)

## Code Quality Rules

- Never use `any` type - use `unknown` or proper types
- Never add `eslint-disable` or `@ts-ignore` comments
- TypeScript strict mode
- All business logic must have test coverage

## CI/CD

- Shared workflow: `.github/.github/workflows/ci-publish.yml`
- Changesets for versioning
- Publishes to GitHub Packages (`@spike-land-ai/*`)
- Workers deploy: `cd packages/qa-studio && npx wrangler deploy`
