/**
 * Shared internal service authentication helper.
 *
 * Validates X-Internal-Secret header against the INTERNAL_SERVICE_SECRET env var.
 * Used to protect admin/internal read endpoints from public access (OWASP API7).
 */

import { constantTimeEquals } from "../../common/core-logic/security-utils";

export function requireInternalSecret(
  env: { INTERNAL_SERVICE_SECRET?: string },
  req: { header: (name: string) => string | undefined },
): boolean {
  const secret = req.header("x-internal-secret");
  return (
    typeof secret === "string" &&
    secret.length > 0 &&
    typeof env.INTERNAL_SERVICE_SECRET === "string" &&
    env.INTERNAL_SERVICE_SECRET.length > 0 &&
    constantTimeEquals(secret, env.INTERNAL_SERVICE_SECRET)
  );
}
