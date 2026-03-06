/**
 * GitHub Issue Search MCP Tools (CF Workers)
 *
 * Full-text search across GitHub issues and PRs via GitHub API.
 * Requires GH_PAT_TOKEN environment binding.
 */

import type { ToolRegistry } from "../../lazy-imports/registry";
import type { DrizzleDB } from "../../db/db/db-index.ts";

export function registerGitHubIssueSearchTools(
  _registry: ToolRegistry,
  _userId: string,
  _db: DrizzleDB,
): void {
  // Not yet migrated — requires GH_PAT_TOKEN binding in wrangler.toml
}
