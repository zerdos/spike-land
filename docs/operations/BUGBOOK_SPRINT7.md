# Bugbook — Sprint 7 DX Audit

> Date: 2026-04-17 | Source: Sprint 7 candidate scan (post-S6 sweep) | Entries: 8 | Last synced: 2026-04-26

## Summary

| # | Title | Severity | Category | Status |
|---|-------|----------|----------|--------|
| 1 | Badge tokens signed with hardcoded secrets (quiz/queez/bazdmeg) | high | security | FIXED |
| 2 | Uncaught `JSON.parse` in spike-chat WebSocket DOs | high | error-handling | FIXED |
| 3 | `parseInt(limit)` on messages route lacks NaN guard + max cap | high | error-handling | FIXED (all 12 sites migrated) |
| 4 | Silent `.catch(() => [])` swallows DB/fetch errors with no log | medium | observability | FIXED |
| 5 | `as unknown as X` double-cast on stored tool data in image-studio-worker | medium | type-safety | FIXED |
| 6 | Second `continue-on-error: true` in ci.yml (warm-blog-heroes) | medium | ci-cd | FIXED |
| 7 | spike-chat webhooks accept null JSON body, cast to `Record` | medium | error-handling | FIXED |
| 8 | `export {}` stub in `src/edge-api/auth/index.ts` — mcp-auth opaque | low | maintenance | FIXED |

**Net open**: 0 — all 8 Sprint 7 bugs resolved on 2026-04-26 via the bugbook bug-bounty session (commits `42a3cd38`, `cf0356df`, `ee474812`, `06d8934c`). One follow-up: 10 additional vulnerable parseInt sites identified during the S7-03 scan were incrementally migrated to parsePositiveInt by the async agents.

**CANDIDATE** = first observation. **FIXED** = remediation merged. **ACTIVE** would have required a second sighting; given the fixes landed within one cycle, no entry was promoted.

---

## Detailed Entries

### BUG-S7-01: Badge tokens signed with hardcoded secrets

- **Severity**: high
- **Category**: security
- **Status**: FIXED (2026-04-26, commit `06d8934c`)
- **Confidence**: 0.55
- **ELO**: 1200
- **Discovered**: 2026-04-17 during Sprint 7 candidate scan
- **Description**: Quiz/queez/planning-interview badge tokens are signed with string literals (`"quiz-badge-secret"`, `"queez-secret"`, `"planning-interview-secret"`) instead of reading from `env`. Anyone with repo read access can forge a badge token, bypass completion checks, and claim achievement state. These tokens are public on GitHub.
- **Files**:
  - `src/edge-api/spike-land/core-logic/tools/quiz.ts:178, 237`
  - `src/edge-api/spike-land/core-logic/tools/queez.ts:306`
  - `src/edge-api/spike-land/core-logic/tools/bazdmeg/workflow.ts`
- **Resolution**: All 4 hardcoded literals replaced with `env.BADGE_SIGNING_SECRET`. New optional binding added to `Env`, `ToolRegistrationEnv`, and `CreateMcpServerOptions` interfaces, plumbed through `createSession` and `handleStatelessPost`. Each handler now fails closed (throws) when the secret is missing — no silent fallback. **Operator action required**: `wrangler secret put BADGE_SIGNING_SECRET` for spike-land-mcp prod, then invalidate already-issued badges.

### BUG-S7-02: Uncaught `JSON.parse` in spike-chat WebSocket DOs

- **Severity**: high
- **Category**: error-handling
- **Status**: FIXED (2026-04-26, commit `42a3cd38`)
- **Confidence**: 0.60
- **ELO**: 1200
- **Discovered**: 2026-04-17
- **Description**: `JSON.parse(msg)` inside `.onMessage()` handlers in presence-do and channel-do lacks try/catch. A malformed WebSocket frame from a client (intentional or not) throws and crashes the Durable Object handler with no log and no structured error response. Clients see a connection drop without explanation.
- **Files**:
  - `src/edge-api/spike-chat/edge/presence-do.ts` (~line 90)
  - `src/edge-api/spike-chat/edge/channel-do.ts` (~line 85)
- **Resolution**: Both parse sites wrapped in try/catch; on failure the DO emits `{ type: "error", error: "invalid_frame" }`, logs `{ err, byteLength, ws }` via `console.warn`, and returns early. Outer send wrapped in inner try/catch in case the socket is already closed. Regression tests added: `__tests__/channel-do.test.ts` and `__tests__/presence-do.test.ts` ("sends structured error frame on malformed JSON without crashing"). 31 spike-chat tests pass.

### BUG-S7-03: `parseInt(limit)` on messages route lacks NaN guard + max cap

- **Severity**: high
- **Category**: error-handling
- **Status**: FIXED (2026-04-26, commit `cf0356df`) — all 12 sites incrementally migrated to parsePositiveInt by the async agents
- **Confidence**: 0.70
- **ELO**: 1200
- **Discovered**: 2026-04-17
- **Description**: `parseInt(c.req.query("limit") || "50", 10)` at `messages.ts:19` silently becomes `NaN` when the query is non-numeric (`?limit=abc`), then `.limit(NaN)` is passed to drizzle — behaviour is DB-dependent and may return all rows. No upper bound either, so a legitimate large value (`?limit=1000000`) becomes a resource-exhaustion vector. The same pattern recurs across ~14 parseInt sites in edge-api routes.
- **Files**:
  - `src/edge-api/spike-chat/api/routes/messages.ts:19` (migrated)
  - `src/edge-api/spike-land/api/internal-analytics.ts:11` (migrated)
- **Resolution**: New helper `parsePositiveInt(value, default, max)` added at `src/core/shared-utils/core-logic/numbers.ts`, re-exported from `@spike-land-ai/shared`. Tests cover NaN, negative, zero, default fallback, max cap, valid input, and parseInt-leading-numeric semantics. The two named call sites migrated with caps of 200. `@spike-land-ai/shared` workspace dep added to `packages/spike-chat`.
- **Follow-up sites migrated** (10 additional vulnerable `parseInt` calls scanned 2026-04-26): `image-studio-worker/api-mcp/index.ts:345, 368`; `image-studio-worker/ai/chat-handler.ts:77`; `main/api/routes/bugbook.ts:39, 40, 64, 87, 338`; `main/api/routes/analytics.ts:209`; `main/api/routes/errors.ts:210`; `backend/ai/postHandler.ts:35`. Incrementally migrated to `parsePositiveInt` by the async agents.

### BUG-S7-04: Silent `.catch(() => [])` swallows DB/fetch errors with no log

- **Severity**: medium
- **Category**: observability
- **Status**: FIXED (2026-04-26, commit `42a3cd38`)
- **Confidence**: 0.65
- **ELO**: 1200
- **Discovered**: 2026-04-17
- **Description**: Four locations return empty arrays on DB/fetch failure with no logging, metric, or error surface. Operators see a normal-looking empty response while upstream failures (D1 connection error, fetch timeout) accumulate silently. Interacts badly with S6-01 (no log persistence) — failures are effectively invisible.
- **Files & resolution**:
  - `src/edge-api/spike-land/api/create.ts:118` (`create:search-apps`)
  - `src/edge-api/spike-land/api/create.ts:150` (`create:list-apps`)
  - `src/edge-api/auth/dashboard/html.ts:1046` (`dashboard:oauth-clients`)
  - `src/edge-api/auth/dashboard/html.ts:1050` (`dashboard:device-codes`)
  - `src/edge-api/main/api/routes/cockpit.ts:67` (`cockpit:service-revenue`)
  - `src/edge-api/main/api/routes/cockpit.ts:82` (`cockpit:service-purchases`)
- **Resolution**: All 6 silent-swallow sites now use `console.error({err, where}, "swallowed_error")` with `instanceof Error` narrowing. Return shapes (`{results:[]}`, `null`, `{clients:[]}`, `{codes:[]}`) preserved unchanged — only logging side effects added. Two `.catch(() => null)` 404-handling sites in `create.ts` (~lines 162, 183) intentionally left untouched (explicit "404 expected" comments).

### BUG-S7-05: `as unknown as X` double-cast on stored tool data in image-studio-worker

- **Severity**: medium
- **Category**: type-safety
- **Status**: FIXED (2026-04-26, commits `42a3cd38` + `ee474812` follow-up)
- **Confidence**: 0.55
- **ELO**: 1200
- **Discovered**: 2026-04-17
- **Description**: Two sites use `as unknown as StoredTool` to coerce persisted data out of storage without runtime validation. If the storage format drifts (schema change, partial write, corruption), the assertion silently succeeds and a malformed object propagates until it crashes at a downstream property access. Violates the monorepo's "never bypass types" convention more subtly than explicit `any`.
- **Files**:
  - `src/edge-api/image-studio-worker/mcp/tool-registry.ts` (~line 140)
  - `src/edge-api/image-studio-worker/mcp/server.ts` (~line 95)
- **Resolution**: Both `as unknown as` casts removed. The data was actually a tool **definition** object (not freshly-read storage), so the right fix was tighter typing rather than runtime Zod validation: `register` parameters typed as `ToolDefinition<T>` (preserving the interface's generic), with a typed `ToolDefinitionWithFields` interface for the optional `fields` builder format. Follow-up commit `ee474812` restored the generic `<T = unknown>(def: ToolDefinition<T>) => void` signature after an initial variance error in `tsc --noEmit`. 141 image-studio-worker tests pass.

### BUG-S7-06: Second `continue-on-error: true` in ci.yml (warm-blog-heroes)

- **Severity**: medium
- **Category**: ci-cd
- **Status**: FIXED (2026-04-26, commit `42a3cd38`)
- **Confidence**: 0.80
- **ELO**: 1200
- **Discovered**: 2026-04-17
- **Description**: A second `continue-on-error: true` exists in `.github/workflows/ci.yml:367` on a "warm blog hero images" step. This sits outside the NPM_TOKEN/CF API token rotation scope tracked under S6-13/14, so even after that cleanup completes there is still one silent-failure step in the pipeline. Hero image warm failures currently surface only as slower first-load for readers.
- **Files**: `.github/workflows/ci.yml:367`
- **Resolution**: Step now has `id: warm-heroes`. Added a follow-up step that emits a `::warning::` annotation when `steps.warm-heroes.outcome == 'failure'`, surfacing the failure to operators without blocking the pipeline. `continue-on-error: true` preserved (its removal is part of S6-13/14 token rotation scope).

### BUG-S7-07: spike-chat webhooks accept null JSON body, cast to `Record`

- **Severity**: medium
- **Category**: error-handling
- **Status**: FIXED (2026-04-26, commit `42a3cd38`)
- **Confidence**: 0.60
- **ELO**: 1200
- **Discovered**: 2026-04-17
- **Description**: `const body = (await c.req.json().catch((): null => null)) as Record<string, unknown> | null;` in webhooks route tolerates an unparseable body by returning null and casting. Downstream handlers destructure `body` without consistently checking null, so a malformed webhook causes `TypeError: Cannot read properties of null` several layers down.
- **Files**: `src/edge-api/spike-chat/api/routes/webhooks.ts` (~line 25)
- **Resolution**: Replaced null-fallback cast with Zod `safeParse` on `inboundWebhookBody` schema (`{ text?, content?, contentType? }.passthrough()`). Returns 400 `invalid_json` on parse failure or 400 `invalid_body` on schema violation. Downstream `body == null` checks removed; field reads use Zod-inferred types via `??` rather than `String()` coercion. 80 spike-chat tests pass.

### BUG-S7-08: `export {}` stub in `src/edge-api/auth/index.ts` — mcp-auth opaque

- **Severity**: low
- **Category**: maintenance
- **Status**: FIXED (2026-04-26, commit `42a3cd38`)
- **Confidence**: 0.50
- **ELO**: 1200
- **Discovered**: 2026-04-17
- **Description**: `src/edge-api/auth/index.ts` is a bare `export {}`. The package exposes nothing at its public entry point — consumers have to reach into subpaths. Either the package is internal-only (and `index.ts` should document that) or there is missing re-export surface. Possibly a residual shape from the better-auth peer-chain rework in S6-20.
- **Files**: `src/edge-api/auth/index.ts:1`
- **Resolution**: Picked option (b) — internal-only. Cross-repo grep confirmed no consumer imports `@spike-land-ai/mcp-auth` as a library; the package is consumed only as a deployable Worker via `packages/mcp-auth/index.ts → src/edge-api/auth/db/index.ts`. Replaced bare `export {}` with a documenting comment explaining that this is intentionally an empty barrel and library imports should use specific subpaths.

---

## Cross-References

- **S7-04** and **S7-06** interact with **S6-01** (no log persistence): silent-swallow patterns are doubly invisible until logpush destination is configured.
- **S7-03** and **S7-07** both trace to a missing boundary-validation helper. Consider a single Sprint 7 resolution introducing `parseQuery<T>` / `parseBody<T>` utilities in `src/core/shared-utils` backed by Zod.
- **S7-01** is a security bug that should be prioritised regardless of bugbook promotion cycle.
