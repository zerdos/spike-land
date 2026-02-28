<p align="center">
  <a href="https://spike.land">
    <img src="https://raw.githubusercontent.com/spike-land-ai/.github/main/assets/hero-banner.svg" alt="spike.land — AI-Native Development Platform" width="100%" />
  </a>
</p>

<p align="center">

<!-- Runtimes -->
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js_24-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/CF_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![AWS ECS](https://img.shields.io/badge/AWS_ECS-FF9900?style=for-the-badge&logo=amazon-ecs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

<!-- Frameworks -->
![React](https://img.shields.io/badge/React_(Custom)-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Hono](https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

<!-- AI/MCP -->
![Claude](https://img.shields.io/badge/Claude_AI-D97757?style=for-the-badge&logo=anthropic&logoColor=white)
![MCP](https://img.shields.io/badge/MCP_Protocol-7C3AED?style=for-the-badge)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)
![WebAssembly](https://img.shields.io/badge/WebAssembly-654FF0?style=for-the-badge&logo=webassembly&logoColor=white)

</p>

---

spike-land-ai is an AI-native development platform built across 15 independent repos — from a Next.js 16 main platform with 455+ MCP tools and Stripe-backed payments, to a from-scratch React Fiber implementation, edge transpilation workers, and a growing MCP ecosystem. It spans browser, edge (Cloudflare Workers), and server runtimes, all published under `@spike-land-ai` on GitHub Packages with automated dependency cascade CI.

---

<p align="center">
  <img src="https://raw.githubusercontent.com/spike-land-ai/.github/main/assets/stats-dashboard.svg" alt="Platform Stats" width="100%" />
</p>

## Architecture

<p align="center">
  <img src="https://raw.githubusercontent.com/spike-land-ai/.github/main/assets/architecture.svg" alt="Architecture Diagram" width="100%" />
</p>

## MCP Ecosystem

<p align="center">
  <img src="https://raw.githubusercontent.com/spike-land-ai/.github/main/assets/mcp-ecosystem.svg" alt="MCP Tool Ecosystem" width="680" />
</p>

## Packages

| Package | Runtime | Description | Status |
|---------|---------|-------------|--------|
| [spike.land](https://github.com/spike-land-ai/spike.land) | Next.js 16 / AWS ECS | **Main Platform**: The central hub for spike.land. Features a unified MCP registry, app store, user authentication, and Stripe-backed payments. Orchestrates 455+ tools. | [![CI](https://img.shields.io/github/actions/workflow/status/spike-land-ai/spike.land/ci-publish.yml?branch=main&label=CI)](https://github.com/spike-land-ai/spike.land/actions) |
| [code](https://github.com/spike-land-ai/code) | Browser (Vite) | **Code Editor**: A real-time collaborative code editor based on Monaco. Supports TypeScript and live preview for rapid prototyping. | [![CI](https://img.shields.io/github/actions/workflow/status/spike-land-ai/code/ci-publish.yml?branch=main&label=CI)](https://github.com/spike-land-ai/code/actions) |
| [mcp-nanobanana](https://github.com/spike-land-ai/mcp-nanobanana) | Node.js | **Pixel Studio**: Advanced image management and enhancement MCP server. Provides ~42 tools for generation, upscaling, background removal, and album management. | [![CI](https://img.shields.io/github/actions/workflow/status/spike-land-ai/mcp-nanobanana/ci-publish.yml?branch=main&label=CI)](https://github.com/spike-land-ai/mcp-nanobanana/actions) |
| [spike-cli](https://github.com/spike-land-ai/spike-cli) | Node.js CLI | **Command Line Hub**: A multiplexer CLI that aggregates multiple MCP servers into a single endpoint with an interactive chat interface powered by Claude. | [![CI](https://img.shields.io/github/actions/workflow/status/spike-land-ai/spike-cli/ci-publish.yml?branch=main&label=CI)](https://github.com/spike-land-ai/spike-cli/actions) |
| [spike-land-backend](https://github.com/spike-land-ai/spike-land-backend) | Cloudflare Workers | **Edge Backend**: Main API services using Hono and Cloudflare Durable Objects. Handles real-time synchronization and state management. | [![CI](https://img.shields.io/github/actions/workflow/status/spike-land-ai/spike-land-backend/ci-publish.yml?branch=main&label=CI)](https://github.com/spike-land-ai/spike-land-backend/actions) |
| [transpile](https://github.com/spike-land-ai/transpile) | Cloudflare Workers | **Edge Transpilation**: High-speed JavaScript/TypeScript compilation service using `esbuild-wasm` running on the edge. | [![CI](https://img.shields.io/github/actions/workflow/status/spike-land-ai/transpile/ci-publish.yml?branch=main&label=CI)](https://github.com/spike-land-ai/transpile/actions) |
| [react-ts-worker](https://github.com/spike-land-ai/react-ts-worker) | Browser / Workers | **Custom React**: A from-scratch React implementation featuring a Fiber reconciler, lane-based scheduling, and multi-target rendering. | [![CI](https://img.shields.io/github/actions/workflow/status/spike-land-ai/react-ts-worker/ci-publish.yml?branch=main&label=CI)](https://github.com/spike-land-ai/react-ts-worker/actions) |
| [esbuild-wasm-mcp](https://github.com/spike-land-ai/esbuild-wasm-mcp) | Node.js | **Build MCP**: MCP server that provides full control over the esbuild-wasm lifecycle for agents to perform builds. | [![CI](https://img.shields.io/github/actions/workflow/status/spike-land-ai/esbuild-wasm-mcp/ci-publish.yml?branch=main&label=CI)](https://github.com/spike-land-ai/esbuild-wasm-mcp/actions) |
| [spike-review](https://github.com/spike-land-ai/spike-review) | Node.js | **Review Bot**: Branded AI code review assistant that enforces BAZDMEG quality gates across the entire org. | [![CI](https://img.shields.io/github/actions/workflow/status/spike-land-ai/spike-review/ci-publish.yml?branch=main&label=CI)](https://github.com/spike-land-ai/spike-review/actions) |
| [shared](https://github.com/spike-land-ai/shared) | isomorphic | **Core Logic**: Shared TypeScript types, validation logic (Zod), constants, and common utilities used across all packages. | [![CI](https://img.shields.io/github/actions/workflow/status/spike-land-ai/shared/ci-publish.yml?branch=main&label=CI)](https://github.com/spike-land-ai/shared/actions) |
| [hackernews-mcp](https://github.com/spike-land-ai/hackernews-mcp) | Node.js | **HN Integration**: Specialized MCP server for reading and interacting with HackerNews. | [![CI](https://img.shields.io/github/actions/workflow/status/spike-land-ai/hackernews-mcp/ci-publish.yml?branch=main&label=CI)](https://github.com/spike-land-ai/hackernews-mcp/actions) |
| [openclaw-mcp](https://github.com/spike-land-ai/openclaw-mcp) | Node.js | **OpenClaw Bridge**: Standalone MCP bridge providing interoperability with the OpenClaw gateway. | [![CI](https://img.shields.io/github/actions/workflow/status/spike-land-ai/openclaw-mcp/ci-publish.yml?branch=main&label=CI)](https://github.com/spike-land-ai/openclaw-mcp/actions) |
| [vibe-dev](https://github.com/spike-land-ai/vibe-dev) | Node.js CLI | **Vibe Workflow**: Docker-based development workflow optimizer for vibe-coded applications. | [![CI](https://img.shields.io/github/actions/workflow/status/spike-land-ai/vibe-dev/ci-publish.yml?branch=main&label=CI)](https://github.com/spike-land-ai/vibe-dev/actions) |
| [video](https://github.com/spike-land-ai/video) | Remotion | **Programmatic Video**: Educational and promotional video assets built using React and Remotion. | [![CI](https://img.shields.io/github/actions/workflow/status/spike-land-ai/video/ci-publish.yml?branch=main&label=CI)](https://github.com/spike-land-ai/video/actions) |

## Repository Deep Dive

### The Platform Core
The main entry point is **spike.land**, which serves as the orchestrator. It manages user identity, persistent storage, and the **MCP Registry**. The registry is a dynamic catalog of capabilities that can be called by any AI agent within the ecosystem.

### AI & MCP Layer
We embrace the Model Context Protocol (MCP) as our primary integration interface. Repositories prefixed with `mcp-` or suffixed with `-mcp` provide specialized capabilities:
- **mcp-nanobanana**: The visual intelligence layer (Pixel Studio).
- **esbuild-wasm-mcp**: The builder layer.
- **hackernews-mcp**: Information retrieval layer.

### Infrastructure & Tooling
- **Dependency Cascade**: We use a custom automated system to propagate dependency updates across the 15+ repositories, ensuring architectural consistency without manual toil.
- **Edge Computing**: We leverage Cloudflare Workers for ultra-low latency tasks like transpilation and real-time collaboration.
- **BAZDMEG Quality Gates**: Our automated review system (**spike-review**) ensures that every PR meets our rigorous engineering standards.


## Quick Start

Each directory is a separate git repo. Clone the one you need:

```bash
# Main platform (Next.js 16)
git clone https://github.com/spike-land-ai/spike.land
cd spike.land
yarn install
yarn dev              # http://localhost:3000

# Node.js / MCP servers (most packages)
git clone https://github.com/spike-land-ai/<package>
cd <package>
npm install
npm run build
npm test

# Cloudflare Workers (spike-land-backend, transpile)
npm install
npm run dev           # local wrangler
npm run dev:remote    # remote wrangler

# Monaco editor (code)
npm install
npm run dev:vite      # Vite dev server

# Custom React (react-ts-worker)
yarn install
yarn build
yarn test
```

Org-wide health check (PRs, CI status, dep drift):

```bash
make health
# or: bash .github/scripts/org-health.sh
```

## CI/CD Pipeline

<p align="center">
  <img src="https://raw.githubusercontent.com/spike-land-ai/.github/main/assets/ci-pipeline.svg" alt="CI/CD Pipeline" width="100%" />
</p>

All repos share a reusable workflow at `.github/.github/workflows/ci-publish.yml` running on Node 24. Changesets manages versioning; packages publish to GitHub Packages on every merge to `main`. spike.land uses its own extended pipeline: ESLint, TypeScript, Vitest (4 shards), Next.js build, then AWS ECS deploy via Depot remote builds.

## Dependency Cascade

<p align="center">
  <img src="https://raw.githubusercontent.com/spike-land-ai/.github/main/assets/dependency-flow.svg" alt="Dependency Cascade" width="100%" />
</p>

Publishing any `@spike-land-ai/*` package triggers automated PRs in downstream repos. The DAG is defined in `.github/dependency-map.json`. Check for drift locally:

```bash
bash .github/scripts/verify-deps.sh
```

| Source | Consumers |
|--------|-----------|
| `esbuild-wasm` | esbuild-wasm-mcp, code, transpile, spike-land-backend, spike.land |
| `shared` | code, transpile, spike-land-backend, spike.land |
| `react-ts-worker` | spike.land |
| `spike-cli` | spike.land |

## Development

```bash
# Node.js / MCP servers
npm run build         # Compile TypeScript
npm test              # Run Vitest tests
npm run test:coverage # Tests with coverage thresholds
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint

# spike.land (Yarn)
yarn dev              # Dev server (localhost:3000)
yarn build            # Production build
yarn typecheck        # TypeScript check
yarn test:coverage    # Vitest with enforced thresholds

# Cloudflare Workers
npm run dev           # Local wrangler dev
npm run w:deploy:prod # Deploy to production
```

## Contributing

- TypeScript strict mode is enforced across all packages — use `unknown` instead of `any`
- Tests are written with Vitest; coverage thresholds are enforced in CI (80%+ for most packages)
- Never use `eslint-disable`, `@ts-ignore`, or `@ts-nocheck`
- Version and publish via [Changesets](https://github.com/changesets/changesets) — do not manually bump `package.json` versions
- MCP servers follow the pattern: `@modelcontextprotocol/sdk` + Zod schema + tool handler + matching test file
- spike.land uses Yarn; all other packages use npm

## License

MIT

