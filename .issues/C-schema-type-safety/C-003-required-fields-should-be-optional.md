# C-003 Fix Required Fields That Should Be Optional

**Priority:** P1 — High
**Category:** Schema & Type Safety
**Type:** Bug Fix
**Affected Personas:** ML Engineer, In-house Dev, Startup DevOps, Classic Indie, AI Hobbyist
**Estimated Effort:** M

## Problem

Multiple tool schemas mark pagination/filter parameters as required when they are logically optional. This forces callers to pass empty strings or dummy values for a simple "list everything" call, which is error-prone and breaks the principle of progressive disclosure.

## Evidence

- **ML Engineer (R1)**: "`storage_list` prefix/limit/cursor are required fields but logically should be optional — forces awkward empty-string workarounds for a simple 'list everything' call"
- **In-house Dev (R2)**: "Many required fields are clearly optional — `storage_list` requires `prefix`, `limit`, `cursor` but these are obviously pagination/filter params"
- **Startup DevOps (R2)**: "`storage_list` requires mandatory `prefix`, `limit`, `cursor` params — all marked required even though they're logically optional filters"
- **AI Hobbyist (R2)**: "Many `required` arrays include fields that are clearly optional — e.g., `storage_list` lists `prefix`, `limit`, `cursor` as required with empty descriptions"
- **Classic Indie (R2)**: "`report_bug` has `error_code` as required — I won't have an error code for a UX complaint"

Affected tools include: `storage_list`, `storage_manifest_diff`, `storage_upload_batch`, `report_bug`, `store_search`, `chat_send_message`, and others.

## Acceptance Criteria

- [ ] `storage_list`: `prefix`, `limit`, `cursor` made optional with sensible defaults
- [ ] `storage_manifest_diff`: `files` parameter has proper description and type
- [ ] `storage_upload_batch`: `files` parameter has proper description and type
- [ ] `report_bug`: `error_code` made optional
- [ ] `store_search`: `category` made optional
- [ ] `chat_send_message`: `model` and `system_prompt` have defaults
- [ ] All pagination parameters across all tools are optional with defaults

## Implementation Notes

Systematic search needed: find all tools where `required` array includes pagination/filter fields. Use Zod `.optional().default()` pattern for sensible defaults.
