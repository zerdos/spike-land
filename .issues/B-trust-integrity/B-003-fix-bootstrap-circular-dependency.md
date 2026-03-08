# B-003 Fix `bootstrap_create_app` Circular Dependency

**Priority:** P0 — Critical
**Category:** Trust & Integrity
**Type:** Bug Fix
**Affected Personas:** ALL 16 personas flagged this
**Estimated Effort:** M

## Problem

`bootstrap_create_app` requires `codespace_id` as a required field, but there is no tool to create or list codespaces in the MCP registry. This creates a circular dependency where the primary app-creation workflow is dead on arrival — users cannot create an app because they cannot obtain the prerequisite codespace ID.

The same pattern repeats for `store_ab` deployment tools and `store_app_deploy`, which also require `codespace_id` or `base_codespace_id`.

## Evidence

Flagged across all personas:

- **AI Indie (R1)**: "`bootstrap_create_app` requires `codespace_id` as a required field but there is no tool in this list to create or list codespaces — circular dependency with no entry point."
- **Technical Founder (R2)**: "`bootstrap_create_app` requires a `codespace_id` as a mandatory param, but there is no tool to create or list codespaces; the flow is broken before it starts"
- **Non-technical Founder (R1)**: "requires a `codespace_id` — a non-technical user has no idea what this is or where to get one"
- **Agency Dev (R1)**: "requires a `codespace_id` as required input, but there's no `codespace_create` tool in the list — circular dependency with no entry point"
- **AI Hobbyist (R1)**: "could be interesting for creative apps but requires knowing `codespace_id` with no guidance on how to get one"

## Acceptance Criteria

- [ ] Either:
  - (a) Add `codespace_create` and `codespace_list` tools to the MCP registry, OR
  - (b) Make `codespace_id` optional in `bootstrap_create_app` and auto-create a codespace, OR
  - (c) Provide a compound "create app from scratch" tool that handles codespace creation internally
- [ ] A new user can go from zero to a created app without needing a pre-existing codespace
- [ ] All tools requiring `codespace_id` document how to obtain one

## Implementation Notes

The codespace concept may be tied to the edge service (`src/spike-edge/`) or the backend (`src/spike-land-backend/`). Check if codespace creation exists as an internal API but simply wasn't exposed as an MCP tool.
