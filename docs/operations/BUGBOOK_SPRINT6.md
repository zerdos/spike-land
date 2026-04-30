# Bugbook — Sprint 6 DX Audit

> Date: 2026-03-10 | Source: 16-engineer DX audit | Entries: 20 | Last synced: 2026-04-17

## Summary

| # | Title | Severity | Category | Status |
|---|-------|----------|----------|--------|
| 1 | No log persistence (logpush removed, no replacement) | high | observability | FIXED (CF-account dest pending) |
| 2 | Analytics Engine bound but unused | medium | observability | FIXED |
| 3 | Rollback script is a manual stub | medium | ci-cd | FIXED |
| 4 | No distributed tracing | medium | observability | FIXED |
| 5 | Explicit `any` in chess Prisma stub | medium | type-safety | RESOLVED |
| 6 | ESLint type rules in warning mode | low | type-safety | FIXED |
| 7 | 11 @ts-ignore in vendored monaco-editor | low | type-safety | FIXED |
| 8 | 6 spike-chat stub endpoints | high | feature-gap | FIXED |
| 9 | Reorganize pipeline missing incremental filtering | medium | feature-gap | FIXED |
| 10 | google-ads MCP tool incomplete | medium | feature-gap | FIXED |
| 11 | 20 uncommitted config files | high | ci-cd | DISCARDED |
| 12 | Transpile test config removed | medium | ci-cd | DISCARDED |
| 13 | NPM_TOKEN expired for npmjs.org | medium | ci-cd | IN PROGRESS (account-holder rotation) |
| 14 | Cloudflare API token is temporary | high | ci-cd | IN PROGRESS (account-holder rotation) |
| 15 | Stale worktrees wasting disk | low | maintenance | FIXED |
| 16 | No GitHub issue templates | low | dx | FIXED |
| 17 | Error metadata size limits (64KB stack, 32KB metadata; head+tail truncation) | low | error-handling | RESOLVED |
| 18 | Health checks lack latency metrics | medium | observability | FIXED |
| 19 | spike-chat D1 database not created | high | ci-cd | FIXED |
| 20 | mcp-auth deploy build broken (better-auth peer chain) | high | ci-cd | FIXED |

**Net open**: 0 `CANDIDATE`, 2 `IN PROGRESS` awaiting account-holder token rotation (S6-13, S6-14), 1 follow-up (S6-01 logpush destination at Cloudflare account level). Everything else merged to `main`.

**ACTIVE** = confirmed across 2+ audit cycles. **CANDIDATE** = first observation. **DISCARDED** = not reproducible on the committed branch.

---

## Detailed Entries

### BUG-S6-01: No log persistence

- **Severity**: high
- **Category**: observability
- **Status**: FIXED (worker config); destination pending Cloudflare-account action
- **Confidence**: 0.95
- **ELO**: 1200
- **Description**: `logpush = true` was removed from all 9 wrangler.toml files in Sprint 5, but no replacement log destination (Logpush job, tail worker, or external sink) was configured. Console logs from production workers are lost after the real-time tail window closes.
- **Files**: All `packages/*/wrangler.toml`
- **Fix**: `logpush = true` re-added to all 9 worker configs on branch `fix/bugbook-s6-01-logpush`. Destination (Workers Logs or Logpush job to R2/external sink) must still be configured at the Cloudflare account level — see `docs/operations/critical-runbooks.md` section 4.

### BUG-S6-02: Analytics Engine bound but unused

- **Severity**: medium
- **Category**: observability
- **Status**: FIXED
- **Confidence**: 0.90
- **ELO**: 1200
- **Description**: `spike_analytics` dataset is bound as `ANALYTICS` in `packages/spike-edge/wrangler.toml` (line 64), but zero lines of code write to it. The binding exists but produces no data.
- **Files**: `packages/spike-edge/wrangler.toml:64`
- **Resolution**: Merged in `7103385a` (branch `fix/bugbook-s6-02-analytics`) — Analytics Engine writes wired from spike-edge.

### BUG-S6-03: Rollback script is a manual stub

- **Severity**: medium
- **Category**: ci-cd
- **Status**: FIXED
- **Confidence**: 0.85
- **ELO**: 1200
- **Description**: `.github/scripts/rollback-workers.sh` contains manual instructions rather than automated rollback logic. In an incident, operators must manually find version IDs and run wrangler commands.
- **Files**: `.github/scripts/rollback-workers.sh`
- **Resolution**: Merged in `5f77db0d` (branch `fix/bugbook-s6-03-rollback-script`) — automated worker rollback script.

### BUG-S6-04: No distributed tracing

- **Severity**: medium
- **Category**: observability
- **Status**: FIXED
- **Confidence**: 0.80
- **ELO**: 1200
- **Description**: No OpenTelemetry, request-id correlation, or tracing spans exist across the multi-worker architecture (spike-edge → mcp-auth → spike-land-mcp → spike-land-backend). Debugging cross-service issues requires manual log correlation.
- **Resolution**: Merged in `a8640879` (branch `fix/bugbook-s6-04-distributed-tracing`) — request-id propagation across workers.

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
- **Status**: FIXED
- **Confidence**: 0.85
- **ELO**: 1200
- **Description**: `src/monaco-editor/eslint.config.mjs` has a TODO comment to upgrade `no-explicit-any` and `no-unnecessary-type-assertion` from "warn" to "error". Until upgraded, violations pass CI.
- **Files**: `src/monaco-editor/eslint.config.mjs`
- **Resolution**: Merged in `bccdf852` (branch `fix/bugbook-s6-06-monaco-eslint-error`) — promoted both rules to `error`.

### BUG-S6-07: 11 @ts-ignore in vendored monaco-editor

- **Severity**: low
- **Category**: type-safety
- **Status**: FIXED
- **Confidence**: 0.75
- **ELO**: 1200
- **Description**: 11 `@ts-ignore` directives exist in vendored monaco-editor code. Acceptable for vendored code but worth tracking as they may mask real type errors when upgrading the vendored dependency.

### BUG-S6-08: 6 spike-chat stub endpoints

- **Severity**: high
- **Category**: feature-gap
- **Status**: FIXED
- **Confidence**: 0.95
- **ELO**: 1200
- **Description**: Six spike-chat API endpoints return hardcoded empty responses: `read-cursors`, `bookmarks`, `threads`, `pins`, `presence`, `reactions`. These are advertised in the API surface but non-functional.
- **Files**: spike-chat route handlers
- **Resolution**: Merged in `6215a83a` (branch `fix/bugbook-s6-08-spike-chat-endpoints`) — all six endpoints implemented with D1-backed state.

### BUG-S6-09: Reorganize pipeline missing incremental filtering

- **Severity**: medium
- **Category**: feature-gap
- **Status**: FIXED
- **Confidence**: 0.85
- **ELO**: 1200
- **Description**: `src/mcp-tools/reorganize/core-logic/pipeline.ts` line 37 has a TODO for git diff-based incremental filtering. Currently the pipeline processes all files on every run.
- **Files**: `src/mcp-tools/reorganize/core-logic/pipeline.ts:37`
- **Resolution**: Merged in `802c61aa` (branch `fix/bugbook-s6-09-reorganize-incremental`) — git-diff-based incremental filtering added.

### BUG-S6-10: google-ads MCP tool incomplete

- **Severity**: medium
- **Category**: feature-gap
- **Status**: FIXED
- **Confidence**: 0.80
- **ELO**: 1200
- **Description**: The google-ads MCP tool was a bare `export {}` stub. It has been updated to `export * from "./mcp/index"` but the implementation may still be incomplete.
- **Resolution**: Merged in `8fdd2b66` (branch `fix/bugbook-s6-10-google-ads-mcp`) — campaigns, ad groups, metrics surface implemented.

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
- **Status**: FIXED
- **Confidence**: 0.85
- **ELO**: 1200
- **Description**: `.claude/worktrees/agent-acf30152/` and `agent-abe5a242/` contain full copies of `packages/` directory, wasting disk space.
- **Files**: `.claude/worktrees/agent-acf30152/`, `.claude/worktrees/agent-abe5a242/`

### BUG-S6-16: No GitHub issue templates

- **Severity**: low
- **Category**: dx
- **Status**: FIXED
- **Confidence**: 0.90
- **ELO**: 1200
- **Description**: No `.github/ISSUE_TEMPLATE/` directory exists. Contributors have no structured templates for bug reports, feature requests, or tech debt items.
- **Resolution**: Merged in `fd2883ef` (branch `fix/bugbook-s6-16-issue-templates`) — structured bug / feature / tech-debt templates added.

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
- **Status**: FIXED
- **Confidence**: 0.85
- **ELO**: 1200
- **Description**: `/health` endpoint only checks service connectivity (up/down). No p50/p99 response time tracking, no latency percentile reporting. Degraded-but-not-down states are invisible.
- **Resolution**: Merged in `868973fd` (branch `fix/bugbook-s6-18-health-latency-metrics`) — p50/p99 latency added to `/health`.

### BUG-S6-19: spike-chat D1 database not created

- **Severity**: high
- **Category**: ci-cd
- **Status**: FIXED
- **Confidence**: 0.95
- **ELO**: 1200
- **Description**: `packages/spike-chat/wrangler.toml` has `database_id = "TO_BE_CREATED"`. The D1 database was never provisioned, meaning the spike-chat worker cannot store any data and will fail on any DB operation.
- **Files**: `packages/spike-chat/wrangler.toml`
- **Resolution**: wrangler.toml already provisioned with real `database_id` (`4e93ca4f-84d4-4c50-9e03-5356ee092981`); migrations added under `packages/spike-chat/db/migrations/0001_initial.sql` (idempotent mirror of drizzle schema at `src/edge-api/spike-chat/db/`). Added `db/SETUP.md` runbook and `scripts/verify-d1.sh` sanity check. See branch `fix/bugbook-s6-19-spike-chat-d1`.

### BUG-S6-20: mcp-auth deploy build broken (better-auth peer chain)

- **Severity**: high
- **Category**: ci-cd
- **Status**: FIXED
- **Confidence**: 0.95
- **ELO**: 1200
- **Discovered**: 2026-04-17 during Sprint 6 prod deploy
- **Description**: `npm run deploy` for `packages/mcp-auth` fails at the wrangler bundle step with `Could not resolve "@better-auth/core/db/adapter"` and `"better-call/error"`. Two root causes: (1) **version drift** — `@better-auth/drizzle-adapter@^1.5.6` resolved to 1.5.6 while `better-auth@^1.5.5` resolved to 1.5.5, causing two parallel `@better-auth/core` copies (1.5.5 and 1.5.6) where neither is hoisted next to drizzle-adapter; (2) **unsatisfied peers** — `@better-auth/core@1.5.6` declares `better-call`, `jose`, `kysely`, `nanostores`, `@better-fetch/fetch`, `@better-auth/utils` as peer dependencies, and yarn berry's node-modules linker placed them under `better-auth/node_modules/` only, so any sibling reaching `@better-auth/core` from a different node_modules subtree (e.g., the hoisted drizzle-adapter) cannot resolve the peers. CI silently swallowed the failure because `.github/workflows/ci.yml:253` has `continue-on-error: true` on the deploy step (tracked under BUG-S6-13/14).
- **Files**: `packages/mcp-auth/package.json`, `.yarnrc.yml`
- **Resolution** (2026-04-17, deploy version `63a0dae1-88c0-453b-9af4-808462def81d`):
  1. Pinned `better-auth` and `@better-auth/drizzle-adapter` to exact `1.5.6` (was `^1.5.5` and `^1.5.6`), eliminating the version drift.
  2. Added two `packageExtensions` entries in `.yarnrc.yml` to convert the relevant peer-deps into hard deps so yarn's node-modules linker co-locates them with their consumer:
     ```yaml
     "@better-auth/core@*":
       dependencies:
         "@better-auth/utils": "*"
         "@better-fetch/fetch": "*"
         better-call: "*"
         jose: "*"
         kysely: "*"
         nanostores: "*"
     "@better-auth/drizzle-adapter@*":
       dependencies:
         "@better-auth/core": "*"
         "@better-auth/utils": "*"
     ```
  3. After `yarn install`, `@better-auth/core` and its peers now nest under `node_modules/@better-auth/drizzle-adapter/node_modules/`, satisfying the wrangler/esbuild bundle from the source location in `src/edge-api/auth/`.
- **Verified**: `cd packages/mcp-auth && npm run deploy` ships a 4398.70 KiB bundle (729.82 KiB gzip), 219 ms startup time, all 5 bindings (D1×3, R2, SPIKE_CHAT worker) wired, deployed at `https://mcp-auth.spikeland.workers.dev` and `auth-mcp.spike.land`.
- **Follow-up**: Remove `continue-on-error: true` at `.github/workflows/ci.yml:253` once the NPM_TOKEN/CF API token rotation (BUG-S6-13/14) is complete, so any future regression surfaces immediately.
