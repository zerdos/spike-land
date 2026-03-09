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