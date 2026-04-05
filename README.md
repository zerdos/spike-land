<p align="center">
  <a href="https://spike.land">
    <img src="https://raw.githubusercontent.com/spike-land-ai/.github/main/assets/hero-banner.svg" alt="spike.land — Open AI App Store" width="100%" />
  </a>
</p>

<h3 align="center">The open AI app store built on MCP — every app is a bundle of composable tools.</h3>

<p align="center">
  <strong>80+ hosted MCP tools</strong> · Edge-native on Cloudflare Workers · From-scratch React Fiber runtime<br/>
  <em>1,200+ clones in 2 weeks · 28 packages · TypeScript strict everywhere</em>
</p>

---

## Quick Start

```bash
git clone https://github.com/spike-land-ai/spike-land
cd spike.land && npm install
cd src/monaco-editor && npm run dev:vite
```

## Architecture

<p align="center">
  <img src="https://raw.githubusercontent.com/spike-land-ai/.github/main/assets/architecture.svg" alt="Architecture Diagram" width="100%" />
</p>

## Packages

Packages are deploy shims under `packages/`; source lives under `src/`.

| Package | Source | Description |
|---------|--------|-------------|
| [spike-edge](./packages/spike-edge) | `src/edge-api/main` | Primary edge API — Hono on Cloudflare Workers |
| [spike-land-mcp](./packages/spike-land-mcp) | `src/edge-api/spike-land` | MCP registry — 80+ tools, D1-backed |
| [mcp-auth](./packages/mcp-auth) | `src/edge-api/auth` | Auth service — Better Auth + Drizzle |
| [spike-land-backend](./packages/spike-land-backend) | `src/edge-api/backend` | Durable Objects for real-time sync |
| [transpile](./packages/transpile) | `src/edge-api/transpile` | Edge transpilation via esbuild-wasm |
| [spike-chat](./packages/spike-chat) | `src/edge-api/spike-chat` | Chat API with context compression |
| [mcp-server-base](./packages/mcp-server-base) | `src/core/server-base` | Shared MCP server utilities |
| [react-ts-worker](./packages/react-ts-worker) | `src/core/react-engine` | From-scratch React with Fiber reconciler |
| [shared](./packages/shared) | `src/core/shared-utils` | Shared types, Zod validations, constants |
| [block-sdk](./packages/block-sdk) | `src/core/block-sdk` | Portable D1/IndexedDB/memory storage |
| [esbuild-wasm](./packages/esbuild-wasm) | `packages/esbuild-wasm` | Cross-platform esbuild WASM binary |
| [esbuild-wasm-mcp](./packages/esbuild-wasm-mcp) | `src/mcp-tools/esbuild-wasm` | MCP server for esbuild lifecycle |
| [spike-cli](./packages/spike-cli) | `src/cli/spike-cli` | MCP multiplexer CLI with Claude chat |
| [mcp-image-studio](./packages/mcp-image-studio) | `src/mcp-tools/image-studio` | AI image generation & enhancement (42 tools) |
| [spike-review](./packages/spike-review) | `src/mcp-tools/code-review` | AI code review with quality gates |
| [hackernews-mcp](./packages/hackernews-mcp) | `src/mcp-tools/hackernews` | HackerNews MCP integration |
| [openclaw-mcp](./packages/openclaw-mcp) | `src/mcp-tools/openclaw` | OpenClaw gateway bridge |
| [vibe-dev](./packages/vibe-dev) | `src/cli/docker-dev` | Docker-based dev workflow tool |
| [chess-engine](./packages/chess-engine) | `src/core/chess` | Chess ELO engine with game/challenge managers |
| [qa-studio](./packages/qa-studio) | `src/core/browser-automation` | Browser automation (Playwright) |
| [state-machine](./packages/state-machine) | `src/core/statecharts` | Statechart engine with guard parser |
| [educational-videos](./packages/educational-videos) | `packages/educational-videos` | Programmatic video via Remotion |

## MCP Ecosystem

<p align="center">
  <img src="https://raw.githubusercontent.com/spike-land-ai/.github/main/assets/mcp-ecosystem.svg" alt="MCP Tool Ecosystem" width="680" />
</p>

Every store app is a bundle of composable MCP tools, discovery metadata, and install/recommendation flows. The platform embraces the [Model Context Protocol](https://modelcontextprotocol.io) as its primary integration interface.

## Development

```bash
npm run build         # Compile TypeScript
npm test              # Run Vitest tests
npm run typecheck     # tsc --noEmit
```

For Cloudflare Workers packages: `npm run dev` (local wrangler) or `npm run w:deploy:prod` (production).

## Contributing

- TypeScript strict mode — use `unknown` instead of `any`
- Vitest for tests, 80%+ coverage enforced in CI
- Never use `eslint-disable`, `@ts-ignore`, or `@ts-nocheck`
- Version via [Changesets](https://github.com/changesets/changesets)
- MCP servers follow: SDK + Zod schema + tool handler pattern

## Links

- [Documentation](./docs/README.md) · [Blog](./content/blog/) · [Pricing](https://spike.land/pricing)

## License

MIT
