# B-001 Remove or Fix Fake `sandbox_exec` Tool

**Priority:** P0 — Critical
**Category:** Trust & Integrity
**Type:** Bug Fix
**Affected Personas:** ALL 16 personas flagged this across all 4 rounds
**Estimated Effort:** M

## Problem

The `sandbox_exec` tool is explicitly fake — its description says "SIMULATED EXECUTION ONLY — no code actually runs." This is buried in the description rather than being prominently flagged, causing users to build workflows around it before discovering nothing actually executes. This is the single most-cited issue across all 64 agent sessions.

## Evidence

Every persona flagged this in every round:

- **AI Indie (R1)**: "`sandbox_exec` is explicitly fake — 'SIMULATED EXECUTION ONLY, no code actually runs' is buried in the description. This is a trust-destroying gotcha."
- **Classic Indie (R1)**: "the description literally says 'SIMULATED EXECUTION ONLY — no code actually runs.' This is a landmine"
- **Enterprise DevOps (R1)**: "This is a fundamental capability gap; without real execution, test automation and CI pipelines are theater."
- **ML Engineer (R2)**: "making the entire sandbox category useless for running training scripts, data pipelines, or model inference"
- **Technical Founder (R2)**: "a fake tool masquerading as real functionality, which is a trust-killer"
- **Non-technical Founder (R1)**: "if I somehow found and used this, I'd think I was doing real work but nothing would actually happen; that's a trust-breaking deception"

## Acceptance Criteria

- [ ] `sandbox_exec` is either:
  - (a) Removed entirely from the MCP registry, OR
  - (b) Renamed to `sandbox_exec_demo` / `sandbox_simulate` with prominent "⚠️ SIMULATED" prefix in name AND description, OR
  - (c) Replaced with a real sandboxed execution environment
- [ ] No user can accidentally invoke simulated execution believing it's real
- [ ] Related tools (`testgen_*`) have updated descriptions noting execution limitations

## Implementation Notes

The tool definition lives in the spike-land-mcp D1 database. Check `src/mcp-tools/` or the MCP registry seeding scripts for the tool registration. Option (a) is the safest short-term fix. Option (c) is the ideal long-term solution but requires significant infrastructure work.
