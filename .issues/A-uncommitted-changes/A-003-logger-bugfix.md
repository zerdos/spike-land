# A-003 Logger Bug Fix: console.info → console.log

**Priority:** N/A (housekeeping)
**Category:** Uncommitted Changes
**Type:** Bug Fix
**Affected Personas:** N/A (internal)
**Estimated Effort:** S

## Problem

The shared logger's `info` level was using `console.info` which behaves differently from `console.log` in some runtimes (notably Cloudflare Workers, where `console.info` may not appear in structured logs). The fix changes it to `console.log` for consistent behavior.

## Evidence

1 file with uncommitted change:

**src/core/shared-utils/core-logic/logger.ts** (line 58):
```diff
-    info: (message, data) => log("info", console.info, message, data),
+    info: (message, data) => log("info", console.log, message, data),
```

## Acceptance Criteria

- [ ] Change committed
- [ ] Logger info-level output appears consistently in Cloudflare Workers logs

## Implementation Notes

Single-line change. The `log()` helper already tags the level as `"info"` in structured output — the second argument is just the console method used for local output.
