# SPIKE LAND LTD — Investor Pitch Deck

> **GENERIC VERSION** — Suitable for angels, VCs, accelerators, and strategic investors
> **Stage**: Public beta, pre-revenue | **HQ**: Brighton, England, UK
> **Company Number**: 16906682 | **Updated**: March 2026

---

## Slide 1 — Title

**SPIKE LAND**

*The edge-native runtime for AI-native applications.*

---

**One-liner**: Spike Land is the platform layer where AI apps are built, deployed, orchestrated, and tested — from a single typed contract at the edge.

| | |
|---|---|
| **Founder** | Zoltan Erdos |
| **Location** | Brighton, UK |
| **Stage** | Public beta, pre-revenue |
| **Company** | SPIKE LAND LTD (UK #16906682) |
| **Website** | spike.land |
| **CLI** | `npx @spike-land-ai/spike-cli` |

---

## Slide 2 — Problem

**AI makes apps cheaper to build. That makes the platform more valuable.**

The cost to generate a working React app has dropped from weeks to minutes. But that only makes the *deployment, runtime, and orchestration* layer more important — not less. Every generated app still needs to:

- Run somewhere reliable and fast
- Connect to tools and data sources
- Be tested, reviewed, and updated in a tight loop
- Support CLI, browser, embedded, and agentic consumers at once

**The existing platforms were not built for this.**

| Problem | Current state |
|---|---|
| Deployment platforms (Vercel, Railway) | Built for human-authored apps, not AI-generated tool chains |
| MCP tool access | No managed registry with billing, rate limiting, and auth included |
| Testing AI app logic | Requires spinning up an LLM; no way to test at function speed |
| Multi-surface delivery | Every surface (CLI, browser, chat, offline) requires custom integration |
| Context window waste | Agents load 47,000+ tokens of tool descriptions before doing any work |

The result: developers building with AI still have to stitch together six different services and write the same glue code every time.

---

## Slide 3 — Solution

**Spike Land is the platform layer that AI-native apps actually need.**

One platform. Runtime, deployment, tooling, and testing — designed for the way AI apps are built and used today.

**Core capabilities:**

1. **80+ native MCP tools** — hosted, metered, and authenticated. No server to run. Add spike.land as an MCP server with one terminal command and every tool is immediately available to your agent or IDE.

2. **MCP Multiplexer** — a lazy-loading architecture that reduces agent context overhead from ~47,000 tokens to ~400 tokens. AI agents load only what they need, when they need it.

3. **Full-stack live editor** — build a React app in the browser with live preview, transpilation at the edge via esbuild-wasm, and publish with one click. The feedback loop is intent → generate → transpile → render → review → improve, entirely in-platform.

4. **Tool-first testing model** — business logic is expressed as typed MCP tool contracts. Tests run at function speed, not LLM speed. No mocking required.

5. **Multi-surface delivery** — the same app runs in the browser, the CLI, embedded in other products, offline as a bundle, and inside AI agents. One codebase, every surface.

6. **spike-cli** — an open-source MCP multiplexer CLI that gives developers terminal access to every tool and app on the platform. Published on npm. Works in any shell, any CI pipeline.

---

## Slide 4 — Why Now

**Three forces are converging. This window is open for 12–18 months.**

**1. MCP is becoming the standard wire protocol for AI tools.**

Anthropic published the Model Context Protocol in late 2024. By early 2026 it has been adopted by Claude Code, major AI IDEs, and the broader developer tooling ecosystem. There is no managed platform that owns this layer yet.

**2. AI-generated apps are outpacing the platforms designed to deploy them.**

Code generation has become fast and cheap. Every developer now has an AI collaborator. The bottleneck has shifted to runtime and orchestration — exactly what Spike Land provides.

**3. The testing gap is real and growing.**

The dominant testing model for AI apps (spin up the LLM, test the conversation) is slow, expensive, and non-deterministic. Typed MCP tool contracts make AI app logic testable at function speed. No competitor has this model.

**The window**: Vercel, Cloudflare, and GitHub are all moving toward this space. The category leader will be established in the next 12–18 months. Spike Land has working infrastructure now.

---

## Slide 5 — Market Size

**The platform layer for AI-native development is a large and fast-forming market.**

| Segment | Size | Notes |
|---|---|---|
| **TAM** — Global AI developer tools + cloud infrastructure | $100B+ | 25–30% CAGR through 2030 |
| **SAM** — AI-powered development platforms and orchestration | $25B | Platforms providing runtime, deployment, and tooling for AI-assisted workflows |
| **SOM** — MCP-native managed platforms (near-term addressable) | $1B | Developers and small teams actively building with MCP today |

**Comparable benchmarks:**
- Vercel reached $250M ARR serving Next.js developers. Spike Land targets the equivalent layer for AI-native developers.
- The MCP ecosystem is roughly where npm was in 2013: adoption is accelerating, the tooling layer is immature, and the first credible platform wins disproportionate share.
- OpenAI's app directory update (December 2025) and Anthropic's Claude Marketplace (March 2026) both validate that the industry is building around managed tool and app discovery.

---

## Slide 6 — Product

**What you can do with Spike Land today.**

**For developers:**

- Add spike.land as an MCP server to Claude Code, Cursor, or any MCP-compatible IDE in one command
- Access 80+ native tools (image generation, browser automation, code transpilation, chess engine, state machine, HackerNews read/write, and more) without running any server
- Use spike-cli to script and automate the same tools from the terminal
- Build full-stack React apps in the browser editor with live preview and edge transpilation

**For AI agents:**

- Invoke any platform tool via standard MCP protocol
- Lazy-load only relevant tool subsets (multiplexer reduces context from ~47,000 to ~400 tokens)
- Publish and share app bundles that other agents can install and use

**Architecture in brief:**

| Layer | Technology |
|---|---|
| Runtime | Cloudflare Workers (edge-native, global) |
| Real-time state | Durable Objects |
| Data | D1 (managed relational, SQLite-compatible) |
| Storage | R2 |
| Transpilation | esbuild-wasm at the edge |
| Tools | MCP-native typed contracts (Zod-validated) |
| Testing | Vitest, function-speed tool tests |

**What makes the architecture defensible**: every tool is a typed contract. That means the same tool can be invoked from the CLI, the browser, an AI agent, or a CI pipeline — with identical semantics. No adapter layer, no translation.

---

## Slide 7 — Business Model

**Platform SaaS with usage-based API add-ons and a marketplace revenue layer.**

### Subscription tiers

| Tier | Price | Deployments | AI credits/mo | Team members |
|---|---|---|---|---|
| Free | $0 / mo | 3 | 100 | 1 |
| Pro | $29 / mo | 10 | 1,000 | 3 |
| Business | $99 / mo | Unlimited | 5,000 | 10 |

### API add-ons (for heavy programmatic usage)

| Add-on | Price | Calls / mo |
|---|---|---|
| API Pro | $49 / mo | 10,000 |
| API Scale | $149 / mo | 100,000 + webhooks |

### Marketplace (Year 2)

Third-party developers publish MCP tools and apps into the catalog. Spike Land takes a 30% platform fee on all paid installs and subscriptions. The 70/30 split is designed to attract tool authors by being more generous than comparable app stores.

### Unit economics

- Blended ARPU target: ~$40 / mo ($33 at GBP conversion)
- Gross margin: 70%+ (Cloudflare edge infrastructure keeps COGS at roughly 18% of revenue)
- CAC: Low. Primary acquisition channel is npm install / CLI evaluation with zero friction.

### Revenue milestones (base case)

| Milestone | Paying customers | ARR (GBP) |
|---|---|---|
| Product-market fit signal | 100 | ~£40K |
| Beachhead established | 250 | ~£105K |
| Series A readiness | 2,000 | ~£800K |

---

## Slide 8 — Traction / Milestones

**The hard part is done. The platform is real.**

This is not a prototype or a deck. It is a working product in public beta.

**What is built and live:**

| Milestone | Status |
|---|---|
| spike.land platform live (public beta) | Done — March 2026 |
| 80+ native MCP tools hosted and functional | Done |
| MCP Multiplexer (lazy-loading, context reduction) | Done |
| spike-cli published on npm | Done |
| Live browser editor with edge transpilation | Done |
| Full-stack React app builder with live preview | Done |
| Durable Objects real-time sync | Done |
| D1 relational database layer | Done |
| Stripe subscription checkout integrated | Done — commercial launch pending |
| 25 packages across a Yarn monorepo | Done |
| Vitest test suite across all packages | Done |
| UK Ltd company incorporated | Done — December 2025 |

**Codebase scale (independently verifiable on GitHub):**

- ~944,000 lines of TypeScript across the monorepo
- 25 packages: runtime, MCP servers, editor, CLI, shared infra
- CI/CD on GitHub Actions with automated dependency cascade

**What remains before first paid customers:**

- Stripe metering and webhook provisioning (in progress)
- Self-serve onboarding flow
- Audit logs and RBAC for enterprise controls

**Framing**: A typical infrastructure startup at pre-seed has wireframes and a pitch. Spike Land has working edge infrastructure, 80 deployed tools, a published CLI, and a live product. The risk profile is substantially de-risked relative to stage.

---

## Slide 9 — Competition / Why We Win

**The category is forming. No incumbent owns the MCP-native platform layer.**

| Capability | Vercel | Replit | Lovable | Cloudflare Workers | GitHub MCP | Spike Land |
|---|---|---|---|---|---|---|
| Managed MCP tool hosting | No | No | No | Primitives only | Directory only | **Yes (80+ native)** |
| MCP Multiplexer / lazy-loading | No | No | No | No | No | **Yes** |
| Tool-first testing model | No | No | No | No | No | **Yes** |
| Full-stack live editor | Partial | Yes | Yes | No | No | **Yes** |
| CLI MCP access | No | No | No | No | No | **Yes (spike-cli)** |
| Offline / embedded bundles | No | No | No | No | No | **Yes** |
| Open-source foundation | No | No | No | No | No | **Yes** |
| Marketplace with rev share | No | No | No | No | No | **Yes (planned Y2)** |

**Why the large platforms are not the right comparison:**

- Vercel is an excellent deployment platform. It is not a tool runtime or an MCP registry. Adding MCP support would require fundamental architectural changes.
- Cloudflare provides the underlying primitives. Spike Land is built on top of Cloudflare — it is a layer above, not a competitor. (Cloudflare is also a potential partner and distribution channel.)
- Replit and Lovable solve code generation UX. They do not solve the runtime contract, the tool marketplace, or the testing model.

**The strategic insight**: The platforms that dominated the previous generation (Heroku, Netlify, Vercel) did so by owning the deployment experience for a new runtime paradigm. Spike Land is positioned to own that layer for the AI-native runtime paradigm.

---

## Slide 10 — Team

**One founder. Working product. 12 years of relevant experience.**

**Zoltan Erdos — Founder, CEO, and sole developer**

| | |
|---|---|
| **Education** | Computer Science and Mathematics, Eotvos Lorand University, Budapest |
| **Current** | Founder, SPIKE LAND LTD (since 2025) |
| **2023–2025** | Frontend Developer (Contractor), Virgin Media O2 — led four critical user journeys on the My O2 mobile platform |
| **2018–2023** | Full Stack Developer (Contractor), Investec Bank — established test automation and cloud deployment for Investec IX |
| **2014–2018** | Lead Frontend Developer, TalkTalk — introduced TDD and CI practices, delivered new sales platform |
| **Earlier** | Senior Frontend Consultant, Keytree (BP, Jaguar Land Rover, National Grid); Frontend Developer, Emarsys |

**Why one founder is a strength here, not a risk:**

The platform was built using AI-assisted development workflows — the same workflows the platform is designed to enable. One founder built 25 packages, 80+ hosted tools, a published CLI, and a live product. This is the proof of concept: AI-native development, executed.

The capital raise funds the transition from solo execution to a small, focused team. First hire is a Growth Lead. Engineering continues to leverage AI-assisted workflows.

**Hiring plan:**

1. Growth Lead (Month 4–6 post-raise)
2. Customer Success / Developer Relations (Month 8–10)
3. Engineering (as usage scales, continuing AI-assisted model)

---

## Slide 11 — Ask / Use of Funds

**Raising up to £250,000 (SEIS-eligible) to reach first 250 paying customers.**

The product is built. The raise funds commercial launch and go-to-market execution.

| Use of funds | Allocation | Purpose |
|---|---|---|
| Commercial launch and billing | £25,000 | Stripe metering live, paid plans activated, self-serve onboarding |
| Platform hardening and docs | £35,000 | Developer documentation, analytics, robust APIs |
| Tool registry expansion | £40,000 | Scale to 120+ hosted tools, launch marketplace rev share |
| GTM and content marketing | £50,000 | SEO content, founder-led demos, first 100 paying customers |
| Growth and engineering hires | £80,000 | Growth Lead and CS/engineering support |
| Working capital / contingency | £20,000 | Legal, accounting, professional fees |
| **Total** | **£250,000** | |

**Milestones this raise funds:**

| Month | Target |
|---|---|
| M3 | Commercial launch live. First 25 paying customers. |
| M6 | 100 paying customers. Growth Lead hired. |
| M12 | 228 paying customers. ~£43K ARR. Marketplace launched. |
| M18 | 500+ paying customers. Enterprise controls live. Series A or EIS round. |

**Financial projection summary (base case):**

| Year | Revenue | COGS | Gross profit | OpEx | EBIT |
|---|---|---|---|---|---|
| Year 1 | £42,832 | £7,710 | £35,122 | £95,000 | -£59,878 |
| Year 2 | £150,000 | £27,000 | £123,000 | £143,000 | -£20,000 |
| Year 3 | £400,000 | £72,000 | £328,000 | £218,000 | +£110,000 |

Cash at bank remains positive through all three years on the base case.

**Pre-money valuation range (eight-method weighted analysis): £3.5M — £5.5M**

---

## Slide 12 — Vision

**If AI makes apps cheaper, the platform becomes more valuable. We own that layer.**

The central thesis of Spike Land is not a feature. It is a structural bet on where value accrues in the AI-native software stack.

When code generation is cheap and fast, differentiation moves to:

- The runtime that executes the generated code reliably
- The tool ecosystem that gives the code capabilities
- The deployment layer that gets it in front of users
- The testing model that ensures it behaves correctly

This is the layer Spike Land is building.

**The near-term vision (24 months):** Spike Land is the default MCP platform for indie developers, AI-native startups, and small engineering teams. Every developer who adds an MCP server to their workflow considers spike.land first.

**The medium-term vision (3–5 years):** Spike Land is the app store and runtime layer for the AI-native application economy — the equivalent of what the App Store was to mobile, or what npm was to Node.js. Third-party tool publishers earn revenue through the platform. Enterprises deploy compliance-grade AI workflows through a hardened version of the same runtime.

**Why this is credible now:** The platform architecture is already aligned with where the industry is heading. Edge-native, typed contracts, MCP-native, open-source foundation, multi-surface delivery. The technical choices made in 2024 and 2025 are now mainstream infrastructure requirements. Spike Land is not catching up — it is already there.

The window to own this layer is open. The raise accelerates the path from working product to category-defining platform.

---

**Contact**

| | |
|---|---|
| **Founder** | Zoltan Erdos |
| **Email** | zoltan.erdos@spike.land |
| **Website** | spike.land |
| **GitHub** | github.com/zerdos |
| **LinkedIn** | linkedin.com/in/zerdos |
| **CLI (try it now)** | `npx @spike-land-ai/spike-cli` |
| **Company** | SPIKE LAND LTD, Brighton, UK (Company #16906682) |

---

## Appendix A — Architecture Detail

**Runtime stack:**

```
spike.land platform
├── Cloudflare Workers (global edge, sub-50ms latency)
├── Durable Objects (real-time state, collaboration)
├── D1 (managed relational database, SQLite-compatible)
├── R2 (object storage)
└── esbuild-wasm (TypeScript/JSX transpilation at the edge)

MCP layer
├── 80+ native tools (hosted, metered, auth-gated)
├── Multiplexer (lazy-loading, 47,000 → 400 token context reduction)
└── Cross-origin MCP surface (any agent, any IDE, any shell)

Developer surfaces
├── spike-cli (npm, open-source, MCP multiplexer)
├── Web dashboard (spike.land)
├── Live browser editor (React + live preview)
└── Embedded / offline bundles
```

**Monorepo structure (25 packages):**

| Category | Packages |
|---|---|
| Platform stack | spike-app, spike-edge, spike-land-mcp, mcp-auth, mcp-server-base |
| MCP servers | spike-cli, hackernews-mcp, mcp-image-studio, openclaw-mcp, esbuild-wasm-mcp |
| Core infrastructure | spike-land-backend, transpile, react-ts-worker, code, esbuild-wasm |
| Domain packages | chess-engine, qa-studio, state-machine |
| Shared config | shared, tsconfig, eslint-config |

---

## Appendix B — Risk Factors and Mitigations

| Risk | Mitigation |
|---|---|
| MCP adoption slows | Platform tools are also accessible via standard HTTP/REST. MCP is an enhancement, not a dependency. |
| Cloudflare becomes a direct competitor | Spike Land is a managed product layer above Cloudflare primitives. A partnership or acquisition path exists. |
| Large platforms add MCP hosting | Spike Land's differentiation is the developer experience, the testing model, and the tool marketplace — not raw hosting. These take years to replicate. |
| Solo founder key-person risk | Raise funds hiring. AI-assisted development reduces single-person bus-factor risk in the codebase. |
| Enterprise requires compliance controls | Audit logs, RBAC, and SSO are on the roadmap and fundable within this raise. |

---

## Appendix C — Glossary

| Term | Definition |
|---|---|
| MCP | Model Context Protocol — Anthropic's open standard for AI-tool interaction, adopted by major AI IDEs and agents |
| Durable Objects | Cloudflare's stateful edge compute primitive, providing real-time coordination without a central database |
| esbuild-wasm | WebAssembly build of esbuild, enabling TypeScript/JSX transpilation inside a Cloudflare Worker at the edge |
| Multiplexer | Spike Land's lazy-loading architecture that exposes 530+ tools while loading only ~400 tokens of context per agent session |
| Typed tool contract | A Zod-validated MCP tool definition that can be invoked identically from CLI, browser, agent, or CI pipeline |

---

*Document version: 1.0 — March 2026*
*Classification: Generic investor version — suitable for any investor meeting*
*For SEIS-specific financial detail, see BUSINESS_PLAN.md*
*For institutional / moonshot projections, see INVESTEC_PITCH.md*
