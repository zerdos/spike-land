/**
 * Tool Module Discovery
 *
 * On CF Workers there is no filesystem scanning, so auto-discovery is
 * replaced by explicit registration in manifest.ts.
 *
 * This module defines the shared ToolModuleExport interface used by
 * both the manifest and any tool file that wants to export modules.
 */

import type { ToolRegistry } from "../../lazy-imports/registry";
import type { DrizzleDB } from "../../db/db/db-index.ts";

export interface ToolModuleExport {
  register: (registry: ToolRegistry, userId: string, db: DrizzleDB) => void;
  categories?: string[];
  condition?: () => boolean;
}

/** @deprecated Use {@link ToolModuleExport} instead — identical shape. */
export type ToolModuleEntry = ToolModuleExport;
