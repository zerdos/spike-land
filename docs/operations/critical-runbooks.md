# Critical Operations Runbook

## 1. Production Deployment Failure
**Symptom:** The latest release causes 5xx errors or breaks core functionality.
**Immediate Mitigation (Rollback):**

Use the automated rollback script. It resolves the previous deployment for you,
prints a plan, and prompts for confirmation before touching production. See
[`docs/operations/ROLLBACK.md`](./ROLLBACK.md) for full details.

```bash
# Ensure CLOUDFLARE_API_TOKEN is exported (Workers Scripts: Edit permission).
# Roll back a single worker to its previous deployment:
./.github/scripts/rollback-workers.sh --worker spike-edge

# Roll back every worker (wave 2 first, then wave 1), unattended:
./.github/scripts/rollback-workers.sh --worker all --yes

# Roll back to a specific version id:
./.github/scripts/rollback-workers.sh --worker mcp-auth --version <deployment-id>
```

Manual fallback if the script is unavailable:

1. Authenticate to Cloudflare: `npx wrangler login` (use company credentials).
2. `cd packages/<pkg>` for the affected worker.
3. List recent deployments: `npx wrangler deployments list`
4. Roll back: `npx wrangler rollback <deployment-id> --message "manual rollback"`

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