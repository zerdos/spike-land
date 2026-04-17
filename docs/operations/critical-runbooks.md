# Critical Operations Runbook

## 1. Production Deployment Failure
**Symptom:** The latest release causes 5xx errors or breaks core functionality.
**Immediate Mitigation (Rollback):**
1. Authenticate to Cloudflare: `npx wrangler login` (ensure using company credentials).
2. List recent deployments: `npx wrangler deployments list`
3. Rollback to the last known good deployment: `npx wrangler rollback <deployment-id>`

## 2. D1 Schema Migration Failure
**Symptom:** A database migration fails mid-execution or corrupts production state.
**Immediate Mitigation:**
1. **Do not run destructive reverse migrations without a backup.**
2. Locate the latest backup: `npx wrangler d1 backup list <database-name> --prod`
3. Restore the database: `npx wrangler d1 backup restore <database-name> <backup-id> --prod`

## 3. Stripe Webhook Outage
**Symptom:** Payments succeed but subscriptions/credits are not provisioned.
**Immediate Mitigation:**
1. Log in to the Stripe Dashboard.
2. Navigate to Developers -> Webhooks and check the "Failed" tab.
3. Review Cloudflare Logpush or tail logs (`npx wrangler tail --prod`).
4. **Recovery:** Once patched, use the Stripe Dashboard to "Resend" failed events.

## 4. Worker Log Persistence (Logpush)

**Status:** `logpush = true` is enabled in every `packages/*/wrangler.toml`
(spike-edge, spike-land-mcp, spike-land-backend, mcp-auth, spike-chat,
spike-notepad, spike-review, transpile, image-studio-worker). This was
re-added in BUG-S6-01 after Sprint 5 inadvertently dropped it.

**Action required (Cloudflare account level — not in repo):**
A Logpush *destination* must be configured for logs to be persisted beyond
the live `wrangler tail` window. Without a destination, `logpush = true`
on the worker only opts the worker in — Cloudflare still needs somewhere
to ship the logs.

Options:
1. **Workers Logs (recommended for ops):** Enable in the Cloudflare
   dashboard under *Workers & Pages -> [worker] -> Logs*. No destination
   needed — Cloudflare retains logs for the configured window. See
   <https://developers.cloudflare.com/workers/observability/logs/workers-logs/>.
2. **Logpush job to R2:** Create a Logpush job pointing at an R2 bucket
   (e.g. `spike-worker-logs`) for long-term retention. See
   <https://developers.cloudflare.com/logs/get-started/enable-destinations/r2/>.
3. **External sink (Datadog, BetterStack, etc.):** Logpush job pointing
   at an HTTP endpoint with credentials.

**To verify logs are flowing:**
1. `npx wrangler tail spike-edge --format pretty` — should stream live.
2. In dashboard: *Workers & Pages -> spike-edge -> Logs* — should show
   recent invocations once Workers Logs or a Logpush job is active.

**If logs are missing in production:** Confirm `logpush = true` is still
present in the worker's `wrangler.toml` *and* that a destination is
configured at the account level. The repo controls #1; a human with
Cloudflare account access controls #2.