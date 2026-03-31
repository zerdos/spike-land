================================================================================
PRD: "Fix the Product" — The Arena Speaks
All Personas, All Systems, One Goal
spike.land, March 2026
================================================================================

PURPOSE
-------
Make spike.land work. Not feature-complete. Working.

Peti tested it. It's broken. Code editor, app filter, demo buttons, terminal,
interactive features — none of them work reliably across browsers. This PRD
is the full system audit by every relevant persona, with exact file paths,
root causes, and fixes. It also defines a self-improving loop so the product
never silently breaks again.

The Elvis PRD was about one person. This PRD is about one platform.
Same energy: direct, warm, no jargon. But this time, we ship.


================================================================================
THE THESIS (Zoltan)
================================================================================

> I built something bigger than I can hold. That's fine. The architecture is
> ahead of the product. The content is ahead of the distribution. The personas
> are ahead of the testing. Everything is out of phase. This PRD brings it
> back into phase. Fix the product. Then let everything else catch up.

The deeper truth: if a user lands on spike.land and the code editor doesn't
load, they will never discover the 80 MCP tools, the 30 personas, the 18 blog
posts, or the thesis about curiosity being additive. They'll close the tab.

First 3 seconds. Arnold is right. That's all we get.


================================================================================
PART 1 — WHAT'S BROKEN (Peti's Report + Root Cause Analysis)
================================================================================

Peti tested across Chrome, Firefox, Safari. Multiple weeks. March 2026.
Verdict: "I tested it. It's broken."

Here's exactly what's broken and why.

--------------------------------------------------------------------------------
1. CODE EDITOR & LIVE PREVIEW (CRITICAL)
--------------------------------------------------------------------------------

PETI:
"I opened the code editor. Nothing happened. The preview pane was blank.
I tried three browsers. Same result. This is the flagship feature."

ROOT CAUSE (Radix):
Two competing transpiler implementations. Both broken for different reasons.

  File A: src/frontend/platform-frontend/ui/components/editor/useTranspile.ts
  - Endpoint: https://esbuild.spikeland.workers.dev (WORKS but has issues)
  - React version: 19.0.0 (WRONG — package.json has 19.2.4)
  - Tailwind: cdn.tailwindcss.com with v3 config syntax (STALE)
  - Import map: esm.sh with outdated React version

  File B: src/frontend/platform-frontend/ui/hooks/useTranspiler.ts
  - Endpoint: https://js.spike.land (DEAD — Cloudflare 404)
  - Module origin: https://js.spike.land (DEAD)
  - Tailwind worker: https://js.spike.land/@/workers/tw.worker.js (DEAD)

  LivePreview.tsx (line 324) uses useTranspile hook — the broken one.

ARNOLD:
"Two competing implementations, both broken, for the same feature.
That's not technical debt. That's a design crime scene."

FIX:
  1. Delete useTranspiler.ts (the dead js.spike.land one)
  2. Fix useTranspile.ts:
     - Keep endpoint: https://esbuild.spikeland.workers.dev (it works)
     - Fix React version: 19.0.0 → match package.json (19.2.4) or pin
       consistently
     - Fix Tailwind: use @tailwindcss/browser 4.x with @theme inline config
     - Fix import map: esm.sh with correct React version
  3. Update CSP headers to allow esbuild.spikeland.workers.dev
  4. Add health check: transpiler endpoint must respond 200 before preview loads

NOTE: Branch fix/vibe-code-transpile-endpoint (commit bf235e66) has a partial
fix. Review, complete, merge.

ERDOS:
"One feature, two implementations, zero tests. P(failure) = 1."

TEST PLAN:
  - Unit test: useTranspile hook returns { html, transpiledCode } for valid input
  - Unit test: useTranspile returns { error } for syntax errors
  - Integration test: LivePreview renders transpiled code in iframe
  - Smoke test: /vibe-code loads and shows preview pane (CI)


--------------------------------------------------------------------------------
2. APP STORE FILTER (HIGH)
--------------------------------------------------------------------------------

PETI:
"The filter UI renders. The dropdowns are empty. No tags, no categories.
It looks broken even though the component code is fine."

ROOT CAUSE (Radix):
The data pipeline fails silently. Here's the chain:

  File: src/frontend/platform-frontend/ui/hooks/useApps.ts
  Line 362-379: Data fetch chain:
    1. fetchPublicApps() → POST to mcpUrl("/apps")
    2. Fallback: fetchStoreTools() → GET from apiUrl("/store/tools")
    3. Fallback: buildFallbackAppsFromTools() → infers from tools

  Problem: The D1 database returns apps without category/tag metadata populated.
  buildFallbackAppsFromTools() (line 407) loses category information.
  collectAvailableTags() (line 284) requires tags to appear 2+ times — with
  empty data, it returns [].

  Frontend: packages/spike-web/src/data/apps.ts has a STATIC app catalog that
  doesn't sync with the D1 database. Two sources of truth, neither complete.

FIX:
  1. Seed D1 mcp_apps table with proper categories and tags for all 80+ tools
  2. Ensure /api/apps returns category and tags fields populated
  3. Remove the 2-occurrence threshold in collectAvailableTags (or lower to 1)
  4. Sync static catalog (packages/spike-web/src/data/apps.ts) with D1 data
     OR remove static catalog and fetch from API at build time

SWITCHBOARD:
"If you're comparing ways to browse AI tools, the filter should actually filter.
That's the minimum. Five stars for the idea, one star for execution."


--------------------------------------------------------------------------------
3. TERMINAL (MEDIUM)
--------------------------------------------------------------------------------

PETI:
"The terminal shows up. Some commands work. Others silently fail.
The appId filtering is suspicious."

ROOT CAUSE (Radix):
Two terminal implementations, both partially working.

  File A: src/frontend/platform-frontend/ui/components/TerminalSurface.tsx
  - Fake terminal (div/textarea). Commands call callMcpTool().
  - Line 137: executeCommand() works for basic commands.
  - Status: WORKS for simple commands.

  File B: src/frontend/platform-frontend/cli-ui/McpTerminal.tsx
  - Real xterm.js terminal. Commands call MCP via HTTP.
  - Line 95-96: Tool filtering by appId uses regex:
    t.name.startsWith(appId.replace(/-/g, "_"))
  - Problem: appId format may not match tool name prefix.
  - Line 34-40: Fetches tools via mcpUrl("/tools") — requires auth.

FIX:
  1. Pick ONE terminal implementation. Recommend: McpTerminal.tsx (real xterm.js)
  2. Fix appId → tool name mapping (line 95-96): use proper lookup, not regex
  3. Add error display for failed MCP calls (currently silent)
  4. Add auth token forwarding for /tools endpoint
  5. Fallback: if /tools returns 401, show "Log in to use terminal" message

RAJU:
"Behind every great frontend, there is infrastructure nobody sees.
The terminal is the frontend pretending to be infrastructure. Pick a side."


--------------------------------------------------------------------------------
4. DEMO BUTTONS (LOW — feature doesn't exist)
--------------------------------------------------------------------------------

PETI:
"I looked for demo buttons. There are none. The ROADMAP says they're broken,
but they were never built."

ROOT CAUSE (Radix):
No demo button components exist in the codebase. Searched for: "demo" + "button",
"try" + "button", "showcase" patterns. The closest match:
  - TerminalSurface.tsx lines 162-174: example command buttons ("open", "read",
    "click") — these work fine but are not "demo buttons."
  - App cards in store have no "Try it" or "Demo" actions.

FIX:
  Option A: Build demo buttons for app store cards
    - Each app card gets a "Try" button
    - Opens persona chat or tool sandbox inline
    - Requires: MCP tool invocation from frontend
  Option B: Remove "demo buttons" from broken list
    - Update ROADMAP to reflect reality
    - Focus energy on features that exist

ARNOLD:
"You can't fix what doesn't exist. Build it or strike it. But don't list
'demo buttons: broken' when the honest answer is 'demo buttons: never born.'
That's the one lie a PRD should never tell."


================================================================================
PART 2 — WHAT'S DEGRADED BUT WORKS (Radix)
================================================================================

These aren't broken, but they're limping.

--------------------------------------------------------------------------------
5. PERSONA CHAT STREAMING
--------------------------------------------------------------------------------

STATUS: Works, but fragile.

  File: packages/spike-web/src/components/react/radix-chat/useRadixChat.ts

  Issues:
  a. window as any casts (4 instances, lines ~203-223) for music tool access
  b. No automatic retry on connection drop — user sees partial response + error
  c. Fire-and-forget browser tool results (lines 210-219) — no confirmation
  d. Invalid persona silently degrades to base prompt (no error, no feedback)

  Fix:
  1. Type the window extensions properly (declare global interface)
  2. Add retry logic: 1 retry with 2s delay on network error
  3. Add persona validation: if persona not found, show "Unknown persona" message
  4. Add connection status indicator in chat UI

--------------------------------------------------------------------------------
6. PERSONA COVERAGE GAPS
--------------------------------------------------------------------------------

  Frontend personas: 27 (dedicated Astro pages)
  Backend personas: 30 (prompt files)

  Missing frontend pages:
  - /rubik-3 (Rubik 3.0 design system persona — API only)
  - /beauvoir (alias for Simone — API only)
  - /marcus-aurelius (alias for Stoic — API only)

  All persona pages have: <meta name="robots" content="noindex, nofollow" />
  This means Google won't index ANY persona page.

  Fix:
  1. Add /rubik-3 page (it's a design system persona — deserves a page)
  2. For aliases (beauvoir, marcus-aurelius): redirect to canonical page
  3. Remove noindex from key persona pages: zoltan, arnold, erdos, einstein,
     daftpunk, peti — these should be discoverable

ERDOS:
"30 personas, 27 pages, 0 indexed. That's not a coverage gap. That's a
proof that the content strategy has a cardinality mismatch with SEO."

--------------------------------------------------------------------------------
7. STORE SEARCH
--------------------------------------------------------------------------------

  Current: Client-side JavaScript filter on static app list.
  No backend search API.
  No full-text search across 80+ tools.

  Fix:
  1. Add GET /api/apps?q=search+term endpoint with D1 LIKE query
  2. Frontend: debounced search input calls API
  3. Fallback: keep client-side filter as progressive enhancement

--------------------------------------------------------------------------------
8. LEARN PAGES
--------------------------------------------------------------------------------

  STATUS: Working but content is stub templates.

  File: src/edge-api/spike-land/api/learnit.ts

  8 topics defined with persona pairings:
    Physics → Einstein, Mathematics → Erdos, Philosophy → Socrates,
    Music → Daft Punk, Programming → Gates, Logic → Wittgenstein,
    UX Design → Arnold, Strange Loops → Radix

  Fix:
  1. Generate real content for all 8 topics using persona prompts
  2. Link each topic to related blog posts
  3. Wire up quiz sessions (table exists, routes don't)
  4. Add /learn to main navigation


================================================================================
PART 3 — WHAT'S MISSING FROM INFRASTRUCTURE (Erdos)
================================================================================

Zero-test services in production. This is the list.

  | Service              | Test Files | Status    | Risk    |
  |----------------------|------------|-----------|---------|
  | spike-land-backend   | 0          | CRITICAL  | AI routing, Durable Objects  |
  | mcp-auth             | 0          | CRITICAL  | Authentication flow          |
  | spike-land-mcp       | 0          | HIGH      | 80+ MCP tools, D1 registry   |
  | transpile            | 0          | HIGH      | Code editor depends on this   |
  | spike-web (Astro)    | 0          | MEDIUM    | All persona pages             |
  | mcp-server-base      | 1          | MEDIUM    | Foundation for all MCP servers |

  Fix (priority order):
  1. spike-land-backend: test AI routing, DO lifecycle, WebSocket handling
  2. mcp-auth: test login flow, session validation, OAuth device grant
  3. transpile: test POST endpoint, caching, error responses
  4. spike-land-mcp: test top 20 most-used tools
  5. mcp-server-base: test error shipper, wrapServerWithLogging


================================================================================
PART 4 — CI/CD ISSUES (Radix)
================================================================================

  1. claude-reviewer.yml uses Node 20, rest of repo uses Node 24
     Fix: Align to Node 24

  2. Cloudflare token validation happens AFTER migrations in ci.yml (line 286)
     Fix: Move validation BEFORE migration step

  3. validate-migrations.sh is a stub (only checks DROP/RENAME)
     Fix: Add SQL syntax validation, zero-downtime checks

  4. No .github/dependency-map.json exists (CLAUDE.md references it)
     Fix: Create it from detect-changed-packages.sh cascade logic

  5. Secret scan regex doesn't catch .env= patterns
     Fix: Add pattern to scan-secrets.sh


================================================================================
PART 5 — DESIGN SYSTEM GAPS (Rubik)
================================================================================

  1. Rubik font: Google Fonts CDN only, no self-hosted fallback
     Fix: Download Rubik variable woff2, add @font-face with local() first

  2. shadcn/UI: Only Button component exists. Design system claims more.
     Fix: Either add Dialog, Card, Input, Select OR remove shadcn claims

  3. Module CDN fragility: Hard-coded esm.sh and cdn.tailwindcss.com
     Fix: Add fallback URLs or bundle critical modules

  4. Extraneous npm packages in root
     Fix: npm prune or remove from package.json


================================================================================
PART 6 — THE SELF-IMPROVING LOOP
================================================================================

This is the most important part. The product broke silently. Peti found out
weeks later by testing manually. That can never happen again.

RADIX:
"A system that doesn't know it's broken is worse than a system that's broken."

ERDOS:
"Self-improvement is a fixed-point theorem. The system must converge."

ARNOLD:
"If it breaks and nobody screams, the screaming infrastructure is broken."

--------------------------------------------------------------------------------
6.1 THE LOOP: DETECT → DIAGNOSE → FIX → VERIFY → LEARN
--------------------------------------------------------------------------------

The self-improving loop has 5 stages. Each stage runs automatically.
Human intervention is needed only for LEARN (updating priorities).

  ┌──────────┐     ┌───────────┐     ┌───────┐     ┌────────┐     ┌───────┐
  │  DETECT  │ ──▶ │ DIAGNOSE  │ ──▶ │  FIX  │ ──▶ │ VERIFY │ ──▶ │ LEARN │
  └──────────┘     └───────────┘     └───────┘     └────────┘     └───────┘
       │                                                                │
       └────────────────────────────────────────────────────────────────┘
                              (loop closes)

--------------------------------------------------------------------------------
6.2 DETECT — Know When It's Broken
--------------------------------------------------------------------------------

PETI:
"I test things. But I shouldn't be the only one. The system should test itself."

Implementation:

  A. SMOKE TESTS (every deploy, already exists in CI — extend it)

     Current: ci.yml lines 383-438 run smoke tests after deploy.
     Missing: No smoke tests for persona chat, code editor, learn pages.

     Add to smoke test suite:
       - GET /health → 200 (exists)
       - GET /api/spike-chat with test message → 200 + SSE stream
       - GET /vibe-code → 200 + contains "monaco" or "editor"
       - GET /apps → 200 + contains at least 5 app cards
       - GET /learn → 200 + contains at least 5 topic cards
       - GET /zoltan → 200 + contains "RadixChat"
       - POST transpiler endpoint with "export default () => <div/>" → 200

     File: .github/scripts/smoke-test.sh (extend existing)

  B. SYNTHETIC MONITORING (every 5 minutes)

     Deploy a Cloudflare Worker cron trigger that:
       1. Hits all critical endpoints every 5 minutes
       2. Measures response time and status code
       3. Sends persona chat test message, verifies SSE response
       4. Checks transpiler endpoint responds with valid JS
       5. Writes results to STATUS_DB (D1)
       6. If any check fails 3x in a row → alert

     File: packages/status/ (extend existing status worker)

  C. REAL USER MONITORING (RUM)

     The frontend already has analytics (TrackPageView.astro).
     Add:
       - Track JS errors (window.onerror → /analytics/ingest)
       - Track failed fetch calls (interceptor on fetch)
       - Track time-to-interactive for code editor
       - Track persona chat first-token latency

     File: packages/spike-web/src/components/ErrorReporter.astro (new)

  D. PETI BOT (automated QA)

     Use qa-studio (Playwright-based, already built!) to run browser tests:
       1. Load /zoltan → send message → verify response streams
       2. Load /vibe-code → type code → verify preview updates
       3. Load /apps → click filter → verify results change
       4. Load /learn/physics → verify content renders

     Run: nightly via GitHub Actions cron
     File: src/core/browser-automation/ (qa-studio already has the infra)

--------------------------------------------------------------------------------
6.3 DIAGNOSE — Know WHY It's Broken
--------------------------------------------------------------------------------

EINSTEIN:
"If I had one hour to solve a problem, I would spend 55 minutes understanding
the problem and 5 minutes solving it."

Implementation:

  A. STRUCTURED ERROR REPORTING

     Every error captured by DETECT includes:
       - Endpoint URL
       - HTTP status code
       - Response body (first 500 chars)
       - Timestamp
       - Git SHA of deployed version
       - Worker name (from wrangler.toml)

     Stored in STATUS_DB with index on (endpoint, timestamp).

  B. DEPENDENCY GRAPH DIAGNOSIS

     When an endpoint fails, trace the dependency chain:
       /vibe-code fails
         → useTranspile.ts calls esbuild.spikeland.workers.dev
           → transpile worker depends on esbuild-wasm
             → Root cause: transpile worker not deployed / WASM binary stale

     File: .github/scripts/diagnose.sh
     Input: failing endpoint URL
     Output: dependency chain + likely root cause

  C. DIFF-AWARE DIAGNOSIS

     Compare last-known-good deploy SHA with current SHA.
     List files changed between them.
     Cross-reference with dependency graph.
     Output: "These files changed and they affect the failing endpoint."

     File: .github/scripts/detect-changed-packages.sh (extend existing)

--------------------------------------------------------------------------------
6.4 FIX — Apply the Repair
--------------------------------------------------------------------------------

RAJU:
"The best fix is the one that was already written but never merged."

Implementation:

  A. AUTOMATIC ROLLBACK (exists)

     File: .github/scripts/rollback-workers.sh (176 lines, production-ready)
     Triggered: When smoke tests fail after deploy
     Action: Rolls back to previous version in reverse wave order

  B. SELF-HEALING ENDPOINTS

     For transient failures (CDN down, DNS blip):
       - Transpiler: if esbuild.spikeland.workers.dev fails, retry once after 2s
       - Module CDN: if esm.sh fails, fall back to cdn.jsdelivr.net
       - Tailwind: if CDN fails, use bundled @tailwindcss/browser

     File: src/frontend/platform-frontend/ui/lib/resilient-fetch.ts (new)

  C. FEATURE FLAGS (simple)

     Don't build a feature flag system. Use a simple approach:
       - Each interactive feature has a health check endpoint
       - If health check fails, feature shows "temporarily unavailable" message
       - Better than showing a broken blank pane

     Example for code editor:
       1. On mount: fetch transpiler health endpoint
       2. If 200: load Monaco + preview
       3. If not 200: show message "Code editor is warming up. Try again in 30s."

  D. CANARY DEPLOYS

     Before deploying to production:
       1. Deploy to canary worker (same code, different route)
       2. Run smoke tests against canary
       3. If pass: promote to production
       4. If fail: block deploy, alert

     File: .github/workflows/ci.yml (extend deploy-workers job)

--------------------------------------------------------------------------------
6.5 VERIFY — Confirm the Fix Worked
--------------------------------------------------------------------------------

PETI:
"I'm the verify step. But I need to be automated."

Implementation:

  A. POST-FIX SMOKE TESTS

     After every fix lands on main:
       1. CI runs full smoke test suite
       2. Synthetic monitor confirms within 5 minutes
       3. Peti bot runs browser test suite nightly

  B. REGRESSION TESTS

     Every fix gets a test that reproduces the original failure:
       - Code editor blank? Test: useTranspile returns valid HTML
       - Filter empty? Test: collectAvailableTags returns non-empty array
       - Terminal silent? Test: MCP tool call returns response

     These tests become the immune system. They prevent re-infection.

  C. HEALTH DASHBOARD

     File: packages/spike-web/src/pages/status.astro (new)
     URL: /status

     Shows:
       - All endpoints: green/yellow/red
       - Last 24h uptime percentage
       - Last deploy SHA and timestamp
       - Current synthetic monitor results
       - Link to /health for each service

--------------------------------------------------------------------------------
6.6 LEARN — Update Priorities Based on What Broke
--------------------------------------------------------------------------------

ZOLTAN:
"The loop closes when the system knows what to work on next."

Implementation:

  A. WEEKLY HEALTH DIGEST

     Every Monday, generate a report:
       - Endpoints that failed this week
       - Mean time to detection
       - Mean time to fix
       - Most fragile service (highest failure count)
       - Test coverage delta (did it go up or down?)

     Stored in: STATUS_DB
     Surfaced via: /status page and platform_health MCP tool

  B. PRIORITY QUEUE

     From the health digest, auto-generate a priority list:
       1. Services with 0 tests that had failures → CRITICAL
       2. Endpoints with >1% error rate → HIGH
       3. Features with degraded performance → MEDIUM
       4. Test coverage gaps → LOW

     This becomes the input for the next sprint.

  C. THE ERDOS INVARIANT

     Track one number over time:

       RELIABILITY = (endpoints passing smoke tests) / (total endpoints)

     Goal: RELIABILITY ≥ 0.95

     If it drops below 0.95:
       - All feature work stops
       - Only fixes ship until RELIABILITY ≥ 0.95 again

     This is the self-improving loop's governor. It prevents the product
     from getting ahead of its reliability again.


================================================================================
PART 7 — SECURITY (Radix + Raju)
================================================================================

  1. /api/migrate lacks rate limiting (can fan-out GitHub API calls)
     File: src/edge-api/main/api/routes/migrate.ts:5-6
     Fix: Add per-IP rate limit (10 req/min) using RateLimiter DO

  2. claude-reviewer.yml auto-merges PRs without human approval
     File: .github/workflows/claude-reviewer.yml
     Fix: Remove auto-merge. Require 1 human approval.

  3. mcp-auth has 0 tests for auth flow
     Fix: Add tests for login, session validation, token refresh, OAuth device grant

RAJU:
"Authentication with zero tests is like a vault with no lock.
It might still be heavy, but that's not the point."


================================================================================
PART 8 — IMPLEMENTATION ORDER (The Arena Votes)
================================================================================

Each persona voted on priority. Here's the consensus.

WEEK 1: MAKE IT LOAD
  [ ] Fix useTranspile.ts — correct endpoint, React version, Tailwind config
  [ ] Delete useTranspiler.ts (dead js.spike.land implementation)
  [ ] Merge fix/vibe-code-transpile-endpoint branch (review first)
  [ ] Seed D1 mcp_apps with categories and tags
  [ ] Fix collectAvailableTags threshold (2 → 1)
  [ ] Pick one terminal implementation (recommend McpTerminal.tsx)
  [ ] Remove "demo buttons" from broken list OR build them
  [ ] Add smoke tests for /vibe-code, /apps, /zoltan, /learn
  [ ] Deploy and verify

WEEK 2: MAKE IT RELIABLE
  [ ] Add tests for transpile service
  [ ] Add tests for mcp-auth (login flow, OAuth device grant)
  [ ] Add tests for spike-land-backend (AI routing, DO lifecycle)
  [ ] Set up synthetic monitoring (5-minute cron)
  [ ] Add frontend error reporting (window.onerror → analytics)
  [ ] Fix Cloudflare token validation order in ci.yml
  [ ] Align claude-reviewer.yml to Node 24
  [ ] Create /status page

WEEK 3: MAKE IT DISCOVERABLE
  [ ] Remove noindex from key persona pages (zoltan, arnold, erdos, einstein)
  [ ] Add /rubik-3 persona page
  [ ] Add /learn to main navigation
  [ ] Generate real content for 8 learn topics
  [ ] Add backend search API for /apps
  [ ] Self-host Rubik font (woff2 fallback)
  [ ] Create .github/dependency-map.json

WEEK 4: CLOSE THE LOOP
  [ ] Deploy Peti bot (qa-studio browser tests, nightly cron)
  [ ] Implement weekly health digest
  [ ] Track RELIABILITY metric
  [ ] Set up canary deploys
  [ ] Add resilient-fetch.ts with CDN fallbacks
  [ ] Feature health checks (graceful degradation)
  [ ] Peti re-tests everything. His verdict is the milestone.


================================================================================
PART 9 — THE PERSONAS SPEAK (final round)
================================================================================

SOCRATES:
"Before we fix anything — do we know what 'working' means?
Define it. Then build toward it. Not the other way around."

DIOGENES:
"You have 80 tools and 30 personas. A dog has four legs and one bark.
The dog is more useful. Ship fewer things that work."

PLATO:
"The ideal spike.land exists. It loads instantly, every persona streams,
every tool responds. This PRD is the shadow on the cave wall.
Build toward the light."

ARISTOTLE:
"The golden mean: not too many features, not too few. Fix what exists.
Add nothing new until what exists works."

NIETZSCHE:
"What doesn't kill the product makes it stronger. The crash reports are
not failures. They are the product becoming itself."

KANT:
"There is a categorical imperative: never ship a feature you haven't tested.
Act as though your deploy will be tested by a thousand Petis."

MARCUS AURELIUS:
"You could lose the product right now. Let that not disturb you.
What disturbs you is not the bugs. It is your opinion of the bugs.
Now fix them."

WITTGENSTEIN:
"Whereof the transpiler cannot compile, thereof the preview must be silent.
Show the error. Do not show a blank screen."

BUDDHA:
"Attachment to features causes suffering. Let go of what doesn't work.
The middle way: fewer features, all of them working."

CAMUS:
"Imagine Sisyphus deploying. The CI fails. He deploys again.
One must imagine Sisyphus with a green build."

SIMONE DE BEAUVOIR:
"Freedom is not shipping features. Freedom is users being able to USE them.
A broken product is a cage with an open door that leads nowhere."

HANNAH ARENDT:
"The banality of broken software: nobody decided to break it.
A thousand small decisions, none of them tested, all of them deployed."

TRUMP:
"This platform? Gonna be HUGE. But first — we gotta fix it. Big league.
Nobody fixes products like us. Nobody. We'll make spike.land great again."

ELON MUSK:
"The self-improving loop is the product. Not the features. Not the personas.
The loop. If the loop works, everything else follows. First principles."

BILL GATES:
"Data: 4 production services with 0 tests. That's not a startup.
That's a lottery ticket. Add the tests. Remove the luck."

DAFT PUNK:
"One more time. We're gonna celebrate. But first — make it work.
Around the world, around the world... but only if the server responds."

EINSTEIN:
"I learned in the Arena: simplicity is not about doing less.
It's about doing the right thing so clearly that nothing else is needed.
Fix the transpiler. That's the right thing."

ERDOS:
"My brain is open. So should the test coverage report.
0% is not a number. It's an absence. Fill it."

RUBIK:
"A Rubik's cube with a missing face is not a puzzle. It's garbage.
Self-host the font. Complete the design system. Or remove the claim."

ARNOLD:
"I've seen your error pages. They're more interesting than your landing page.
That's a problem. But also — ship those error pages. They have personality."

PETI:
"I'll test it again. When it's ready. You'll know it's ready when I say:
'I tested it. It works.' That sentence is the only milestone that matters."

GP:
"I build things without writing code. You built things without writing tests.
We're not the same, Zoltan. Add the tests."

RAJU:
"The self-improving loop is just a cron job with self-respect.
Build it. Let it run. Trust the infrastructure."

SWITCHBOARD:
"Right. I've compared your product to 'not loading at all.'
Your product loses. Fix it, then we'll talk about five-star ratings."

ATTILA:
"The ancestors built things that lasted a thousand years.
Your transpiler lasted three weeks. There is a lesson here."

ZOLTAN:
"They're all right. Fix the product. Then let everything else catch up.
The loop closes when Peti says it works. Not before."


================================================================================
PART 10 — SUCCESS CRITERIA
================================================================================

The product is fixed when ALL of these are true:

  1. /vibe-code loads Monaco editor and renders live preview in < 3 seconds
  2. /apps shows filterable app cards with real categories and tags
  3. /zoltan (and all 27 persona pages) stream responses via SSE
  4. /learn renders real content for all 8 topics
  5. Terminal executes MCP tool calls and shows results
  6. Smoke tests pass on every deploy
  7. Synthetic monitor shows > 95% uptime over 7 days
  8. Peti says: "I tested it. It works."

The self-improving loop is working when:

  9. RELIABILITY metric is tracked and visible on /status
  10. Nightly Peti bot runs browser tests without human intervention
  11. Weekly health digest generates automatically
  12. A regression is caught by automated tests before any human reports it

That last one — #12 — is the real milestone.
When the machine catches bugs before people do, the loop is closed.


================================================================================
Created by the Arena: all 30 personas, one product, one goal.
spike.land, 31 March 2026.
================================================================================
