# A-004 Commit Image-Studio Re-export Shims

**Priority:** N/A (housekeeping)
**Category:** Uncommitted Changes
**Type:** Refactor
**Affected Personas:** N/A (internal)
**Estimated Effort:** S

## Problem

48 untracked files in `src/mcp-tools/image-studio/` are re-export shims created during Phase 2 file reorganization. These provide backward-compatible import paths for the image-studio MCP tools but were never committed.

## Evidence

48 untracked files:
- `src/mcp-tools/image-studio/define-tool.ts`
- `src/mcp-tools/image-studio/types.ts`
- `src/mcp-tools/image-studio/tools/` — 46 tool shim files:
  `album-create.ts`, `album-delete.ts`, `album-images.ts`, `album-list.ts`, `album-reorder.ts`, `album-update.ts`, `album.ts`, `analyze.ts`, `auto-tag.ts`, `avatar.ts`, `banner.ts`, `blend.ts`, `bulk-delete.ts`, `compare.ts`, `credits.ts`, `crop.ts`, `delete.ts`, `diagram.ts`, `duplicate.ts`, `edit.ts`, `enhance.ts`, `export.ts`, `generate.ts`, `history.ts`, `icon.ts`, `job-status.ts`, `list.ts`, `pipeline-delete.ts`, `pipeline-list.ts`, `pipeline-save.ts`, `pipeline.ts`, `remove-bg.ts`, `resize.ts`, `screenshot.ts`, `share.ts`, `subject-delete.ts`, `subject-list.ts`, `subject-save.ts`, `update.ts`, `upload.ts`, `versions.ts`, `watermark.ts`

Each file is ~1 line (a re-export from the new location).

## Acceptance Criteria

- [ ] All 48 files committed
- [ ] `mcp-image-studio` package builds successfully
- [ ] Existing imports via old paths resolve correctly through shims

## Implementation Notes

These are thin re-export files (e.g., `export * from "../new-location/tool.js"`). They exist to maintain backward compatibility during the Phase 2 migration.
