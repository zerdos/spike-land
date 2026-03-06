/**
 * Communication MCP Tools (CF Workers)
 *
 * Email, newsletter, and notification tools.
 * Not yet fully migrated from spike.land (requires email service adapter).
 */

import type { ToolRegistry } from "../../lazy-imports/registry";
import type { DrizzleDB } from "../../db/db/db-index.ts";

export function registerEmailTools(_registry: ToolRegistry, _userId: string, _db: DrizzleDB): void {
  // Not yet migrated — requires email service adapter
}

export function registerNewsletterTools(
  _registry: ToolRegistry,
  _userId: string,
  _db: DrizzleDB,
): void {
  // Not yet migrated — requires email service adapter
}

export function registerNotificationsTools(
  _registry: ToolRegistry,
  _userId: string,
  _db: DrizzleDB,
): void {
  // Not yet migrated — requires push/email notification adapter
}
