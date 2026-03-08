# A-005 Commit Supporting Files

**Priority:** N/A (housekeeping)
**Category:** Uncommitted Changes
**Type:** Housekeeping
**Affected Personas:** N/A (internal)
**Estimated Effort:** S

## Problem

Three untracked supporting files need to be committed or deliberately excluded:

1. `.gitignore` — Security addition to ignore `google-client-secret.json`
2. `scripts/google-oauth-refresh.ts` — Utility script for Google OAuth token refresh
3. `MCP_64_AGENTS_REPORT.md` — 465KB swarm test report from 64 agent sessions

## Evidence

**.gitignore** diff:
```diff
+# Secrets
+**/google-client-secret.json
```

**scripts/google-oauth-refresh.ts**: New utility script (untracked)

**MCP_64_AGENTS_REPORT.md**: 465KB report from 16 personas × 4 rounds = 64 agent sessions testing the spike.land MCP registry. Contains ~300+ findings that informed all tickets in this `.issues/` directory.

## Acceptance Criteria

- [ ] `.gitignore` change committed (security-critical — prevents accidental secret exposure)
- [ ] `scripts/google-oauth-refresh.ts` committed
- [ ] Decision made on `MCP_64_AGENTS_REPORT.md`: commit as reference or add to `.gitignore`
- [ ] No `google-client-secret.json` files exist in the repo

## Implementation Notes

The `.gitignore` addition is the highest priority item here — it prevents Google OAuth client secrets from being accidentally committed. Commit this first, independently if needed.
