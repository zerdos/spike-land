# A-001 Import Path Refactoring from Phase 2 Reorg

**Priority:** N/A (housekeeping)
**Category:** Uncommitted Changes
**Type:** Refactor
**Affected Personas:** N/A (internal)
**Estimated Effort:** S

## Problem

Phase 2 file reorganization moved files into concern-based subdirectories (`core-logic/`, `chess-core/`, `lazy-imports/`, `node-sys/`, `cli/`, `ai/`) but the corresponding import path updates in source and test files were never committed.

## Evidence

9 files with uncommitted import path changes:

**Chess engine tests** (3 files):
- `.tests/chess-engine/challenge-manager.test.ts`: `@/lib/prisma` → `@/core-logic/prisma`
- `.tests/chess-engine/game-manager.test.ts`: `@/lib/prisma` → `@/core-logic/prisma`, `../../src/core/chess/engine` → `../../src/core/chess/chess-core/engine`, `../../src/core/chess/elo` → `../../src/core/chess/lazy-imports/elo`
- `.tests/chess-engine/player-manager.test.ts`: `@/lib/prisma` → `@/core-logic/prisma`

**Chess engine source** (3 files):
- `src/core/chess/core-logic/challenge-manager.ts`: `@/generated/prisma` → `@/core-logic/prisma` (8 occurrences)
- `src/core/chess/core-logic/game-manager.ts`: `@/generated/prisma` → `@/core-logic/prisma` (14 occurrences)
- `src/core/chess/core-logic/player-manager.ts`: `@/generated/prisma` → `@/core-logic/prisma` (9 occurrences)

**Spike CLI test** (1 file):
- `.tests/spike-cli/__tests__/chat/client.test.ts`: `core-logic/chat/client.js` → `ai/client.js`

**State machine test** (1 file):
- `.tests/state-machine/cli-subprocess.test.ts`: `statecharts/cli.js` → `statecharts/cli/cli.js`, `statecharts/engine.js` → `statecharts/node-sys/engine.js`

**Statecharts CLI** (1 file):
- `src/core/statecharts/cli/cli.ts`: `process.stderr.write(...)` → `console.error(...)`

## Acceptance Criteria

- [ ] All 9 files committed with descriptive message
- [ ] Chess engine tests pass: `npx vitest run .tests/chess-engine/`
- [ ] Spike CLI test passes: `npx vitest run .tests/spike-cli/`
- [ ] State machine test passes: `npx vitest run .tests/state-machine/`

## Implementation Notes

These are pure import path updates to match the Phase 2 directory reorganization. No logic changes. The changes are already made — just need to be staged and committed.
