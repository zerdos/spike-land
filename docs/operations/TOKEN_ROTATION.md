# Token Rotation Runbook

> Owner: account holder (zoltan.erdos@spike.land) | Last drafted: 2026-04-17
> Related bugs: BUG-S6-13 (NPM_TOKEN), BUG-S6-14 (Cloudflare API token)

This runbook covers the **only two long-lived secrets** that gate CI/CD for the
`spike.land` monorepo. Both must be rotated by an account holder — the agent
that drafted this document does not have GitHub admin or Cloudflare dashboard
access.

After rotation, follow the **cleanup PR plan** in the appendix to remove the
`continue-on-error: true` workaround from the npm publish step.

---

## NPM_TOKEN Rotation (BUG-S6-13)

### Why this is broken

The current `NPM_TOKEN` secret in the GitHub repo is expired. Because npmjs.org
publishes are non-blocking for the rest of the platform (we publish to both
GitHub Packages and npmjs.org, and only GitHub Packages is consumed
internally), CI was patched with `continue-on-error: true` so a 401 from
npmjs.org would not fail the whole pipeline. The side effect is that **no
package has been published to npmjs.org since the token expired** and CI
silently succeeds.

### Where the token is used

- File: `.github/workflows/ci.yml`
- Step: `Publish to npmjs.org` (job: `publish`)
- Line range: `252-256`
- Env var name: `NPM_TOKEN` (consumed by `scripts/publish-changed.js --registry=npm`)

### Step 1 — Generate a new token on npmjs.org

1. Log in at https://www.npmjs.com/ as the org owner.
2. Click avatar → **Access Tokens**.
3. Click **Generate New Token** → choose **Granular Access Token** (preferred
   over the legacy Classic token).
4. Token settings:
   - **Token name**: `spike-land-ci-2026` (or current year for rotation history)
   - **Expiration**: 1 year (max allowed for granular tokens; calendar-reminder
     for rotation 2 weeks before expiry).
   - **Allowed IP ranges**: leave empty unless you set up a stable egress IP for
     GitHub Actions (rare; not required).
   - **Packages and scopes**:
     - **Read and write** access scoped to:
       - `@spike-land-ai/*`
       - `@spike.land/*` (only if any packages publish under this scope; a
         quick `grep -r '"name": "@spike.land/' packages/ src/` confirms.
         Currently the monorepo publishes only under `@spike-land-ai/*`, so
         this is optional / future-proofing.)
   - **Organizations**: select `spike-land-ai` for read access (so the token
     can resolve org metadata).
5. Click **Generate Token**, copy the value (begins with `npm_`).
   You will not be able to see it again.

### Step 2 — Set the secret in GitHub

Repository: `spike-land-ai/spike.land`

1. Go to **Settings** → **Secrets and variables** → **Actions** → **Secrets**
   tab.
2. Find the existing `NPM_TOKEN` entry → click **Update**.
   (If missing for some reason, click **New repository secret** and name it
   `NPM_TOKEN`.)
3. Paste the new token value → **Update secret**.

> Note on naming: the workflow uses `NPM_TOKEN` (line 256 of `ci.yml`). The
> `actions/setup-node` action also looks at `NODE_AUTH_TOKEN` when the
> registry-url is `https://registry.npmjs.org/`, but the publish step here
> calls a custom script that reads `NPM_TOKEN` directly. Do **not** also set
> `NODE_AUTH_TOKEN` to the npm value — `NODE_AUTH_TOKEN` is reserved for the
> GitHub Packages publish step and is set to `${{ secrets.GITHUB_TOKEN }}` on
> line 250.

### Step 3 — Org-level secret (sister repos)

If any sister repo under `github.com/spike-land-ai` also publishes to
npmjs.org under the `@spike-land-ai` scope, set the same token as an
**Organization secret**:

1. https://github.com/organizations/spike-land-ai/settings/secrets/actions
2. **New organization secret** → name `NPM_TOKEN` → value pasted →
   **Repository access**: "Selected repositories" and check the
   relevant repos.

This avoids re-pasting on every rotation.

### Step 4 — Verify

1. From the GitHub Actions UI: open the `ci.yml` workflow → **Run workflow**
   button → branch `main`. (If `workflow_dispatch` is not yet wired in, use
   any low-risk commit to `main` such as a docs change.)
2. Watch the `publish` job. The `Publish to npmjs.org` step should now exit
   with status 0 **and** print one or more `npm publish` lines that succeed
   with HTTP 200/201. (Note: with the workaround still present, the step
   masks failures; check the **logs**, not just the green checkmark.)
3. Confirm at https://www.npmjs.com/package/@spike-land-ai/<package> that the
   latest published version matches the head of `main`.

### Step 5 — Cleanup (after verification)

Land the cleanup PR described in the appendix to remove
`continue-on-error: true` so future expirations cause a hard failure (which
is what we want — silent failure is what got us here).

---

## Cloudflare API Token (BUG-S6-14)

### Why this is broken

The current `CLOUDFLARE_API_TOKEN` repo secret is the short-lived OAuth token
that `wrangler login` writes to `~/.wrangler/config/default.toml`. These tokens
expire ~1.5 hours after they are issued. As a result, `deploy-workers` and
related deploy jobs fail intermittently with `Authentication error [code:
10000]`. The fix is to mint a dedicated long-lived API token from the
Cloudflare dashboard.

### Where the token is used

All in `.github/workflows/ci.yml`:

| Job              | Step                                                 | Line  |
| ---------------- | ---------------------------------------------------- | ----- |
| `deploy-workers` | Validate Cloudflare token                            | 291   |
| `deploy-workers` | Apply D1 migrations                                  | 305   |
| `deploy-workers` | Seed blog posts to D1 and upload images to R2       | 311   |
| `deploy-workers` | Deploy wave 1: independent workers                  | 342   |
| `deploy-workers` | Deploy wave 2: dependent workers                    | 364   |
| `deploy-workers` | Purge Cloudflare cache after worker deploys         | 374   |
| `deploy-workers` | Deploy spike-app SPA                                | 382   |
| `deploy-workers` | (later step)                                         | 456   |

Also referenced by:

- `.github/scripts/rollback-workers.sh` (lines 17, 80-81) — relies on
  `CLOUDFLARE_API_TOKEN` being present in the environment.

### Step 1 — Create a Custom Token in Cloudflare

1. Log in at https://dash.cloudflare.com.
2. Go to **My Profile** → **API Tokens** → **Create Token**.
3. Choose **Create Custom Token** (do **not** use the "Edit Cloudflare
   Workers" preset — it is missing D1 and R2 permissions we need).
4. **Token name**: `spike-land-ci-2026` (year stamp for rotation tracking).
5. **Permissions** — add each row:

   | Type    | Resource                | Permission |
   | ------- | ----------------------- | ---------- |
   | Account | Workers Scripts         | Edit       |
   | Account | D1                      | Edit       |
   | Account | Workers KV Storage      | Edit       |
   | Account | Workers R2 Storage      | Edit       |
   | Account | Workers Tail            | Read       |
   | Zone    | Workers Routes          | Edit       |
   | Zone    | Cache Purge             | Purge      |

   Notes:
   - **Workers Tail: Read** is required if any workflow streams logs via
     `wrangler tail`. Currently optional for production deploys, but cheap to
     include.
   - **Workers Routes: Edit** is required because some workers
     (`spike-edge`, `spike-land-mcp`, `mcp-auth`) have zone-bound custom
     routes (e.g., `spike.land/api/*`). Without it, deploys updating route
     mappings fail with `code: 10000`.
   - **Cache Purge** is required for the `purge-cache.sh` step (line 372 of
     `ci.yml`).

6. **Account Resources**: include the `spike-land` Cloudflare account.
7. **Zone Resources**: include `spike.land` and any other zones served by
   the workers (`spikeland.workers.dev` is auto-managed and does not need
   explicit zone access).
8. **Client IP Address Filtering**: leave empty (GitHub Actions runners have
   no stable IP).
9. **TTL**: leave **Start Date** = today, **End Date** blank (no expiry).
   Cloudflare allows non-expiring API tokens — this is the intended
   long-lived credential. If org policy requires expiry, set **1 year max**
   and add a calendar reminder.
10. Click **Continue to summary** → **Create Token** → copy the token value.
    You will not be able to see it again.

### Step 2 — Verify the token via curl

Cloudflare provides a verify endpoint:

```bash
curl -sS -H "Authorization: Bearer <TOKEN>" \
     https://api.cloudflare.com/client/v4/user/tokens/verify | jq
```

Expected response:

```json
{
  "result": { "id": "...", "status": "active" },
  "success": true,
  "errors": [],
  "messages": [{ "code": 10000, "message": "This API Token is valid and active" }]
}
```

### Step 3 — Set the secret(s) in GitHub

Repository: `spike-land-ai/spike.land`

1. **Settings** → **Secrets and variables** → **Actions** → **Secrets** tab.
2. Update the existing `CLOUDFLARE_API_TOKEN` entry with the new token value.
3. If any older workflow uses the legacy alias `CF_API_TOKEN`, also create
   that secret with the same value (a quick `grep -r 'CF_API_TOKEN'
   .github/` shows it is currently **not** used in this repo, so this step
   is skippable today; check again before each rotation).
4. Confirm `CLOUDFLARE_ACCOUNT_ID` is set as a **repository variable** (not
   secret — it is non-sensitive). Today it is referenced from
   `secrets.CLOUDFLARE_ACCOUNT_ID` (line 263 of `ci.yml`); leaving it as a
   secret is fine but a follow-up task could move it to a Variable for
   cleanliness.

### Step 4 — Verify deploy

1. Trigger the workflow on `main` (push a no-op commit, or use
   `workflow_dispatch` if wired in).
2. Watch `deploy-workers` → "Validate Cloudflare token" step. It should
   print `Cloudflare token is set (length: 40)` (or whatever length the
   new token is).
3. Watch `Deploy wave 1: independent workers` → look for each
   `(cd packages/<worker> && npm run deploy)` to print
   `Successfully published your script` and a deployment ID.
4. In Cloudflare dashboard → **Workers & Pages** → confirm each worker's
   "Last deployed" timestamp matches the CI run.

### Step 5 — Optional hardening

- Add a calendar reminder to rotate every **6 months**.
- If an organization-level Cloudflare audit log alert can be configured,
  enable it for token use to detect unauthorized usage.
- Consider splitting the token into two: one with deploy-only permissions
  for `deploy-workers`, and a separate read-only token for tail/log
  workflows. Not required today; pure defense-in-depth.

---

## Appendix A — Cleanup PR plan (post-rotation)

Once **NPM_TOKEN** is verified working, land a small follow-up PR titled:

> `chore(ci): remove continue-on-error after NPM_TOKEN rotation`

### Exact files and lines to edit

**File**: `.github/workflows/ci.yml`

**Line 253** — remove this single line:

```yaml
        continue-on-error: true
```

Resulting step (lines 252-256) should read:

```yaml
      - name: Publish to npmjs.org
        run: node scripts/publish-changed.js --registry=npm
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Lines that must NOT be touched

The other `continue-on-error: true` in `ci.yml` is **unrelated** to BUG-S6-13:

- **Line 367** — `Warm prompt-driven blog hero images` — this is intentional.
  Hero-image warming is a best-effort cache priming step; failing it must
  not block a deploy. Leave it as-is. Document in the PR description so
  reviewers do not "helpfully" remove it.

### No Cloudflare cleanup required

There is no `continue-on-error: true` on any Cloudflare deploy step (verified
by audit). Once BUG-S6-14 is resolved by rotation, no code change is needed.

---

## Appendix B — Audit summary (as of 2026-04-17)

`continue-on-error: true` occurrences in `.github/`:

| File                              | Line | Step                                         | BUG ref     |
| --------------------------------- | ---- | -------------------------------------------- | ----------- |
| `.github/workflows/ci.yml`        | 253  | Publish to npmjs.org                         | BUG-S6-13   |
| `.github/workflows/ci.yml`        | 367  | Warm prompt-driven blog hero images          | (intentional) |

Cloudflare API token references in `.github/`:

| File                                        | Lines                                           |
| ------------------------------------------- | ----------------------------------------------- |
| `.github/workflows/ci.yml`                  | 285, 286, 289, 291, 305, 311, 342, 364, 374, 382, 456 |
| `.github/scripts/rollback-workers.sh`       | 17, 80, 81                                      |

NPM publish references in `.github/`:

| File                              | Lines     | Notes                                              |
| --------------------------------- | --------- | -------------------------------------------------- |
| `.github/workflows/ci.yml`        | 248-250   | GitHub Packages (uses `secrets.GITHUB_TOKEN`)      |
| `.github/workflows/ci.yml`        | 252-256   | npmjs.org (uses `secrets.NPM_TOKEN`) — **BUG-S6-13** |
