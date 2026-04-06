# PRD: notepad.spike.land — Spatial AI-Augmented Thinking Tool

## Introduction

**notepad.spike.land** is a spatial, AI-augmented thinking and research tool deployed as a Cloudflare Worker on the spike.land platform. Instead of forcing linear chat-based AI interaction, it provides a canvas where users create notes that are automatically classified into 14 types, connected by inferred relationships, and synthesized into emergent insights — all with AI working quietly in the background.

Inspired by [mskayyali/nodepad](https://github.com/mskayyali/nodepad) (231 stars), enhanced with ideas from DivShot (web capture), deep-research-test (human-in-the-loop research), and boxedthoughts (hashtag clustering), then supercharged with spike.land's edge-native MCP ecosystem, real-time collaboration via Durable Objects, and offline-first storage via block-sdk.

**Core thesis:** "Thinking is spatial and associative. AI is most useful when it works quietly in the background."

---

## Goals

- Deliver a production-ready spatial thinking tool at `notepad.spike.land` within the spike.land monorepo
- Provide three complementary views (Tiling, Kanban, Graph) for different cognitive tasks
- Auto-classify notes into 14 types with >90% accuracy using Workers AI
- Generate emergent synthesis (bridging theses) when patterns emerge across notes
- Enable real-time multi-user collaboration via Durable Objects
- Work offline-first with automatic sync when connectivity returns
- Expose every notepad action as an MCP tool, composable with spike.land's 80+ existing tools
- Achieve Lighthouse score >95 and time-to-first-note <3 seconds

---

## User Stories

### Phase 1: Core Canvas & Notes

#### US-001: Project scaffolding (edge service + deploy shim)
**Description:** As a developer, I need the Cloudflare Worker service structure so notepad.spike.land can be deployed.

**Acceptance Criteria:**
- [ ] `packages/spike-notepad/wrangler.toml` with route `notepad.spike.land/*` and zone_name `spike.land`
- [ ] `packages/spike-notepad/package.json` with dev/deploy/test scripts
- [ ] `packages/spike-notepad/index.ts` re-exports from `src/edge-api/spike-notepad/api/app.ts`
- [ ] `src/edge-api/spike-notepad/api/app.ts` — Hono app with health endpoint
- [ ] `src/edge-api/spike-notepad/core-logic/env.ts` — Env bindings interface
- [ ] D1 database binding configured in wrangler.toml
- [ ] `wrangler dev` starts successfully on a local port
- [ ] Typecheck passes

#### US-002: D1 schema for notes and projects
**Description:** As a developer, I need database tables to persist notes and projects.

**Acceptance Criteria:**
- [ ] `projects` table: id (TEXT PK), name (TEXT), created_at, updated_at
- [ ] `notes` table: id (TEXT PK), project_id (FK), content (TEXT), type (TEXT, one of 14 types), confidence (REAL), tags (TEXT JSON array), pinned (BOOLEAN), position_x (REAL), position_y (REAL), created_at, updated_at
- [ ] `connections` table: id (TEXT PK), project_id (FK), source_note_id (FK), target_note_id (FK), relationship (TEXT), strength (REAL)
- [ ] `syntheses` table: id (TEXT PK), project_id (FK), thesis (TEXT), bridging_category (TEXT), source_note_ids (TEXT JSON array), created_at
- [ ] Drizzle migration generated and applied successfully
- [ ] Typecheck passes

#### US-003: Create and edit notes on canvas
**Description:** As a user, I want to click anywhere on the canvas to create a note and double-click to edit it, so I can capture thoughts with zero friction.

**Acceptance Criteria:**
- [ ] Click on empty canvas area creates a new note at that position
- [ ] Note appears immediately with editable text area (auto-focus)
- [ ] Double-click existing note enters edit mode with auto-sizing textarea
- [ ] Pressing Escape or clicking outside saves and exits edit mode
- [ ] Notes persist to D1 via API call (debounced 800ms)
- [ ] New notes default to type "general"
- [ ] Time from click to editable note < 200ms
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-004: Delete and pin notes
**Description:** As a user, I want to delete notes I no longer need and pin important ones for emphasis.

**Acceptance Criteria:**
- [ ] Right-click note shows context menu with Delete and Pin/Unpin options
- [ ] Delete shows confirmation dialog before removing
- [ ] Pinned notes show visual indicator (pin icon + border highlight)
- [ ] Pinned notes appear first in Kanban view
- [ ] Undo support: deleted note can be restored (20-snapshot undo history)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-005: Hashtag parsing and clustering
**Description:** As a user, I want to use #tags in notes so related notes cluster together visually.

**Acceptance Criteria:**
- [ ] Typing `#tagname` in note content is parsed and stored in tags array
- [ ] Tags render as colored chips below note content
- [ ] Notes sharing a tag show visual connection (same color highlight)
- [ ] Tag index panel shows all tags with note counts
- [ ] Clicking a tag filters view to show only notes with that tag
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 2: AI Classification & Enrichment

#### US-006: Auto-classify notes into 14 types
**Description:** As a user, I want my notes automatically classified (claim, question, idea, task, entity, quote, reference, definition, opinion, reflection, narrative, comparison, thesis, general) so I can organize my thinking without manual effort.

**Acceptance Criteria:**
- [ ] After note content is saved, Workers AI classifies it into one of 14 types
- [ ] Classification includes confidence score (0.0–1.0)
- [ ] Type badge displayed on note card with type-specific color
- [ ] User can manually override type via dropdown
- [ ] Classification runs in background (does not block note creation)
- [ ] Low-confidence (<0.5) classifications show "uncertain" indicator
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-007: AI-generated annotations
**Description:** As a user, I want each note enriched with contextual annotations so I get deeper understanding of my thoughts.

**Acceptance Criteria:**
- [ ] After classification, AI generates a 1–2 sentence annotation for each note
- [ ] Annotation appears below note content in muted text
- [ ] Claims get confidence assessment; questions get suggested exploration directions
- [ ] Annotations update when note content changes (debounced)
- [ ] User can dismiss/hide annotations per note
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-008: Connection inference between notes
**Description:** As a user, I want the system to automatically identify relationships between my notes so I can see how my thoughts connect.

**Acceptance Criteria:**
- [ ] When 3+ notes exist, AI analyzes pairs for semantic relationships
- [ ] Connections stored in `connections` table with relationship label and strength
- [ ] Connected notes show visual link (line in Tiling, arrow in Graph)
- [ ] Hovering a note highlights its connections, dims unrelated notes
- [ ] Click-lock on a note holds the highlight state
- [ ] Connection inference runs in background after each new note
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-009: Emergent synthesis generation
**Description:** As a user, I want the system to surface bridging theses when cross-category patterns emerge, so I discover insights I wouldn't see on my own.

**Acceptance Criteria:**
- [ ] When 5+ notes span 3+ types, synthesis engine activates
- [ ] Generates a single 15–25 word bridging sentence connecting concepts
- [ ] Includes a one-word bridging category label
- [ ] Synthesis appears in "Ghost Panel" (slide-out from right edge)
- [ ] User can "solidify" synthesis into a thesis note or dismiss it
- [ ] Avoids repetition by tracking previously generated theses
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 3: Three Visualization Modes

#### US-010: Tiling view (BSP grid layout)
**Description:** As a user, I want a spatial tiling layout so I can see all my notes organized in a responsive grid.

**Acceptance Criteria:**
- [ ] Binary Space Partition (BSP) algorithm divides canvas into tiles
- [ ] Each tile contains one note card with type badge, content, tags
- [ ] Elastic pagination: 300px for 1–2 items, 60vh for 3–4, full screen for 5+
- [ ] Hovering a tile highlights connected tiles, dims unrelated
- [ ] Minimap in corner shows full layout with viewport indicator
- [ ] Responsive: adapts to window resize
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-011: Kanban view (type-grouped columns)
**Description:** As a user, I want a Kanban board grouping notes by type so I can see the distribution of my thinking.

**Acceptance Criteria:**
- [ ] Columns for each note type that has at least one note
- [ ] Column headers show type name, icon, and note count
- [ ] Notes within columns ordered by: pinned first, then by creation date
- [ ] Drag-and-drop between columns changes note type (with confirmation)
- [ ] Collapsible columns to focus on specific types
- [ ] Minimap showing column distribution
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-012: Graph view (D3 force-directed)
**Description:** As a user, I want a network graph showing how my notes connect so I can visualize the structure of my thinking.

**Acceptance Criteria:**
- [ ] D3.js force-directed layout with notes as nodes, connections as edges
- [ ] Node size proportional to number of connections (centrality)
- [ ] Node color reflects note type
- [ ] Synthesis notes rendered as bridge nodes between clusters
- [ ] Click node to select, show detail panel with full content
- [ ] Zoom and pan controls
- [ ] Physics simulation with adjustable parameters
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-013: View switching and command palette
**Description:** As a user, I want to switch between views quickly and access actions via a command palette.

**Acceptance Criteria:**
- [ ] Keyboard shortcut `Cmd/Ctrl+K` opens command palette
- [ ] Palette supports: switch view, create note, search notes, filter by type/tag, export
- [ ] View tabs (Tiling | Kanban | Graph) in top bar with keyboard shortcuts (1/2/3)
- [ ] View state preserved when switching (scroll position, selected note)
- [ ] Vim-style input mode for power users (toggle with `:`)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 4: Collaboration & Sync

#### US-014: Durable Object for real-time project sync
**Description:** As a developer, I need a Durable Object that synchronizes project state across multiple connected clients.

**Acceptance Criteria:**
- [ ] `NotepadRoom` Durable Object handles WebSocket connections per project
- [ ] Broadcasts note create/update/delete events to all connected clients
- [ ] Handles concurrent edits with last-writer-wins + conflict markers
- [ ] Presence tracking: shows connected users with cursor positions
- [ ] Reconnection logic with state catch-up on rejoin
- [ ] Max 50 concurrent connections per room
- [ ] Typecheck passes

#### US-015: Auth integration via mcp-auth
**Description:** As a user, I want to sign in with my spike.land account so my projects persist across devices.

**Acceptance Criteria:**
- [ ] Login button using mcp-auth service binding
- [ ] Authenticated users get server-persisted projects (D1)
- [ ] Anonymous users get localStorage-only projects (block-sdk)
- [ ] Seamless migration: anonymous projects can be claimed after login
- [ ] Session token stored in httpOnly cookie
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 5: Offline-First & Export

#### US-016: Offline-first with block-sdk
**Description:** As a user, I want to keep working when offline and have changes sync when I'm back online.

**Acceptance Criteria:**
- [ ] block-sdk provides IndexedDB storage for offline notes
- [ ] Service worker caches app shell and static assets
- [ ] Offline indicator in status bar
- [ ] Changes queue in IndexedDB, sync to D1 on reconnect
- [ ] Conflict resolution: server wins, local changes shown as "pending review"
- [ ] Typecheck passes

#### US-017: Export to Markdown and .notepad format
**Description:** As a user, I want to export my project so I can use it in other tools or share it.

**Acceptance Criteria:**
- [ ] "Export as Markdown" generates .md with YAML frontmatter per note
- [ ] Frontmatter includes: type, confidence, tags, created_at
- [ ] "Export as .notepad" generates versioned JSON (version field for schema evolution)
- [ ] "Import .notepad" with ID collision prevention (fresh IDs assigned)
- [ ] Export accessible via command palette and project sidebar menu
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-018: Web grounding for source citation
**Description:** As a user, I want to ground my claims with web sources so my research is credible.

**Acceptance Criteria:**
- [ ] Appending `:online` to a note triggers web search grounding
- [ ] AI enrichment includes source URLs and citation snippets
- [ ] Sources displayed as clickable links below annotation
- [ ] Works for truth-dependent types: claim, reference, entity, quote
- [ ] SSRF protection: blocks private IP ranges (10.0.0.0/8, 192.168.0.0/16, etc.)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 6: MCP Integration & Plugins

#### US-019: MCP tool surface for notepad actions
**Description:** As a developer, I want every notepad action exposed as an MCP tool so agents and other spike.land apps can interact with notepad programmatically.

**Acceptance Criteria:**
- [ ] MCP tools: `notepad.createNote`, `notepad.listNotes`, `notepad.classifyNote`, `notepad.getConnections`, `notepad.generateSynthesis`, `notepad.exportProject`
- [ ] Tools follow spike.land MCP pattern: SDK + Zod schema + handler
- [ ] Tools registered in spike-land-mcp registry
- [ ] Tools callable from spike-cli and other MCP clients
- [ ] Typecheck passes

#### US-020: Plugin system via MCP tools
**Description:** As a user, I want to extend notepad with plugins (image generation, code eval, etc.) from the spike.land app store.

**Acceptance Criteria:**
- [ ] Plugin panel in sidebar shows available MCP tools
- [ ] "Image Studio" plugin: generate images from note descriptions
- [ ] "Code Eval" plugin: evaluate code blocks in notes
- [ ] "HackerNews" plugin: import HN discussions as research notes
- [ ] Plugins activate per-project, settings persisted
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 7: Human-in-the-Loop Research

#### US-021: Research mode with approval gates
**Description:** As a user, I want to trigger a deep research workflow where AI searches, evaluates, and reports — pausing for my approval before incorporating findings.

**Acceptance Criteria:**
- [ ] "Research" action on any note triggers multi-stage pipeline
- [ ] Stage 1: AI searches web for supporting/contradicting evidence
- [ ] Stage 2: Results shown in review panel with relevance scores
- [ ] Stage 3: User approves/rejects individual findings
- [ ] Stage 4: Approved findings become linked reference notes
- [ ] Pipeline can be cancelled at any stage
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## Functional Requirements

- **FR-1:** The system must deploy as a Cloudflare Worker at `notepad.spike.land` using Hono framework
- **FR-2:** The system must store notes, projects, connections, and syntheses in D1 (SQLite)
- **FR-3:** The system must classify notes into exactly 14 types using Workers AI
- **FR-4:** The system must generate emergent synthesis when 5+ notes span 3+ types
- **FR-5:** The system must provide Tiling (BSP), Kanban, and Graph (D3) views
- **FR-6:** The system must sync state in real-time via Durable Objects (WebSocket)
- **FR-7:** The system must work offline using block-sdk (IndexedDB) with background sync
- **FR-8:** The system must authenticate users via mcp-auth service binding
- **FR-9:** The system must expose all actions as MCP tools registered in spike-land-mcp
- **FR-10:** The system must export to Markdown (YAML frontmatter) and .notepad (versioned JSON)
- **FR-11:** The system must support web grounding with SSRF protection
- **FR-12:** The system must render notes with type-specific styling (blockquotes for quotes, checkboxes for tasks, italics for reflections)
- **FR-13:** The system must support multi-language content (Arabic, Hebrew, CJK, Russian script detection)
- **FR-14:** The system must provide undo/redo with 20-snapshot history per project
- **FR-15:** The system must parse #hashtags from note content and support tag-based filtering

---

## Non-Goals (Out of Scope)

- **No mobile app** — desktop-first, responsive but not native mobile
- **No Chrome extension** (DivShot-style web capture deferred to v2)
- **No custom AI model training** — uses pre-trained Workers AI models
- **No end-to-end encryption** — server can read notes (required for AI processing)
- **No payment/billing** — free tier only for v1
- **No version history UI** — undo/redo yes, but no timeline browser
- **No real-time cursor sharing** — presence indicators only, not live cursors (v2)
- **No import from Notion/Obsidian** — only .notepad and plain text import

---

## Design Considerations

- **Minimal UI, Maximum Cognition:** UI chrome should be nearly invisible. Canvas dominates the viewport.
- **Type-specific note styling:** Claims get bold borders, questions get ? icon, tasks get checkboxes, quotes get blockquote styling, etc.
- **Dark mode default** with light mode toggle (via `next-themes` pattern adapted for Workers)
- **Keyboard-first interaction** — every action reachable via keyboard shortcut or command palette
- **Status bar** at bottom shows: connection count, sync status, AI processing indicator, current view
- **Ghost Panel** slides from right edge for synthesis display — never interrupts the canvas

---

## Technical Considerations

- **Architecture:** Two-tier (packages/ shim + src/edge-api/ implementation) per spike.land convention
- **Frontend delivery:** Static assets via R2 or Workers Sites; API via Hono routes
- **AI pipeline:** Workers AI for classification/annotation → OpenRouter fallback for synthesis (needs higher capability)
- **D1 limits:** 10MB max database size per free tier — implement project archival for heavy users
- **Durable Object limits:** 128MB memory, 30s CPU per request — keep WebSocket handlers lightweight
- **block-sdk integration:** Use `@spike-land-ai/block-sdk` for portable storage abstraction
- **Testing:** Vitest for unit/integration; Miniflare for Worker-specific tests
- **Security:** CSP headers, X-Frame-Options: DENY, SSRF protection on URL fetching, HTML entity escaping in user content

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Time to first note | < 3 seconds | Lighthouse TTI + manual testing |
| Classification accuracy | > 90% | Manual review of 100 sample notes |
| Synthesis relevance | > 4/5 user rating | In-app thumbs up/down on syntheses |
| Real-time sync latency | < 100ms | WebSocket round-trip measurement |
| Lighthouse performance | > 95 | Lighthouse CI in deployment pipeline |
| Offline capability | Full CRUD offline | Manual testing with network throttling |
| MCP tool coverage | 6+ tools registered | Automated registry check |

---

## Open Questions

1. **Workers AI model selection:** Which specific model for classification? `@cf/meta/llama-3.1-8b-instruct` vs `@cf/mistral/mistral-7b-instruct`?
2. **D1 vs Durable Object storage:** Should notes live in D1 (queryable) or DO storage (faster sync)? Or hybrid?
3. **Frontend framework:** Use spike.land's custom `react-ts-worker` or standard React 19? Custom adds complexity but aligns with platform.
4. **BSP algorithm:** Port nodepad's exact BSP implementation or write from scratch with improvements?
5. **Rate limiting:** How many AI classifications per minute per user? Workers AI has per-account limits.
6. **Domain setup:** DNS record for `notepad.spike.land` — CNAME to Workers route or Cloudflare custom domain?
