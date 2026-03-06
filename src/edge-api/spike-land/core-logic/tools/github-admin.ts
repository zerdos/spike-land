/**
 * GitHub Admin MCP Tools (CF Workers)
 *
 * Repository administration, branch protection, and team management via GitHub API.
 * Requires GH_PAT_TOKEN environment binding.
 */

import type { ToolRegistry } from "../../lazy-imports/registry";
import type { DrizzleDB } from "../../db/db/db-index.ts";

export function registerGitHubAdminTools(
  _registry: ToolRegistry,
  _userId: string,
  _db: DrizzleDB,
): void {
  // Not yet migrated — requires GH_PAT_TOKEN binding in wrangler.toml
}
