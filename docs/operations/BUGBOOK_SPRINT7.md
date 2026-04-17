# Bugbook — Sprint 7 DX Audit

> Date: 2026-04-17 | Source: Sprint 7 candidate scan (post-S6 sweep) | Entries: 8

## Summary

| # | Title | Severity | Category | Status |
|---|-------|----------|----------|--------|
| 1 | Badge tokens signed with hardcoded secrets (quiz/queez/bazdmeg) | high | security | CANDIDATE |
| 2 | Uncaught `JSON.parse` in spike-chat WebSocket DOs | high | error-handling | CANDIDATE |
| 3 | `parseInt(limit)` on messages route lacks NaN guard + max cap | high | error-handling | CANDIDATE |
| 4 | Silent `.catch(() => [])` swallows DB/fetch errors with no log | medium | observability | CANDIDATE |
| 5 | `as unknown as X` double-cast on stored tool data in image-studio-worker | medium | type-safety | CANDIDATE |
| 6 | Second `continue-on-error: true` in ci.yml (warm-blog-heroes) | medium | ci-cd | CANDIDATE |
| 7 | spike-chat webhooks accept null JSON body, cast to `Record` | medium | error-handling | CANDIDATE |
| 8 | `export {}` stub in `src/edge-api/auth/index.ts` — mcp-auth opaque | low | maintenance | CANDIDATE |

**CANDIDATE** = first observation. Each entry needs a second independent sighting before promotion to ACTIVE (per BAZDMEG Bayesian Bugbook rules). ACTIVE requires a matched regression test.

---

## Detailed Entries

### BUG-S7-01: Badge tokens signed with hardcoded secrets

- **Severity**: high
- **Category**: security
- **Status**: CANDIDATE
- **Confidence**: 0.55
- **ELO**: 1200
- **Discovered**: 2026-04-17 during Sprint 7 candidate scan
- **Description**: Quiz/queez/planning-interview badge tokens are signed with string literals (`"quiz-badge-secret"`, `"queez-secret"`, `"planning-interview-secret"`) instead of reading from `env`. Anyone with repo read access can forge a badge token, bypass completion checks, and claim achievement state. These tokens are public on GitHub.
- **Files**:
  - `src/edge-api/spike-land/core-logic/tools/quiz.ts:178, 237`
  - `src/edge-api/spike-land/core-logic/tools/queez.ts:306`
  - `src/edge-api/spike-land/core-logic/tools/bazdmeg/workflow.ts`
- **Next step**: confirm in second observation pass, then rotate to `env.BADGE_SIGNING_SECRET` via wrangler secret and invalidate all issued badges.

### BUG-S7-02: Uncaught `JSON.parse` in spike-chat WebSocket DOs

- **Severity**: high
- **Category**: error-handling
- **Status**: CANDIDATE
- **Confidence**: 0.60
- **ELO**: 1200
- **Discovered**: 2026-04-17
- **Description**: `JSON.parse(msg)` inside `.onMessage()` handlers in presence-do and channel-do lacks try/catch. A malformed WebSocket frame from a client (intentional or not) throws and crashes the Durable Object handler with no log and no structured error response. Clients see a connection drop without explanation.
- **Files**:
  - `src/edge-api/spike-chat/edge/presence-do.ts` (~line 90)
  - `src/edge-api/spike-chat/edge/channel-do.ts` (~line 85)
- **Next step**: wrap parse in try/catch, emit `{ error: "invalid_frame" }`, log the offending byte length.

### BUG-S7-03: `parseInt(limit)` on messages route lacks NaN guard + max cap

- **Severity**: high
- **Category**: error-handling
- **Status**: CANDIDATE
- **Confidence**: 0.70
- **ELO**: 1200
- **Discovered**: 2026-04-17
- **Description**: `parseInt(c.req.query("limit") || "50", 10)` at `messages.ts:19` silently becomes `NaN` when the query is non-numeric (`?limit=abc`), then `.limit(NaN)` is passed to drizzle — behaviour is DB-dependent and may return all rows. No upper bound either, so a legitimate large value (`?limit=1000000`) becomes a resource-exhaustion vector. The same pattern recurs across ~14 parseInt sites in edge-api routes.
- **Files**:
  - `src/edge-api/spike-chat/api/routes/messages.ts:19`
  - `src/edge-api/spike-land/api/internal-analytics.ts:11`
  - 12+ additional parseInt sites (see candidate notes)
- **Next step**: introduce `parsePositiveInt(value, default, max)` helper in `src/core/shared-utils` and migrate call sites.

### BUG-S7-04: Silent `.catch(() => [])` swallows DB/fetch errors with no log

- **Severity**: medium
- **Category**: observability
- **Status**: CANDIDATE
- **Confidence**: 0.65
- **ELO**: 1200
- **Discovered**: 2026-04-17
- **Description**: Four locations return empty arrays on DB/fetch failure with no logging, metric, or error surface. Operators see a normal-looking empty response while upstream failures (D1 connection error, fetch timeout) accumulate silently. Interacts badly with S6-01 (no log persistence) — failures are effectively invisible.
- **Files**:
  - `src/edge-api/spike-land/api/create.ts` (2 locations)
  - `src/edge-api/auth/dashboard/html.ts`
  - `src/edge-api/main/api/routes/cockpit.ts`
- **Next step**: replace with `.catch((err) => { log.error({ err }); return []; })` or promote to explicit error response.

### BUG-S7-05: `as unknown as X` double-cast on stored tool data in image-studio-worker

- **Severity**: medium
- **Category**: type-safety
- **Status**: CANDIDATE
- **Confidence**: 0.55
- **ELO**: 1200
- **Discovered**: 2026-04-17
- **Description**: Two sites use `as unknown as StoredTool` to coerce persisted data out of storage without runtime validation. If the storage format drifts (schema change, partial write, corruption), the assertion silently succeeds and a malformed object propagates until it crashes at a downstream property access. Violates the monorepo's "never bypass types" convention more subtly than explicit `any`.
- **Files**:
  - `src/edge-api/image-studio-worker/mcp/tool-registry.ts` (~line 140)
  - `src/edge-api/image-studio-worker/mcp/server.ts` (~line 95)
- **Next step**: replace with Zod parse at the boundary; reject and log invalid rows.

### BUG-S7-06: Second `continue-on-error: true` in ci.yml (warm-blog-heroes)

- **Severity**: medium
- **Category**: ci-cd
- **Status**: CANDIDATE
- **Confidence**: 0.80
- **ELO**: 1200
- **Discovered**: 2026-04-17
- **Description**: A second `continue-on-error: true` exists in `.github/workflows/ci.yml:367` on a "warm blog hero images" step. This sits outside the NPM_TOKEN/CF API token rotation scope tracked under S6-13/14, so even after that cleanup completes there is still one silent-failure step in the pipeline. Hero image warm failures currently surface only as slower first-load for readers.
- **Files**: `.github/workflows/ci.yml:367`
- **Next step**: decide whether hero-warm failure should fail the job (strict) or emit a warning annotation (current behaviour, but logged); at minimum add `::warning::` output on failure.

### BUG-S7-07: spike-chat webhooks accept null JSON body, cast to `Record`

- **Severity**: medium
- **Category**: error-handling
- **Status**: CANDIDATE
- **Confidence**: 0.60
- **ELO**: 1200
- **Discovered**: 2026-04-17
- **Description**: `const body = (await c.req.json().catch((): null => null)) as Record<string, unknown> | null;` in webhooks route tolerates an unparseable body by returning null and casting. Downstream handlers destructure `body` without consistently checking null, so a malformed webhook causes `TypeError: Cannot read properties of null` several layers down.
- **Files**: `src/edge-api/spike-chat/api/routes/webhooks.ts` (~line 25)
- **Next step**: add Zod parse on body, reject with 400 on invalid JSON; remove the null fallback.

### BUG-S7-08: `export {}` stub in `src/edge-api/auth/index.ts` — mcp-auth opaque

- **Severity**: low
- **Category**: maintenance
- **Status**: CANDIDATE
- **Confidence**: 0.50
- **ELO**: 1200
- **Discovered**: 2026-04-17
- **Description**: `src/edge-api/auth/index.ts` is a bare `export {}`. The package exposes nothing at its public entry point — consumers have to reach into subpaths. Either the package is internal-only (and `index.ts` should document that) or there is missing re-export surface. Possibly a residual shape from the better-auth peer-chain rework in S6-20.
- **Files**: `src/edge-api/auth/index.ts:1`
- **Next step**: confirm intent with mcp-auth owner; either add re-exports of the public surface (`auth`, handlers, types) or mark private in `package.json`.

---

## Cross-References

- **S7-04** and **S7-06** interact with **S6-01** (no log persistence): silent-swallow patterns are doubly invisible until logpush destination is configured.
- **S7-03** and **S7-07** both trace to a missing boundary-validation helper. Consider a single Sprint 7 resolution introducing `parseQuery<T>` / `parseBody<T>` utilities in `src/core/shared-utils` backed by Zod.
- **S7-01** is a security bug that should be prioritised regardless of bugbook promotion cycle.
