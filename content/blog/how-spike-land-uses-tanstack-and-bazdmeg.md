---
title: "How spike.land Uses TanStack and Enforces Quality with BAZDMEG"
date: "2026-05-04"
description: "A deep dive into the architecture of spike.land, our use of TanStack for routing and state, and the BAZDMEG method for AI-assisted development."
---

![A futuristic app store interface built with floating neon blocks, representing composable AI tools and quality control gates in a dark cyberpunk aesthetic.](https://image.pollinations.ai/prompt/A%20futuristic%20app%20store%20interface%20built%20with%20floating%20neon%20blocks%2C%20representing%20composable%20AI%20tools%20and%20quality%20control%20gates%20in%20a%20dark%20cyberpunk%20aesthetic)

## What is spike.land?

spike.land is an open AI app store and a Model Context Protocol (MCP) native runtime. It acts as an "operating system" for AI-powered software, where every application is a bundle of composable MCP tools, a discovery record, and an execution surface.

Built with an offline-first and edge-native approach, spike.land allows developers to write code once and run it anywhere: as a hosted edge app on Cloudflare Workers, an embedded tool within an existing product, or as an offline browser bundle powered by IndexedDB. It turns MCP tools into publishable, shareable products that agents and humans can seamlessly interact with.

## How spike.land Uses TanStack

To provide a seamless, type-safe, and highly responsive user experience across our app store surface, spike.land relies heavily on the **TanStack** ecosystem—specifically React Router and React Query.

### 1. Type-Safe Routing with TanStack Router
Our core navigation structure in `src/frontend/platform-frontend/ui/router.ts` is built on TanStack React Router. Instead of traditional React Router setups, we define a centralized `routeTree` with strict type safety.
- **Lazy Loading at Scale:** We heavily utilize a custom `withSuspense` wrapper to lazy-load components, ensuring the initial bundle size remains minimal.
- **Navigation Guards:** We employ the `beforeLoad` hooks to handle redirects, authentication checks, and route-specific prerequisites before the component tree even begins to render.

### 2. State Synchronization with React Query
Managing server state across an edge-native app store requires robust synchronization. We initialize a global `QueryClient` and use the "Custom Hook" pattern (e.g., `useApps.ts`, `useInstall.ts`) to encapsulate query keys and API calls.
- **Optimistic Updates:** When a user installs an app via the store, we use React Query's `onMutate` and `setQueryData` to immediately reflect the installed state in the UI. If the background installation fails, the state automatically rolls back.
- **Complex Data Merging:** Hooks like `useApps` seamlessly merge dynamic API responses with static catalog data, allowing components to remain decoupled from the underlying data fetching mechanisms.

## The BAZDMEG Quality Gates

As an AI-native platform, we heavily leverage AI agents (like our orchestrated 32-agent background research flows) to investigate code, map dependencies, and author functionality. To maintain discipline and prevent AI-generated chaos, we developed the **BAZDMEG Method**: an eight-principle framework for AI-assisted development.

### The Checkpoint System
BAZDMEG enforces strict quality gates before any code is written, merged, or deployed:

1. **Pre-Code Checklist (Planning Interview):** The AI must interview the human via an MCQ verification process to prove it understands the file architecture, failure modes, edge cases, and test strategy.
2. **Post-Code Checklist:** The developer must be able to explain every line of the generated code and confirm that MCP tool tests cover the business logic.
3. **Pre-PR Checklist:** 100% test coverage on business logic is enforced. Code must pass strict TypeScript checks (`zero 'any'`, no `eslint-disable`).

### The 10-Second Rule & Trunk-Based Development
We aim for CI pipelines to complete in under 10 seconds. If `vitest --changed` and type-checking pass instantly, we skip feature branches and commit directly to main. The BAZDMEG philosophy believes that flaky tests gaslight the AI, so we mandate zero flakiness and utilize a "Bayesian Bugbook" where recurring bugs earn mandatory regression tests.

### Orchestrating Agents (/bazdmeg fixer)
When complex issues arise, we don't just rely on one agent. We orchestrate an 8-agent QA team executing 16 personas simultaneously. These agents explore the MCP surface and UI, triaging bugs and generating fixes. A fix is only shipped when two independent validator agents confirm the issue is resolved with no regressions.

## Conclusion
By combining the raw speed of TanStack's type-safe routing and caching with the strict discipline of the BAZDMEG quality gates, spike.land ensures that its open AI app store remains both incredibly fast and rock-solid.
