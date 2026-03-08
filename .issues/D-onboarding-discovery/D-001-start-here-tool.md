# D-001 Create "Start Here" / Guided Onboarding Tool

**Priority:** P1 — High
**Category:** Onboarding & Discovery
**Type:** Feature
**Affected Personas:** ALL 16 personas — universally cited as missing
**Estimated Effort:** L

## Problem

The MCP registry exposes 80+ tools in a flat list with no guided "start here" path. Every persona — from non-technical founders to enterprise DevOps — reported being overwhelmed with no clear entry point. The `beuniq_start` persona quiz exists but is buried at the bottom of the tool list and not signaled as an onboarding entry point.

## Evidence

- **Non-technical Founder (R1)**: "No onboarding flow is obvious — there's no 'start here' tool or guided path for a new user"
- **AI Hobbyist (R1)**: "No guided onboarding or 'start here' tool — 80+ tools with no sequencing advice is overwhelming for a new user"
- **Solo Explorer (R1)**: "No obvious 'start here' tool or onboarding flow"
- **Growth Leader (R1)**: "No onboarding flow surfaces — `bootstrap_status` exists but I was never guided through it"
- **Enterprise DevOps (R1)**: "180+ tools with no grouping or recommended flows — needs a 'DevOps quickstart' meta-tool"
- **Content Creator (R1)**: "Overwhelming tool count for a non-technical user: ~180 tools with no categorized onboarding path"

## Acceptance Criteria

- [ ] A `start_here` or `onboarding_guide` tool exists as the first tool in the registry
- [ ] Tool accepts optional persona/role input and returns a curated list of recommended tools
- [ ] Output includes: recommended first actions, tool categories relevant to the persona, and links to help
- [ ] Tool appears prominently (first in list or clearly marked as entry point)

## Implementation Notes

Consider using `beuniq_start` as the foundation but renaming and repositioning it. The tool should return a structured response with: (1) persona-appropriate tool recommendations, (2) a "quickstart" sequence of 3-5 actions, (3) category groupings with counts.
