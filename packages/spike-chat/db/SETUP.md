# spike-chat D1 Setup Runbook

This document describes how to provision and migrate the `spike-chat` D1 database.

The database binding is declared in `packages/spike-chat/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "spike-chat"
database_id = "4e93ca4f-84d4-4c50-9e03-5356ee092981"
migrations_dir = "db/migrations"
```

If the `database_id` placeholder shows `RUN: wrangler d1 create ...` instead
of a real UUID, follow the **Create the database** section below first.

## 1. Create the database (one-time, requires Cloudflare account)

> An agent **cannot** run this — it must be executed by a human with valid
> Cloudflare credentials, since it provisions a real billable resource.

```bash
cd packages/spike-chat
wrangler d1 create spike-chat-db
```

`wrangler` will print a `database_id`. Copy that UUID into `wrangler.toml`
(replacing the `RUN: ...` template comment, if present).

## 2. Apply migrations locally

This runs migrations against the `.wrangler/state/` SQLite file used by
`wrangler dev`:

```bash
cd packages/spike-chat
wrangler d1 migrations apply spike-chat-db --local
```

## 3. Apply migrations in production

```bash
cd packages/spike-chat
wrangler d1 migrations apply spike-chat-db --remote
```

This applies any pending files in `packages/spike-chat/db/migrations/` to the
live D1 database identified by `database_id` in `wrangler.toml`.

## 4. Verify the schema

After applying, run the included sanity check:

```bash
bash packages/spike-chat/scripts/verify-d1.sh
```

It runs `wrangler d1 execute spike-chat-db --command "SELECT name FROM sqlite_master WHERE type='table'"`
and asserts the expected tables exist.

## Schema source of truth

The drizzle schema lives at `src/edge-api/spike-chat/db/schema.ts`. The
`packages/spike-chat/db/migrations/` files are an idempotent mirror used by
the deploy-shim worker, and are kept in sync with the drizzle-generated
migrations under `src/edge-api/spike-chat/db/migrations/`.

When changing the schema:

1. Edit `src/edge-api/spike-chat/db/schema.ts`.
2. Regenerate drizzle migration: `npx drizzle-kit generate` from
   `src/edge-api/spike-chat/`.
3. Add a corresponding `IF NOT EXISTS` SQL migration under
   `packages/spike-chat/db/migrations/` with the next sequential prefix
   (e.g., `0002_<change>.sql`).
4. Apply locally then remotely (steps 2 and 3 above).

## Tables provisioned by `0001_initial.sql`

| Table             | Purpose                                                |
| ----------------- | ------------------------------------------------------ |
| `channels`        | Channel definitions (public/private/dm)                |
| `channel_members` | Membership and per-user notification prefs             |
| `messages`        | Channel and thread messages                            |
| `read_cursors`    | Per-user/channel last-read marker (BUG-S6-08)          |
| `bookmarks`       | Per-user saved messages with optional note (S6-08)     |
| `pins`            | Pinned messages per channel (S6-08)                    |
| `reactions`       | Emoji reactions on messages (S6-08)                    |
| `webhooks`        | Inbound/outbound webhook integrations                  |
| `agent_profiles`  | Agent (bot) identity registry                          |
| `slash_commands`  | Workspace-scoped slash command bindings                |

`presence` is held in the `PRESENCE_DO` Durable Object (not D1). `threads`
are modeled via `messages.threadId` (not a separate table).

## Troubleshooting

- **"D1_ERROR: no such table"** — migrations have not been applied to the
  current environment. Run step 2 (local) or step 3 (remote).
- **"database_id is empty / TO_BE_CREATED"** — the database was never
  created against this Cloudflare account. Run step 1.
- **Drift between drizzle and `0001_initial.sql`** — regenerate per the
  "Schema source of truth" section above.
