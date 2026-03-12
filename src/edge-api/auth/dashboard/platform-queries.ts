interface PaginationOpts {
  page?: number;
  limit?: number;
}

export async function getApiKeys(db: D1Database, opts: PaginationOpts) {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 25;
  const offset = (page - 1) * limit;

  const result = await db
    .prepare(
      `SELECT k.id, k.name, k.user_id, k.key_hash, k.last_used_at, k.expires_at, k.created_at,
              u.email as user_email, u.name as user_name
       FROM api_keys k
       LEFT JOIN users u ON k.user_id = u.id
       ORDER BY k.created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .bind(limit, offset)
    .all();

  const total = await db.prepare("SELECT COUNT(*) as c FROM api_keys").first<{ c: number }>();

  return {
    keys: result.results ?? [],
    total: total?.c ?? 0,
    page,
    limit,
  };
}

export async function revokeApiKey(db: D1Database, id: string) {
  await db.prepare("DELETE FROM api_keys WHERE id = ?").bind(id).run();
}

export async function getOAuthClients(db: D1Database) {
  const clients = await db
    .prepare(
      `SELECT c.id, c.name, c.scope, c.created_at,
              (SELECT COUNT(*) FROM oauth_access_tokens t WHERE t.client_id = c.id AND t.revoked_at IS NULL) as active_tokens
       FROM oauth_clients c
       ORDER BY c.created_at DESC`,
    )
    .all();

  return clients.results ?? [];
}

export async function getDeviceAuthCodes(db: D1Database, opts: PaginationOpts) {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 25;
  const offset = (page - 1) * limit;
  const now = Math.floor(Date.now() / 1000);

  const result = await db
    .prepare(
      `SELECT d.id, d.user_code, d.device_code, d.scope, d.client_id, d.approved, d.expires_at, d.created_at,
              u.email as user_email, u.name as user_name
       FROM device_auth_codes d
       LEFT JOIN users u ON d.user_id = u.id
       WHERE d.expires_at > ?
       ORDER BY d.created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .bind(now, limit, offset)
    .all();

  return { codes: result.results ?? [], page, limit };
}
