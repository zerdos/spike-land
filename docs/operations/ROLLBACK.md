# Worker Rollback

Automated rollback for Cloudflare Workers in this monorepo using
`.github/scripts/rollback-workers.sh`.

## When to use

- A production deploy is causing 5xx errors, broken core flows, or regressions.
- A staged rollout needs to be reverted to the previous known-good version.
- Status / smoke tests fail immediately after a deploy.

The script is **safe by default**: it always prints a plan first and prompts
for `y/N` before touching production. Pass `--yes` only when you have already
reviewed the plan (or when running unattended in CI).

## Prerequisites

- `bash` (3.2+ — works on macOS default and CI bash 5)
- [`jq`](https://stedolan.github.io/jq/) on `PATH` (parses
  `wrangler deployments list --json`)
- `npx` + `wrangler` (installed via the workspace devDependencies)
- `CLOUDFLARE_API_TOKEN` env var with **Workers Scripts: Edit** permission for
  every targeted worker. Use the permanent API token from
  <https://dash.cloudflare.com/profile/api-tokens>, not a temporary
  `wrangler login` session.

## Usage

```text
rollback-workers.sh --worker <name|all> [--version <id>] [--yes]
```

| Flag                  | Description                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `--worker <name|all>` | Wrangler service name (the `name = "..."` in `packages/<pkg>/wrangler.toml`) or `all`.     |
| `--version <id>`      | Optional explicit deployment id. Defaults to the deployment immediately before the current. |
| `--yes`               | Skip the `y/N` confirmation. Required for unattended use.                                  |
| `-h`, `--help`        | Print help and exit.                                                                       |

### Worker name -> package directory

| Wrangler name      | Package directory               |
| ------------------ | ------------------------------- |
| `esbuild`          | `packages/transpile`            |
| `mcp-auth`         | `packages/mcp-auth`             |
| `spike-land-mcp`   | `packages/spike-land-mcp`       |
| `spike-review`     | `packages/spike-review`         |
| `image-studio-mcp` | `packages/image-studio-worker`  |
| `spike-chat`       | `packages/spike-chat`           |
| `spike-notepad`    | `packages/spike-notepad`        |
| `spike-land`       | `packages/spike-land-backend`   |
| `spike-edge`       | `packages/spike-edge`           |

When the script adds a new worker, update the `WORKER_NAMES` / `WORKER_DIRS`
arrays at the top of the script and the table above.

## Examples

Roll back a single worker to its previous deployment (interactive prompt):

```bash
.github/scripts/rollback-workers.sh --worker spike-edge
```

Roll back every worker (wave 2 first, then wave 1) without prompting:

```bash
.github/scripts/rollback-workers.sh --worker all --yes
```

Roll back one worker to a specific version id (e.g., picked from
`npx wrangler deployments list`):

```bash
.github/scripts/rollback-workers.sh \
  --worker mcp-auth \
  --version 7c3f8a4e-2b1d-4d5a-9e1f-0c8b7d6e5f4a
```

## What the script does

1. Validates required commands (`jq`, `npx`) and `CLOUDFLARE_API_TOKEN`.
2. Resolves the package directory for each target worker.
3. For each worker, runs `npx wrangler deployments list --json` in its
   package directory and parses the result with `jq`. Index `0` is the
   current deployment, index `1` is the previous deployment (the rollback
   target).
4. Prints the full plan: `WORKER  DIR  CURRENT  ->  TARGET`.
5. Prompts `Proceed with rollback? [y/N]` unless `--yes` was passed.
6. For each worker, runs:
   ```bash
   npx wrangler rollback <target-id> \
     --message "automated rollback via rollback-workers.sh"
   ```
7. Prints a final summary listing succeeded / failed workers.

When `--worker all` is used, workers are rolled back in **reverse deploy
order** (wave 2 first, then wave 1) so we never leave a new wave-2 worker
pointing at an old wave-1 dependency.

## Exit codes

| Code | Meaning                                                           |
| ---- | ----------------------------------------------------------------- |
| `0`  | All targeted rollbacks succeeded.                                 |
| `1`  | Argument / environment error, or one or more rollbacks failed.    |
| `2`  | User declined the confirmation prompt.                            |

## Recovery if the script itself fails

Every step is idempotent and the rollback target is logged before execution.
If the script aborts mid-run, you can manually reproduce a single worker
rollback:

```bash
cd packages/<dir>
npx wrangler deployments list --json | jq -r '.[1].id'   # find target
npx wrangler rollback <target-id> --message "manual rollback"
```

Then re-run the script for the remaining workers, or pass `--worker <name>`
for each remaining service.

## Related runbooks

- `docs/operations/critical-runbooks.md` — incident response index (this is
  the rollback section).
- `.github/scripts/smoke-test.sh` — run after a rollback to confirm
  recovery.
