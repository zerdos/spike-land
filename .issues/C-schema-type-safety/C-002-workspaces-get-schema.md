# C-002 Fix `workspaces_get` Requiring Both workspace_id AND slug

**Priority:** P1 — High
**Category:** Schema & Type Safety
**Type:** Bug Fix
**Affected Personas:** AI Indie, Classic Indie, Agency Dev, Technical Founder, In-house Dev
**Estimated Effort:** S

## Problem

`workspaces_get` marks both `workspace_id` AND `slug` as required fields. Logically, these are alternative identifiers — you look up a workspace by ID or by slug, not both. Requiring both is an API design error that forces callers to know redundant information.

The same pattern appears in `workspaces_update`, which requires all fields (`workspace_id`, `name`, `slug`) even for partial updates.

## Evidence

- **AI Indie (R1)**: "`workspaces_get` requires both `workspace_id` AND `slug` as required — logically these are alternatives, not both needed. Bad schema design."
- **Agency Dev (R1)**: "`workspaces_*` schema issues — `workspaces_get` marks both `workspace_id` and `slug` as required but they're alternatives"
- **Classic Indie (R2)**: "`workspaces_update` marks all three fields (`workspace_id`, `name`, `slug`) as required — you can't rename without also providing a slug"
- **Technical Founder (R2)**: "`workspaces_get` requires both `workspace_id` and `slug` — you'd only ever have one, making this always fail or require guessing"

## Acceptance Criteria

- [ ] `workspaces_get` accepts either `workspace_id` OR `slug` (at least one required)
- [ ] `workspaces_update` only requires `workspace_id` + the fields being changed
- [ ] Schema uses Zod discriminated union or `.optional()` appropriately
- [ ] Tests verify lookup by ID alone and by slug alone both work

## Implementation Notes

Use `z.union()` or make both fields optional with a refinement that at least one must be provided. For `workspaces_update`, use `.partial()` on the update fields while keeping `workspace_id` required.
