/**
 * @spike-land-ai/block-sdk
 *
 * Full-stack block SDK — defineBlock(), StorageAdapter, React bindings, MCP integration.
 *
 * A "block" packages storage schema + business logic + UI components + MCP tools
 * into a single composable unit that deploys to CF Workers OR bundles into a
 * self-contained HTML file with IndexedDB.
 */

// Core
export { defineBlock } from "../lazy-imports/define-block.js";
export type {
  Block,
  BlockComponents,
  BlockContext,
  BlockDefinition,
  BlockProcedureContext,
} from "../lazy-imports/define-block.js";

// Schema DSL
export { defineTable, schemaToSQL, schemaTableNames, t, tableToSQL } from "./types.js";
export type {
  ColumnBuilder,
  ColumnDef,
  ColumnType,
  IndexDef,
  SchemaDef,
  TableDef,
} from "./types.js";

// Storage interfaces
export type {
  BlobAdapter,
  KVAdapter,
  QueryResult,
  Row,
  SQLAdapter,
  StorageAdapter,
  StorageAdapterConfig,
} from "./types-block-sdk.js";

// Memory adapter (testing)
export { createMemoryAdapter } from "./memory.js";
