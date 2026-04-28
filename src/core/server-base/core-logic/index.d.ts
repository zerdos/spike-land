/**
 * @spike-land-ai/mcp-server-base
 *
 * Shared base utilities for @spike-land-ai MCP server packages.
 *
 * Extracted from common patterns in:
 *  - src/esbuild-wasm-mcp
 *  - src/hackernews-mcp
 *  - src/mcp-nanobanana
 *  - src/openclaw-mcp
 *  - src/spike-review
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type {
  ZodRawShapeCompat,
  ShapeOutput,
} from "@modelcontextprotocol/sdk/server/zod-compat.js";
/**
 * Standard MCP tool result content item.
 */
export interface McpTextContent {
  type: "text";
  text: string;
}
/**
 * Standard MCP tool call result shape, compatible with all existing packages.
 */
export interface CallToolResult {
  [x: string]: unknown;
  content: McpTextContent[];
  isError?: boolean;
}
/**
 * Configuration for createMcpServer.
 */
export interface McpServerConfig {
  /** Server name reported during MCP handshake. */
  name: string;
  /** Semantic version string (e.g. "1.0.0"). */
  version: string;
}
/**
 * Standard error class for MCP tool handlers.
 *
 * Carry a `code` string (e.g. "NOT_FOUND", "INVALID_INPUT") and a
 * `retryable` flag so callers can decide how to present the failure.
 *
 * Usage:
 * ```ts
 * throw new McpError("AUTH_REQUIRED", "You must be logged in first");
 * ```
 */
export declare class McpError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly cause?: Error;
  constructor(code: string, message: string, retryable?: boolean, cause?: Error);
}
/**
 * Build a successful text result, truncating at 8 192 chars to avoid
 * overwhelming the LLM context window.
 */
export declare function textResult(text: string): CallToolResult;
/**
 * Build a successful result from any JSON-serialisable value.
 * Pretty-prints with 2-space indentation.
 */
export declare function jsonResult(data: unknown): CallToolResult;
/**
 * Build a standard error result.
 *
 * The `code` should be a SCREAMING_SNAKE_CASE identifier, e.g. "NOT_FOUND".
 * The rendered text matches the format used across existing packages:
 *
 * ```
 * **Error: NOT_FOUND**
 * The requested item does not exist.
 * **Retryable:** false
 * ```
 */
export declare function errorResult(
  code: string,
  message: string,
  retryable?: boolean,
): CallToolResult;
/**
 * Convert any caught value into a standard error CallToolResult.
 *
 * - If the value is an `McpError`, the code and retryable flag are preserved.
 * - Otherwise a generic `INTERNAL_ERROR` code is used.
 *
 * Usage inside a tool handler:
 * ```ts
 * try {
 *   // ...
 * } catch (err: unknown) {
 *   return formatError(err);
 * }
 * ```
 */
export declare function formatError(err: unknown): CallToolResult;
/**
 * Discriminated union for functional error handling.
 *
 * Use `ok(data)` to create a success, `fail(error)` for a failure, and
 * `tryCatch(promise)` to wrap any async call.
 */
export type Result<T> =
  | {
      ok: true;
      data: T;
      error?: never;
      unwrap(): T;
      map<U>(fn: (val: T) => U): Result<U>;
      flatMap<U>(fn: (val: T) => Result<U>): Result<U>;
    }
  | {
      ok: false;
      data?: never;
      error: Error;
      unwrap(): never;
      map<U>(fn: (val: T) => U): Result<U>;
      flatMap<U>(fn: (val: T) => Result<U>): Result<U>;
    };
export declare function ok<T>(data: T): Result<T>;
export declare function fail<T = never>(error: Error): Result<T>;
/**
 * Async wrapper — returns `Result<T>` with `ok` discriminant.
 *
 * ```ts
 * const result = await tryCatch(fetchSomething());
 * if (!result.ok) return errorResult("FETCH_FAILED", result.error.message);
 * return jsonResult(result.data);
 * ```
 */
export declare function tryCatch<T>(promise: Promise<T>): Promise<Result<T>>;
export interface ToolCallLogEntry {
  server: string;
  tool: string;
  durationMs: number;
  outcome: "success" | "error";
}
/**
 * Wrap an McpServer so that every `tool()` registration gets timing/outcome
 * logging to stderr. Useful for stdio-based Node.js MCP servers that don't
 * have a network endpoint to write analytics to.
 *
 * Call this **before** registering any tools:
 * ```ts
 * const server = createMcpServer({ name: "my-mcp", version: "1.0.0" });
 * wrapServerWithLogging(server, "my-mcp");
 * registerMyTools(server);
 * ```
 */
export declare function wrapServerWithLogging(
  server: McpServer,
  serverName: string,
  onLog?: (entry: ToolCallLogEntry) => void,
): void;
/**
 * Create a pre-configured `McpServer` instance.
 *
 * This is a thin wrapper that standardises how servers are instantiated across
 * all MCP packages.  Call `server.tool(...)` to register tools, then call
 * `startMcpServer(server)` (or connect to a custom transport).
 *
 * ```ts
 * const server = createMcpServer({ name: "my-mcp", version: "1.0.0" });
 * registerMyTool(server);
 * await startMcpServer(server);
 * ```
 */
export declare function createMcpServer(config: McpServerConfig): McpServer;
/**
 * Connect the server to stdio and await the connection.
 *
 * This is the standard startup sequence used by all existing MCP packages in
 * this org:
 * ```ts
 * const transport = new StdioServerTransport();
 * await server.connect(transport);
 * ```
 */
export declare function startMcpServer(server: McpServer): Promise<void>;
/**
 * Infer the validated argument type from a Zod raw shape.
 * This allows handler functions to receive fully-typed arguments instead of
 * `Record<string, unknown>`.
 */
export type InferZodArgs<TSchema extends ZodRawShapeCompat> = ShapeOutput<TSchema>;
/**
 * Options accepted by `createZodTool`.
 *
 * The `schema` is a plain Zod shape object (i.e. `{ key: z.string(), ... }`).
 * The `handler` receives already-validated, fully-typed arguments and must
 * return a `CallToolResult`. Any thrown value is caught and converted to an
 * error result automatically.
 *
 * @template TSchema - Zod raw shape type, constrained to `ZodRawShapeCompat`
 */
export interface ZodToolOptions<TSchema extends ZodRawShapeCompat = ZodRawShapeCompat> {
  /** Tool name as registered with the MCP server. */
  name: string;
  /** Human-readable description shown to the LLM. */
  description: string;
  /**
   * Zod schema object — the same plain shape passed to `server.tool()` in
   * every existing MCP package, e.g.
   * ```ts
   * { query: z.string().describe("Search query"), limit: z.number().default(10) }
   * ```
   */
  schema: TSchema;
  /**
   * Tool handler. Receives the validated, typed arguments inferred from `schema`.
   * Return a `CallToolResult` or throw an `McpError` / any `Error`.
   * Uncaught errors are automatically converted to error results via `formatError`.
   */
  handler: (args: InferZodArgs<TSchema>) => Promise<CallToolResult> | CallToolResult;
}
/**
 * Register a Zod-validated tool on an `McpServer`.
 *
 * This is a thin wrapper around `server.tool()` that adds automatic error
 * handling: any thrown value (including `McpError`) is caught and returned
 * as a standard error `CallToolResult` instead of crashing the server process.
 *
 * ```ts
 * createZodTool(server, {
 *   name: "my_tool",
 *   description: "Does the thing",
 *   schema: { query: z.string().describe("Search query") },
 *   async handler({ query }) {
 *     const result = await doThing(String(query));
 *     return jsonResult(result);
 *   },
 * });
 * ```
 */
export declare function createZodTool<TSchema extends ZodRawShapeCompat = ZodRawShapeCompat>(
  server: McpServer,
  options: ZodToolOptions<TSchema>,
): void;
/**
 * Type signature for any registered tool handler (used by test utilities).
 */
export type ToolHandler = (
  args: Record<string, unknown>,
) => Promise<CallToolResult> | CallToolResult;
/**
 * A mock MCP server that captures registered tool handlers for unit testing.
 *
 * This mirrors the pattern found in `hackernews-mcp` and `mcp-nanobanana`.
 */
export interface MockMcpServer {
  /** Spy on tool registrations. */
  tool: (
    name: string,
    description: string,
    schema: ZodRawShapeCompat,
    handler: ToolHandler,
  ) => void;
  /** Map of tool name → handler, populated by `tool()` calls. */
  handlers: Map<string, ToolHandler>;
  /**
   * Invoke a registered tool handler by name.
   * Throws if no handler has been registered under `name`.
   */
  call: (name: string, args?: Record<string, unknown>) => Promise<CallToolResult>;
}
/**
 * Create a mock MCP server suitable for unit tests.
 *
 * Usage:
 * ```ts
 * import { createMockServer } from "@spike-land-ai/mcp-server-base/testing";
 *
 * const server = createMockServer();
 * registerMyTool(server as unknown as McpServer);
 *
 * const result = await server.call("my_tool", { query: "hello" });
 * expect(result.isError).toBe(false);
 * ```
 */
export declare function createMockServer(): MockMcpServer;
/**
 * A lightweight tool registry used by mcp-nanobanana-style packages that keep
 * their own `register()` pattern separate from the `McpServer`.
 */
export interface ToolDefinition<TInput = unknown> {
  name: string;
  description: string;
  handler: (input: TInput) => Promise<CallToolResult> | CallToolResult;
}
export interface ToolRegistry {
  register: <T = unknown>(def: ToolDefinition<T>) => void;
}
/**
 * Create a mock tool registry (used by packages that pass a registry around
 * rather than calling `server.tool()` directly, e.g. mcp-nanobanana).
 *
 * ```ts
 * const registry = createMockRegistry();
 * registerMyTools(registry);
 * const result = await registry.call("my_tool", { id: "abc" });
 * ```
 */
export interface MockRegistry extends ToolRegistry {
  handlers: Map<
    string,
    (args: Record<string, unknown>) => Promise<CallToolResult> | CallToolResult
  >;
  call: (name: string, args?: Record<string, unknown>) => Promise<CallToolResult>;
}
export declare function createMockRegistry(): MockRegistry;
/**
 * Extract the text from the first content item of a tool result.
 * Useful in tests:
 * ```ts
 * expect(getText(result)).toContain("success");
 * ```
 */
export declare function getText(result: CallToolResult): string;
/**
 * True if the tool result represents an error.
 */
export declare function isErrorResult(result: CallToolResult): boolean;
export * from "./feedback.js";
export * from "./error-shipper.js";
export * from "./chat-notify.js";
//# sourceMappingURL=index.d.ts.map
