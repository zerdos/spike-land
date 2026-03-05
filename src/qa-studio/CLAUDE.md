# CLAUDE.md

## Overview

QA Studio browser automation utilities for spike.land, built on Playwright.
Published as `@spike-land-ai/qa-studio`, runs in Node.js.

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
├── index.ts           # Main entry (re-exports)
├── types.ts           # TypeScript type definitions
└── browser-session.ts # Playwright browser session management
```

**Peer dependency**: `playwright` (>=1.0.0).

## Code Quality Rules

- Never use `any` type — use `unknown` or proper types
- Never add `eslint-disable` or `@ts-ignore` comments
- TypeScript strict mode
- All business logic must have test coverage

## MCP Server & HTTP Transport

The package provides an MCP server which can run in two modes:
1. **STDIO Transport**: Default behavior.
2. **HTTP Transport**: Run with `--http` flag to expose a local web server (defaults to port 3100). This enables visual Web UI connections from `spike-app`.

```bash
npm run mcp           # STDIO mode
npm run mcp:visible   # STDIO mode with visible browser
npm run mcp:http      # HTTP mode for Web UI
```

## CI/CD

- Shared workflow: `.github/.github/workflows/ci-publish.yml`
- Changesets for versioning
- Publishes to GitHub Packages (`@spike-land-ai/*`)
