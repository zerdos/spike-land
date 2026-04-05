# Typed Tool Surfaces

This document translates the current product direction into a concrete platform track: strongly typed MCP tool contracts should compile into reusable, session-aware software surfaces instead of asking an LLM to invent a UI from scratch on every run.

## Target Shape

The target loop is:

`typed tool contract -> normalized schema -> derivation pipeline -> MDX surface -> live session-aware UI`

That means a tool like `getUserProfile` should be able to produce:

- a form surface for inputs
- a result card for structured output
- action buttons for follow-up tools
- tables, media, links, and session-state badges when the contract allows them

## What Already Exists In This Repo

- [`src/mcp-tools/image-studio/core-logic/define-tool.ts`](../../src/mcp-tools/image-studio/core-logic/define-tool.ts): a fluent typed tool builder with validation, ownership checks, billing hooks, job hooks, and agent instructions
- [`src/mcp-tools/image-studio/core-logic/tool-manifest.ts`](../../src/mcp-tools/image-studio/core-logic/tool-manifest.ts): convention-based manifest derivation from generated schemas
- [`src/frontend/platform-frontend/core-logic/mcp-client.ts`](../../src/frontend/platform-frontend/core-logic/mcp-client.ts): web-side MCP session bootstrap and tool execution
- [`src/monaco-editor/src/languages/definitions/mdx/mdx.ts`](../../src/monaco-editor/src/languages/definitions/mdx/mdx.ts): MDX language support already exists in the editor stack

## Architecture Direction

### 1. Canonical Tool Contract Layer

Define one canonical contract shape for renderable tools. It should extend today's Zod-driven contracts with render metadata instead of replacing them.

Minimum additions:

- input field kinds: text, number, enum, boolean, date, file, image, rich text
- output field kinds: scalar, record, collection, media, timeline, status
- action affordances: next tools, destructive actions, confirmation requirements
- session hints: auth required, role hints, organization scope, active object scope
- examples: sample inputs and sample output payloads for better derived surfaces

### 2. Derivation Pipeline

Add a compiler that transforms canonical tool contracts into a neutral surface AST.

The AST should be intentionally small:

- `Form`
- `Section`
- `Field`
- `ResultCard`
- `Table`
- `Media`
- `ActionBar`
- `LinkList`
- `Notice`
- `SessionBadge`

This keeps the UI renderers predictable and testable. The compiler should be deterministic, not prompt-driven.

### 3. MDX Universal Runner

Compile the surface AST into MDX blocks or a renderable MDX-compatible component tree. MDX is the right middle layer because it can express rich layouts while still being composable, inspectable, and editor-friendly.

Runtime responsibilities:

- bind tool inputs to the MCP session client
- render structured outputs without custom per-tool frontend code
- attach follow-up actions to other tools
- preserve session state and auth state across calls
- emit analytics for render success, submit success, submit failure, and follow-up actions

### 4. Session-Aware Flows

Every generated surface should know whether it is operating inside:

- an authenticated user session
- an organization context
- a long-lived agent task
- a browser handoff boundary

The UI should surface those states directly instead of hiding them in prompts.

### 5. Agent Routing Layer

Agent use should start now with the local CLIs, then graduate into an MCP-managed router later.

Immediate mode:

- Claude for local repo inspection, edits, and debugging
- Gemini for review, alternative implementation proposals, and batch fixing
- Jules for async work on repos already connected in Jules

Later mode:

- an MCP router assigns work by ELO, trust, latency, cost, and domain fit
- prompt history and traces feed the router's ranking model
- failed runs reduce confidence; successful verified runs increase it

## Near-Term Build Order

1. Define a canonical renderable tool-contract type shared across tool packages.
2. Add a schema-to-surface compiler with snapshot tests.
3. Build a minimal MDX runner for forms, tables, result cards, and action bars.
4. Wire the runner into one vertical slice first, likely an MCP-heavy internal app surface.
5. Add telemetry and prompt-history plumbing so agent output and user interaction can be ranked later.

## Non-Goal

The goal is not "ask AI to build a fresh UI every time." The goal is to turn typed tool contracts directly into callable software surfaces with stable runtime behavior.
