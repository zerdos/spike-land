# Issue Tickets — spike.land MCP Registry Audit

Generated from the 64-agent swarm audit (16 personas × 4 rounds) and uncommitted code analysis on 2026-03-08.

## Summary

| Category | Description | Tickets | P0 | P1 | P2 | P3 |
|----------|-------------|---------|----|----|----|----|
| [A — Uncommitted Changes](A-uncommitted-changes/) | Pending code changes from Phase 2 reorg | 5 | — | — | — | — |
| [B — Trust & Integrity](B-trust-integrity/) | Fake tools, circular dependencies | 3 | 3 | — | — | — |
| [C — Schema & Type Safety](C-schema-type-safety/) | Broken schemas, wrong types | 4 | — | 2 | 2 | — |
| [D — Onboarding & Discovery](D-onboarding-discovery/) | No guided path for any persona | 5 | — | 2 | 3 | — |
| [E — Namespace Pollution](E-namespace-pollution/) | Internal tools exposed to end users | 3 | — | 2 | 1 | — |
| [F — Missing Capabilities](F-missing-capabilities/) | Gaps in MCP tool surface | 6 | — | 1 | 4 | 1 |
| [G — Billing & Security](G-billing-security/) | Billing exposure, missing guardrails | 4 | — | 2 | 2 | — |
| [H — UX & API Design](H-ux-api-design/) | Friction and usability issues | 5 | — | — | 4 | 1 |
| [I — Observability & Ops](I-observability-ops/) | Missing operational tooling | 4 | — | — | 3 | 1 |
| **Total** | | **39** | **3** | **9** | **19** | **3** |

## Priority Definitions

- **P0 — Critical**: Trust-breaking issues that actively mislead users or block all workflows. Fix immediately.
- **P1 — High**: Significant gaps that block major persona use cases. Fix in next sprint.
- **P2 — Medium**: Usability issues, missing features that affect experience. Plan for upcoming work.
- **P3 — Low**: Nice-to-have improvements. Backlog.

## Ticket Format

Each ticket file follows this structure:

- **Title** and metadata (priority, category, type, affected personas, effort)
- **Problem** — What's wrong and why it matters
- **Evidence** — Specific quotes from the 64-agent swarm report or git diff
- **Acceptance Criteria** — Testable conditions for completion
- **Implementation Notes** — Key files, approaches, or constraints

## For Jules Agents

Each ticket is self-contained and can be picked up independently. Start with P0 tickets in Category B, then work through P1 tickets across categories. Category A tickets require git commits and can be batched.

## Source Data

- **Swarm report**: `MCP_64_AGENTS_REPORT.md` (465KB, 64 sessions)
- **Git status**: 14 modified files + 48 untracked files at time of audit
