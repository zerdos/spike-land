# Bugbook — Sprint 6 DX Audit

> Date: 2026-03-10 | Source: 16-engineer DX audit | Entries: 19

## Summary

| # | Title | Severity | Category | Status |
|---|-------|----------|----------|--------|
| 1 | No log persistence (logpush removed, no replacement) | high | observability | CANDIDATE |
| 2 | Analytics Engine bound but unused | medium | observability | CANDIDATE |
| 3 | Rollback script is a manual stub | medium | ci-cd | CANDIDATE |
| 4 | No distributed tracing | medium | observability | CANDIDATE |
| 5 | Explicit `any` in chess Prisma stub | medium | type-safety | CANDIDATE |
| 6 | ESLint type rules in warning mode | low | type-safety | CANDIDATE |
| 7 | 11 @ts-ignore in vendored monaco-editor | low | type-safety | CANDIDATE |
| 8 | 6 spike-chat stub endpoints | high | feature-gap | CANDIDATE |
| 9 | Reorganize pipeline missing incremental filtering | medium | feature-gap | CANDIDATE |
| 10 | google-ads MCP tool incomplete | medium | feature-gap | CANDIDATE |
| 11 | 20 uncommitted config files | high | ci-cd | DISCARDED |
| 12 | Transpile test config removed | medium | ci-cd | DISCARDED |
| 13 | NPM_TOKEN expired for npmjs.org | medium | ci-cd | IN PROGRESS |
| 14 | Cloudflare API token is temporary | high | ci-cd | IN PROGRESS |
| 15 | Stale worktrees wasting disk | low | maintenance | CANDIDATE |
| 16 | No GitHub issue templates | low | dx | CANDIDATE |
| 17 | Error metadata size limits (64KB stack, 32KB metadata; head+tail truncation) | low | error-handling | RESOLVED |
| 18 | Health checks lack latency metrics | medium | observability | CANDIDATE |
| 19 | spike-chat D1 database not created | high | ci-cd | CANDIDATE |

**ACTIVE** = confirmed across 2+ audit cycles. **CANDIDATE** = first observation. **DISCARDED** = not reproducible on the committed branch.

---

## Detailed Entries

### BUG-S6-01: No log persistence

- **Severity**: high
- **Category**: observability
- **Status**: CANDIDATE
- **Confidence**: 0.95
- **ELO**: 1200
- **Description**: `logpush = true` was removed from all 9 wrangler.toml files in Sprint 5, but no replacement log destination (Logpush job, tail worker, or external sink) was configured. Console logs from production workers are lost after the real-time tail window closes.
- **Files**: All `packages/*/wrangler.toml`

### BUG-S6-02: Analytics Engine bound but unused

- **Severity**: medium
- **Category**: observability
- **Status**: CANDIDATE
- **Confidence**: 0.90
- **ELO**: 1200
- **Description**: `spike_analytics` dataset is bound as `ANALYTICS` in `packages/spike-edge/wrangler.toml` (line 64), but zero lines of code write to it. The binding exists but produces no data.
- **Files**: `packages/spike-edge/wrangler.toml:64`

### BUG-S6-03: Rollback script is a manual stub

- **Severity**: medium
- **Category**: ci-cd
- **Status**: CANDIDATE
- **Confidence**: 0.85
- **ELO**: 1200
- **Description**: `.github/scripts/rollback-workers.sh` contains manual instructions rather than automated rollback logic. In an incident, operators must manually find version IDs and run wrangler commands.
- **Files**: `.github/scripts/rollback-workers.sh`

### BUG-S6-04: No distributed tracing

- **Severity**: medium
- **Category**: observability
- **Status**: CANDIDATE
- **Confidence**: 0.80
- **ELO**: 1200
- **Description**: No OpenTelemetry, request-id correlation, or tracing spans exist across the multi-worker architecture (spike-edge → mcp-auth → spike-land-mcp → spike-land-backend). Debugging cross-service issues requires manual log correlation.

### BUG-S6-05: Explicit `any` in chess Prisma stub

- **Severity**: medium
- **Category**: type-safety
- **Status**: RESOLVED (2026-04-06)
- **Confidence**: 0.90
- **ELO**: 1200
- **Description**: One explicit `any` remains in first-party (non-vendored) code: `const prismaStub: any = new Proxy(...)`. This violates the monorepo convention of "never use `any`".
- **Files**: `src/core/chess/core-logic/prisma.ts` (deleted)
- **Resolution**: Fixed in commit `11ef84c3` ("refactor: replace Prisma stubs with ChessStorage interface in chess-engine"). The `prismaStub: any` proxy was eliminated entirely by deleting `src/core/chess/core-logic/prisma.ts` and `src/core/chess/lib/prisma.ts` and replacing them with a typed `ChessStorage` interface (`src/core/chess/core-logic/storage.ts`) plus an `InMemoryChessStorage` implementation. All three managers (game/player/challenge) now accept storage via `setStorage()` injection, and tests were rewritten from mock-checking to behavior-checking. Verified: zero `any` annotations remain in `src/core/chess`, `yarn typecheck` passes in `packages/chess-engine`, and 163 chess-engine tests pass.

### BUG-S6-06: ESLint type rules in warning mode

- **Severity**: low
- **Category**: type-safety
- **Status**: CANDIDATE
- **Confidence**: 0.85
- **ELO**: 1200
- **Description**: `src/monaco-editor/eslint.config.mjs` has a TODO comment to upgrade `no-explicit-any` and `no-unnecessary-type-assertion` from "warn" to "error". Until upgraded, violations pass CI.
- **Files**: `src/monaco-editor/eslint.config.mjs`

### BUG-S6-07: 11 @ts-ignore in vendored monaco-editor

- **Severity**: low
- **Category**: type-safety
- **Status**: CANDIDATE
- **Confidence**: 0.75
- **ELO**: 1200
- **Description**: 11 `@ts-ignore` directives exist in vendored monaco-editor code. Acceptable for vendored code but worth tracking as they may mask real type errors when upgrading the vendored dependency.

### BUG-S6-08: 6 spike-chat stub endpoints

- **Severity**: high
- **Category**: feature-gap
- **Status**: CANDIDATE
- **Confidence**: 0.95
- **ELO**: 1200
- **Description**: Six spike-chat API endpoints return hardcoded empty responses: `read-cursors`, `bookmarks`, `threads`, `pins`, `presence`, `reactions`. These are advertised in the API surface but non-functional.
- **Files**: spike-chat route handlers

### BUG-S6-09: Reorganize pipeline missing incremental filtering

- **Severity**: medium
- **Category**: feature-gap
- **Status**: CANDIDATE
- **Confidence**: 0.85
- **ELO**: 1200
- **Description**: `src/mcp-tools/reorganize/core-logic/pipeline.ts` line 37 has a TODO for git diff-based incremental filtering. Currently the pipeline processes all files on every run.
- **Files**: `src/mcp-tools/reorganize/core-logic/pipeline.ts:37`

### BUG-S6-10: google-ads MCP tool incomplete

- **Severity**: medium
- **Category**: feature-gap
- **Status**: CANDIDATE
- **Confidence**: 0.80
- **ELO**: 1200
- **Description**: The google-ads MCP tool was a bare `export {}` stub. It has been updated to `export * from "./mcp/index"` but the implementation may still be incomplete.

### BUG-S6-11: 20 uncommitted config files

- **Severity**: high
- **Category**: ci-cd
- **Status**: DISCARDED
- **Confidence**: 0.10
- **ELO**: 1200
- **Description**: This observation came from a dirty local worktree during the audit and is not reproducible on the committed branch. `git status --porcelain` is clean for `main` at commit `a9a1a95d`.

### BUG-S6-12: Transpile test config removed

- **Severity**: medium
- **Category**: ci-cd
- **Status**: DISCARDED
- **Confidence**: 0.10
- **ELO**: 1200
- **Description**: The committed `.tests/vitest.config.ts` still contains the `transpile` package test block, so the removal noted during the audit was not reproducible on this branch.
- **Files**: `.tests/vitest.config.ts`

### BUG-S6-13: NPM_TOKEN expired

- **Severity**: medium
- **Category**: ci-cd
- **Status**: IN PROGRESS — runbook drafted, awaiting account-holder rotation
- **Confidence**: 0.95
- **ELO**: 1200
- **Description**: The NPM_TOKEN for publishing to npmjs.org has expired. CI has `continue-on-error: true` as a workaround, meaning npm publish failures are silently ignored. Packages are not being published to the public registry.
- **Resolution path**: see `docs/operations/TOKEN_ROTATION.md` (NPM_TOKEN section + Appendix A for the post-rotation cleanup PR removing `continue-on-error: true` from `.github/workflows/ci.yml:253`).

### BUG-S6-14: Cloudflare API token is temporary

- **Severity**: high
- **Category**: ci-cd
- **Status**: IN PROGRESS — runbook drafted, awaiting account-holder rotation
- **Confidence**: 0.95
- **ELO**: 1200
- **Description**: CI uses an OAuth token from `wrangler login` with ~1.5hr expiry instead of a permanent API token. Deployments fail when the token expires. Needs a permanent API token from dash.cloudflare.com/profile/api-tokens with Workers Scripts, D1, KV, R2, Zone permissions.
- **Resolution path**: see `docs/operations/TOKEN_ROTATION.md` (Cloudflare API Token section). No code-side cleanup is required after rotation — the API token is consumed by all `deploy-workers` steps in `.github/workflows/ci.yml` and by `.github/scripts/rollback-workers.sh`.

### BUG-S6-15: Stale worktrees wasting disk

- **Severity**: low
- **Category**: maintenance
- **Status**: CANDIDATE
- **Confidence**: 0.85
- **ELO**: 1200
- **Description**: `.claude/worktrees/agent-acf30152/` and `agent-abe5a242/` contain full copies of `packages/` directory, wasting disk space.
- **Files**: `.claude/worktrees/agent-acf30152/`, `.claude/worktrees/agent-abe5a242/`

### BUG-S6-16: No GitHub issue templates

- **Severity**: low
- **Category**: dx
- **Status**: CANDIDATE
- **Confidence**: 0.90
- **ELO**: 1200
- **Description**: No `.github/ISSUE_TEMPLATE/` directory exists. Contributors have no structured templates for bug reports, feature requests, or tech debt items.

### BUG-S6-17: Error metadata size limits

- **Severity**: low
- **Category**: error-handling
- **Status**: RESOLVED
- **Confidence**: 0.75
- **ELO**: 1200
- **Description**: The `/errors/ingest` endpoint previously truncated stack traces at 8KB and metadata at 4KB, silently losing diagnostic information from deep async chains and large metadata payloads.
- **Resolution**: Hard caps raised to 64KB stack / 32KB metadata. When a payload exceeds the cap a head+tail strategy keeps the first 8KB and last 4KB (stack) or first 8KB and last 4KB (metadata) joined by a `[truncated N bytes]` marker, preserving the most diagnostic frames. The endpoint response now includes `original_stack_bytes`, `original_metadata_bytes`, `stored_*_bytes`, `truncated`, and `truncation_strategy` per entry, plus a top-level `limits` block. R2 offload was deliberately not used to keep the hot path single-roundtrip; head+tail is sufficient for D1 row sizing. Files: `src/edge-api/main/api/routes/errors.ts`, `src/edge-api/main/api/__tests__/errors-ingest.test.ts`.

### BUG-S6-18: Health checks lack latency metrics

- **Severity**: medium
- **Category**: observability
- **Status**: CANDIDATE
- **Confidence**: 0.85
- **ELO**: 1200
- **Description**: `/health` endpoint only checks service connectivity (up/down). No p50/p99 response time tracking, no latency percentile reporting. Degraded-but-not-down states are invisible.

### BUG-S6-19: spike-chat D1 database not created

- **Severity**: high
- **Category**: ci-cd
- **Status**: CANDIDATE
- **Confidence**: 0.95
- **ELO**: 1200
- **Description**: `packages/spike-chat/wrangler.toml` has `database_id = "TO_BE_CREATED"`. The D1 database was never provisioned, meaning the spike-chat worker cannot store any data and will fail on any DB operation.
- **Files**: `packages/spike-chat/wrangler.toml`
