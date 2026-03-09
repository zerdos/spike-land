# App Factory Plan

This is the pragmatic version of the goal:

`today: plan -> app spec -> typed tools -> generated surfaces -> working vertical slice`

Not "any app" in one day. The first real target is a broad, valuable class of complex apps:

- authenticated internal tools
- multi-entity CRUD apps
- workflow/status apps
- admin dashboards with forms, tables, actions, and media

That class already matches the strongest shape in the current platform and the interface direction captured in [`docs/mcp/TYPED_TOOL_SURFACES.md`](/Users/z/Developer/spike-land-ai/docs/mcp/TYPED_TOOL_SURFACES.md).

## Product Promise

As a builder, I can give Spike Land a structured app plan and receive a working app skeleton with typed MCP tools, session-aware UI surfaces, and a testable runtime loop.

## Honest Scope For Today

Today's win condition is not arbitrary software generation. It is:

1. ingest a structured plan
2. normalize it into an app spec
3. generate typed tool contracts for the plan
4. derive renderable surfaces from those contracts
5. ship one end-to-end sample app from that pipeline

If we do that well, the system can expand quickly. If we skip those layers and ask agents to freestyle everything, it will collapse under complexity.

## System Architecture

### Layer 1: Plan Compiler

Input:

- app name
- users/roles
- entities
- workflows
- views
- integrations
- policies

Output:

- canonical `AppSpec`

The `AppSpec` is the contract between planning and generation. It must be deterministic and versioned.

### Layer 2: Tool Generator

Convert `AppSpec` into typed MCP tools.

Generated categories:

- entity CRUD
- search/list/filter
- workflow transitions
- dashboard aggregations
- admin operations
- integration actions

Each generated tool needs:

- stable `verb_noun` name
- Zod-backed input schema
- output schema / result contract
- category metadata
- auth/session hints
- test fixtures

### Layer 3: Surface Compiler

Convert tool contracts into surface definitions.

Generated primitives:

- forms
- tables
- result cards
- action bars
- link groups
- media panels
- session-state banners

This is where the typed tool contract becomes callable software, not just an API endpoint.

### Layer 4: Runtime Binder

Bind generated surfaces to:

- MCP session client
- auth state
- organization state
- tool responses
- follow-up actions

### Layer 5: Agent QA Loop

Use agents against the generated system immediately:

- Claude: inspect generated contracts and local code paths
- Gemini: review generated diffs and propose fixes
- Jules: async follow-up work on connected repos

Later, route work through an MCP agent router using ELO, trust, latency, and cost.

## User Stories

### Story 1

As a founder, I want to submit an app plan in a structured format, so that the platform can generate a deterministic app spec instead of guessing.

Acceptance criteria:

- the plan validates against a schema
- missing sections are reported explicitly
- the normalized spec is stable for the same input

### Story 2

As a platform, I want to derive typed MCP tools from the app spec, so that business logic exists before bespoke UI code exists.

Acceptance criteria:

- each action in the plan maps to at least one tool
- generated tools have schemas, descriptions, and categories
- generated tools can be registered without manual edits

### Story 3

As a user, I want generated forms and tables from tool contracts, so that the first usable UI appears without handcrafted screens.

Acceptance criteria:

- input schemas render forms
- collection outputs render tables
- action metadata renders buttons

### Story 4

As an operator, I want session-aware flows, so that generated apps behave correctly for auth, role, and org boundaries.

Acceptance criteria:

- generated surfaces show session state
- protected actions can declare auth requirements
- role-gated actions are hidden or disabled correctly

### Story 5

As a developer, I want generated apps to be testable at unit speed, so that changes are safe and agent-friendly.

Acceptance criteria:

- generated tool contracts have unit tests
- surface compiler has snapshot coverage
- one fixture plan can regenerate the same app deterministically

### Story 6

As the orchestration layer, I want agent traces and prompt history, so that routing can later optimize for reliability instead of novelty.

Acceptance criteria:

- prompt history is persisted locally
- generated app QA runs are attributable to an agent
- future router inputs include success/failure and latency data

## Build Order

### Phase A: Plan To Spec

Build:

- `AppPlanSchema`
- `AppSpec`
- plan normalizer
- one fixture plan for a realistic admin app

### Phase B: Spec To Tools

Build:

- tool contract generator
- output/result contract generator
- test fixture generator

### Phase C: Tools To Surfaces

Build:

- surface AST
- compiler from contract -> AST
- MDX renderer for AST

### Phase D: Runtime

Build:

- session-aware renderer bindings
- tool execution bridge
- action chaining

### Phase E: QA

Build:

- fixture regeneration test
- agent review prompts
- smoke app demo

## What We Should Build Today

One thin but real vertical slice:

- sample app plan: "User management + orders admin"
- generated entities: users, orders
- generated actions: create user, list users, get user profile, deactivate user, list orders
- generated surfaces: search form, detail card, table, primary/secondary action buttons
- generated session banner: active org + active role

That exactly matches the product direction in the image you shared and keeps the scope under control.

## Definition Of Done For Today

- a validated app plan format exists
- one fixture plan compiles to an app spec
- the app spec compiles to typed tool contracts
- the tool contracts compile to renderable surface definitions
- one generated app surface renders locally
- tests prove the generation pipeline is deterministic
- agent prompts are logged for future routing and tuning

## Roadmap Link

This plan sharpens work already tracked in [`docs/business/ROADMAP.md`](/Users/z/Developer/spike-land-ai/docs/business/ROADMAP.md), especially:

- typed tool contract -> surface compiler
- typed-to-MDX universal runner
- session-aware generated app surfaces
- prompt history and trace capture per agent
- MCP agent router using ELO + trust + latency + cost
