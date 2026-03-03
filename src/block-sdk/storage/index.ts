/**
 * Storage module — adapter interfaces and implementations.
 */

export type {
  BlobAdapter,
  KVAdapter,
  QueryResult,
  Row,
  SQLAdapter,
  StorageAdapter,
  StorageAdapterConfig,
} from "./types.js";

export { createMemoryAdapter } from "./memory.js";
