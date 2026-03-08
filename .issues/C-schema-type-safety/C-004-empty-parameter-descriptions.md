# C-004 Add Missing Parameter Descriptions

**Priority:** P2 — Medium
**Category:** Schema & Type Safety
**Type:** Improvement
**Affected Personas:** AI Indie, ML Engineer, Classic Indie, In-house Dev
**Estimated Effort:** M

## Problem

Multiple tool parameters have empty string `""` descriptions, making them unusable without external documentation. AI tool-callers rely on descriptions to understand what values to pass.

## Evidence

- **AI Indie (R1)**: "Multiple required parameters have empty string descriptions (`storage_manifest_diff` files: `""`, `storage_upload_batch` files: `""`, `storage_list` prefix/limit/cursor: `""`) — unusable without external docs."
- **Classic Indie (R2)**: "`storage_manifest_diff` and `storage_upload_batch` take a `files` param typed as `string` — no schema for what that string format is (JSON? CSV? multipart?)"
- **AI Hobbyist (R2)**: "required with empty descriptions, making the schema misleading"

## Acceptance Criteria

- [ ] Zero parameters have empty string `""` descriptions
- [ ] Every parameter description explains: what it is, expected format, and example value
- [ ] Complex parameters (like `files` in upload tools) include format documentation
- [ ] A lint rule or test prevents empty descriptions from being added in the future

## Implementation Notes

Search for `description: ""` across all tool schema definitions. Each description should be 1-2 sentences explaining the parameter's purpose and expected format/values.
