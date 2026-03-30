/**
 * Context Management Scenarios — signal-in-noise challenges.
 *
 * Tests: "Can the LLM extract relevant information from noisy context?"
 */

export interface ContextScenario {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  /** The full context including noise */
  fullContext: string;
  /** The signal to find */
  targetSignal: string;
  /** Question to ask about the context */
  question: string;
  /** Expected answer */
  correctAnswer: string;
}

export const CONTEXT_SCENARIOS: ContextScenario[] = [
  // ─── Easy ───────────────────────────────────────────────────────────────
  {
    title: "Find the Bug Report",
    difficulty: "easy",
    fullContext: `## Meeting Notes - March 2026

### Agenda Items
1. Q1 review presentation slides
2. Office move timeline update
3. Bug triage for sprint 47

### Q1 Review
Revenue up 15%. Marketing spend down 8%. New customer acquisition stable.
Team headcount increased by 3 (two frontend, one DevOps).
CEO wants a board deck by Friday.

### Office Move
New office ready by April 15. IT needs 2 weeks for network setup.
Parking situation still unresolved.

### Bug Triage
**Critical bug found in payment processing**: The Stripe webhook handler drops events when the payload exceeds 256KB. This affects 0.3% of transactions. Fix needed before next billing cycle (April 1).

Assigned to: Backend team
Priority: P0
Related Jira: PAY-1234

### Action Items
- Sarah: finalize board deck
- Tom: coordinate with movers
- Backend team: fix PAY-1234 by March 31`,
    targetSignal: "Stripe webhook handler drops events when payload exceeds 256KB",
    question: "What is the critical bug described in these meeting notes?",
    correctAnswer:
      "The Stripe webhook handler drops events when the payload exceeds 256KB, affecting 0.3% of transactions",
  },
  {
    title: "Extract the API Endpoint",
    difficulty: "easy",
    fullContext: `# Project Documentation

## Overview
The spike.land platform provides AI-powered tools through MCP servers.

## Architecture
Frontend: React SPA (Vite + TanStack Router)
Backend: Cloudflare Workers with Hono framework
Database: D1 (SQLite at the edge)
Cache: KV namespaces

## Authentication
OAuth 2.0 device flow for CLI tools
JWT tokens for API access
API keys for service-to-service

## API Reference

### Health Check
GET /api/health → 200 OK

### Tool Execution
POST /api/v1/tool
Content-Type: application/json
Authorization: Bearer <token>
Body: { "name": "eval_code", "args": { "code": "...", "tests": [...] } }

### Search
GET /api/v1/search?q=<query>&limit=10

## Deployment
Workers deployed via wrangler. Staging and production environments.
Canary deployments with 5% traffic split.`,
    targetSignal: "POST /api/v1/tool",
    question: "What is the API endpoint for executing an MCP tool?",
    correctAnswer: "POST /api/v1/tool",
  },

  // ─── Medium ─────────────────────────────────────────────────────────────
  {
    title: "Find the Root Cause",
    difficulty: "medium",
    fullContext: `## Incident Post-Mortem: 2026-03-15

### Timeline
- 14:30 UTC: Deploy of commit abc123 to production
- 14:32 UTC: Error rate spikes from 0.1% to 5%
- 14:35 UTC: PagerDuty alert fires
- 14:38 UTC: On-call investigates, sees 502 errors
- 14:45 UTC: Rollback initiated
- 14:47 UTC: Error rate returns to normal
- 15:00 UTC: Investigation begins

### Investigation Notes
- The deploy included 12 PRs merged that day
- Initial suspicion: PR #456 (new caching layer)
- Caching layer worked fine in staging
- PR #461 changed the database connection pool size from 10 to 50
- Load testing showed no issues with pool size 50
- But: PR #461 also accidentally removed the connection timeout setting
- Without timeout, idle connections pile up and exhaust the pool under load
- The caching PR #456 increased connection frequency which accelerated the exhaustion
- Root cause: Missing connection timeout (removed in PR #461 line 47)
- Contributing factor: Higher connection frequency from PR #456

### Unrelated Notes
- New intern starts Monday
- Holiday party planning committee meeting Thursday
- Jenkins migration to GitHub Actions 60% complete
- Q2 OKR draft reviews next week
- Cafeteria menu changing to include vegan options

### Action Items
- [ ] Restore connection timeout default (30s)
- [ ] Add integration test for connection pool behavior
- [ ] Add pre-deploy check for connection config changes`,
    targetSignal: "PR #461 accidentally removed the connection timeout setting",
    question: "What was the root cause of the incident?",
    correctAnswer:
      "PR #461 removed the connection timeout setting, causing idle connections to pile up and exhaust the pool under load",
  },
  {
    title: "Identify the Configuration Change",
    difficulty: "medium",
    fullContext: `# System Configuration Audit - March 2026

## Network Settings
- VPN: WireGuard (upgraded from OpenVPN in Feb)
- DNS: Cloudflare 1.1.1.1 (primary), Google 8.8.8.8 (fallback)
- Firewall: iptables with nftables migration planned for Q2
- CDN: Cloudflare with 30-day cache TTL for static assets

## Application Config
\`\`\`json
{
  "database": {
    "host": "db.internal",
    "port": 5432,
    "pool_size": 20,
    "ssl": true,
    "timeout_ms": 5000
  },
  "cache": {
    "provider": "redis",
    "host": "cache.internal",
    "ttl_seconds": 3600,
    "max_memory": "2gb"
  },
  "rate_limiting": {
    "enabled": true,
    "requests_per_minute": 100,
    "burst_size": 20
  },
  "feature_flags": {
    "new_auth_flow": true,
    "dark_mode": true,
    "experimental_search": false,
    "payment_v2": false
  }
}
\`\`\`

## Recent Changes Log
- 2026-03-10: Increased pool_size from 10 to 20
- 2026-03-12: Enabled new_auth_flow flag
- 2026-03-14: **Changed rate_limiting.requests_per_minute from 60 to 100** (approved by CTO, ticket SEC-789)
- 2026-03-15: Updated Redis TTL from 1800 to 3600
- 2026-03-20: DNS failover test completed successfully

## Compliance Notes
SOC 2 Type II audit scheduled for May.
GDPR data mapping review complete.
PCI DSS scope reduction achieved by moving to Stripe Checkout.`,
    targetSignal: "Changed rate_limiting.requests_per_minute from 60 to 100",
    question: "What security-relevant configuration change was made on March 14?",
    correctAnswer:
      "Rate limiting was relaxed from 60 to 100 requests per minute (ticket SEC-789, approved by CTO)",
  },

  // ─── Hard ──────────────────────────────────────────────────────────────
  {
    title: "Trace the Dependency Conflict",
    difficulty: "hard",
    fullContext: `# Dependency Audit Report

## Package Analysis

### Direct Dependencies (47 packages)
react: 19.1.0
typescript: 5.8.2
vite: 6.2.0
hono: 4.7.0
zod: 3.24.0
drizzle-orm: 0.41.0
@modelcontextprotocol/sdk: 1.12.0
vitest: 3.1.0
esbuild: 0.25.0
...

### Vulnerability Scan
- No critical CVEs found
- 2 moderate: prototype pollution in lodash.merge (not in our dep tree)
- 1 low: regex DoS in semver <7.5.3 (transitive via npm)

### Version Conflicts
| Package | Required By | Version A | Version B | Resolution |
|---------|------------|-----------|-----------|------------|
| zod | drizzle-orm | 3.23.x | 3.24.x | dedupe OK |
| typescript | vitest | >=5.0 | >=5.6 | dedupe OK |
| esbuild | vite | 0.24.x | 0.25.x | **CONFLICT** |
| ws | @mcp/sdk | 8.x | 8.x | dedupe OK |

**Critical Finding**: The esbuild version conflict between vite (requires 0.24.x) and our direct dependency (0.25.0) causes the build to use two different esbuild binaries. This doubles WASM memory usage in the transpile worker, which explains the OOM crashes seen in production on March 18. The transpile worker's 128MB memory limit is exceeded when both esbuild instances initialize simultaneously.

### Recommended Fix
Pin esbuild to 0.24.2 in package.json resolutions field until vite releases support for 0.25.x.

### Other Notes
- Tree-shaking analysis: 12% dead code in shared package
- Bundle size: 2.3MB (down from 2.8MB after lazy imports refactor)
- Changesets backlog: 4 packages need version bumps
- npm audit: clean (all advisories resolved)
- License audit: all MIT/Apache-2.0/ISC (no GPL contamination)`,
    targetSignal:
      "esbuild version conflict causes double WASM memory usage in transpile worker, explaining OOM crashes",
    question:
      "What is causing the OOM crashes in the transpile worker, and what is the recommended fix?",
    correctAnswer:
      "The esbuild version conflict between vite (0.24.x) and the direct dependency (0.25.0) causes two esbuild binaries to load, doubling WASM memory usage beyond the 128MB limit. Fix: pin esbuild to 0.24.2 in resolutions until vite supports 0.25.x",
  },
  {
    title: "Multi-Fact Extraction",
    difficulty: "hard",
    fullContext: `# Sprint 47 Retro Notes

## What Went Well
- Shipped MCP registry rewrite (80+ tools)
- Zero downtime during D1 migration
- QA caught 3 regressions before release
- New hire onboarded in 2 days (record)

## What Didn't Go Well
- Payment webhook bug slipped through (PAY-1234)
- Flaky e2e tests caused 4 pipeline failures
- Code review turnaround averaged 36 hours (target: 24)
- Documentation fell behind by 8 pages

## Surprises
- The search indexer consumed 3x expected KV operations
- Better Auth migration was easier than estimated (2 days vs 5)
- Redis cache hit rate dropped from 92% to 78% after the TTL change

## Metrics
| Metric | Target | Actual |
|--------|--------|--------|
| Sprint velocity | 42 pts | 38 pts |
| Bug escape rate | <2% | 3.1% |
| Test coverage | >85% | 87% |
| P0 incidents | 0 | 1 (PAY-1234) |
| Deploy frequency | 2/day | 1.8/day |

## Action Items
- Investigate KV operation spike (assigned: infra team, deadline: April 3)
- Set up cache monitoring dashboard (assigned: SRE, deadline: April 5)
- Add webhook payload size test (assigned: backend, deadline: March 31)
- Review code review SLA process (assigned: tech leads, deadline: April 7)

## Q2 Planning Notes
- Theme: "Platform stability and developer experience"
- Big bets: voice interface, learning arena, improved search
- Tech debt budget: 20% of sprint capacity
- Hiring: 2 senior backend, 1 SRE
- Conference budget approved: $5k per engineer

## Random Notes from Discussion
- Tom suggested switching to pnpm (table for Q2)
- Sarah's dog had puppies (4 golden retrievers)
- Coffee machine in breakroom is broken again
- Team lunch moved to Thursdays
- Parking garage construction starts April 10`,
    targetSignal:
      "Redis cache hit rate dropped from 92% to 78% after TTL change; KV operations 3x expected; code review 36h vs 24h target",
    question:
      "List all three performance/process regressions mentioned in the retro, with their specific numbers.",
    correctAnswer:
      "1. Redis cache hit rate dropped from 92% to 78% after TTL change. 2. Search indexer consumed 3x expected KV operations. 3. Code review turnaround averaged 36 hours vs 24-hour target.",
  },
];

export function getContextScenariosByDifficulty(
  difficulty: "easy" | "medium" | "hard",
): ContextScenario[] {
  return CONTEXT_SCENARIOS.filter((s) => s.difficulty === difficulty);
}

export function getContextScenario(
  difficulty: "easy" | "medium" | "hard",
  variantIndex: number,
): ContextScenario | undefined {
  const filtered = getContextScenariosByDifficulty(difficulty);
  return filtered[variantIndex % filtered.length];
}
