# CLAUDE.md

## Overview

Browser automation utilities for spike.land. Dual runtime:
- **Node.js CLI**: Playwright adapter (local dev, CI)
- **Cloudflare Workers**: Puppeteer adapter (Browser Rendering API, production)

Package name: `browser-automation`.

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
├── api/
│   └── worker-entry.ts       # Hono app (CF Workers entry)
├── core-logic/
│   ├── adapter.ts            # BrowserAdapter + BrowserPage interfaces, shared rebuildTree()
│   ├── browser-session.ts    # Thin facade: tab management, idle timeout, snapshots
│   ├── env.ts                # Workers Env bindings type
│   ├── narrate.ts            # Full + compact narration engines
│   └── types.ts              # TypeScript type definitions
├── edge/
│   ├── adapter-puppeteer.ts  # @cloudflare/puppeteer impl (CF Workers)
│   └── session-do.ts         # BrowserSessionDO Durable Object
├── mcp/
│   ├── mcp-server.ts         # Node.js MCP server entry (STDIO/HTTP)
│   ├── tools.ts              # MCP tools (web_navigate, web_read, etc.)
│   └── link-checker-tools.ts # Link checker MCP tools
├── testing/
│   └── adapter-playwright.ts # Playwright impl (Node.js)
├── lazy-imports/
│   └── http-server.ts        # Express SSE transport (legacy)
└── index.ts                  # Re-exports
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
2. **HTTP Transport**: `npm run mcp:http` (Express SSE via `lazy-imports/http-server.ts`, local web UI)
3. **CF Workers**: deploy via wrangler from the packages shim directory

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
- Workers deploy: via wrangler from the packages shim directory
