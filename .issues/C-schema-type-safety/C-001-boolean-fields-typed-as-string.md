# C-001 Fix Boolean Fields Typed as String

**Priority:** P1 — High
**Category:** Schema & Type Safety
**Type:** Bug Fix
**Affected Personas:** Technical Founder, Classic Indie, Enterprise DevOps, In-house Dev, Startup DevOps
**Estimated Effort:** M

## Problem

Multiple MCP tool schemas define boolean parameters (like `confirm`, `isActive`, `isFeatured`, `remote_only`, `unreadOnly`) as `string` type instead of `boolean`. Similarly, numeric fields (`rating`, `limit`, `offset`, `node_count`) are typed as `string` instead of `number`. This causes AI tool-callers to send wrong types, leading to silent failures or unexpected behavior.

## Evidence

- **Technical Founder (R1)**: "Schema types are wrong everywhere — `confirm`, `isActive`, `isFeatured`, `remote_only`, `unreadOnly` are all typed as `string` but should be `boolean`; `rating`, `limit`, `offset`, `node_count` should be `number` — this suggests the MCP layer isn't type-safe"
- **AI Indie (R1)**: "`billing_cancel_subscription` has `confirm` typed as string, not boolean — minor but signals schema carelessness"
- **Classic Indie (R2)**: "`store_app_rate` accepts `rating` as a `string` not a number — invites malformed input"
- **In-house Dev (R1)**: "ALL required arrays include everything — optional parameters like `confirm`, `since`, `agent_id`, `status` are marked `required` in the schema"

## Acceptance Criteria

- [ ] All boolean parameters use `{ type: "boolean" }` in Zod/JSON Schema
- [ ] All numeric parameters use `{ type: "number" }` in Zod/JSON Schema
- [ ] Affected tools verified: `billing_cancel_subscription`, `billing_update_subscription`, `store_app_rate`, `career_match_jobs`, `store_browse_category`, `netsim_*`, `crdt_*`
- [ ] Schema validation tests updated to catch type mismatches

## Implementation Notes

Tool schemas are defined in the spike-land-mcp package using Zod. Search for `z.string()` on fields that should be `z.boolean()` or `z.number()`. A systematic audit of all tool schemas should accompany this fix.
