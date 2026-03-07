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
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// ─── McpError ─────────────────────────────────────────────────────────────────
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
export class McpError extends Error {
  code;
  retryable;
  cause;
  constructor(code, message, retryable = false, cause) {
    super(message);
    this.name = "McpError";
    this.code = code;
    this.retryable = retryable;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}
// ─── Result Helpers ───────────────────────────────────────────────────────────
/**
 * Build a successful text result, truncating at 8 192 chars to avoid
 * overwhelming the LLM context window.
 */
export function textResult(text) {
  const MAX = 8_192;
  const truncated = text.length > MAX ? text.slice(0, MAX) + "\n...(truncated)" : text;
  return { content: [{ type: "text", text: truncated }] };
}
/**
 * Build a successful result from any JSON-serialisable value.
 * Pretty-prints with 2-space indentation.
 */
export function jsonResult(data) {
  return textResult(JSON.stringify(data, null, 2));
}
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
export function errorResult(code, message, retryable = false) {
  return {
    content: [
      {
        type: "text",
        text: `**Error: ${code}**\n${message}\n**Retryable:** ${retryable}`,
      },
    ],
    isError: true,
  };
}
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
export function formatError(err) {
  if (err instanceof McpError) {
    return errorResult(err.code, err.message, err.retryable);
  }
  const message = err instanceof Error ? err.message : String(err);
  return errorResult("INTERNAL_ERROR", message, false);
}
export function ok(data) {
  return {
    ok: true,
    data,
    unwrap: () => data,
    map: (fn) => ok(fn(data)),
    flatMap: (fn) => fn(data),
  };
}
export function fail(error) {
  return {
    ok: false,
    error,
    unwrap: () => {
      throw error;
    },
    map: () => fail(error),
    flatMap: () => fail(error),
  };
}
/**
 * Async wrapper — returns `Result<T>` with `ok` discriminant.
 *
 * ```ts
 * const result = await tryCatch(fetchSomething());
 * if (!result.ok) return errorResult("FETCH_FAILED", result.error.message);
 * return jsonResult(result.data);
 * ```
 */
export async function tryCatch(promise) {
  try {
    const data = await promise;
    return ok(data);
  } catch (err) {
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
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
export function wrapServerWithLogging(server, serverName, onLog) {
  const originalTool = server.tool.bind(server);
  // McpServer.tool() has multiple overloads. We intercept by wrapping the
  // function itself and detecting the handler (last argument that's a function).
  server.tool = (...args) => {
    // Find the handler — it's always the last function argument
    const handlerIdx = args.findIndex((a, i) => typeof a === "function" && i === args.length - 1);
    if (handlerIdx === -1) {
      // No handler found — pass through unchanged
      return originalTool(...args);
    }
    const toolName = typeof args[0] === "string" ? args[0] : "unknown";
    const originalHandler = args[handlerIdx];
    const wrappedHandler = async (...handlerArgs) => {
      const start = Date.now();
      let outcome = "success";
      try {
        const result = await originalHandler(...handlerArgs);
        if (result && typeof result === "object" && "isError" in result && result.isError) {
          outcome = "error";
        }
        return result;
      } catch (err) {
        outcome = "error";
        throw err;
      } finally {
        const durationMs = Date.now() - start;
        const entry = {
          server: serverName,
          tool: toolName,
          durationMs,
          outcome,
        };
        if (onLog) {
          onLog(entry);
        } else {
          console.error(`[mcp-analytics] ${serverName}/${toolName} ${outcome} ${durationMs}ms`);
        }
      }
    };
    const newArgs = [...args];
    newArgs[handlerIdx] = wrappedHandler;
    return originalTool(...newArgs);
  };
}
// ─── Server Factory ───────────────────────────────────────────────────────────
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
export function createMcpServer(config) {
  return new McpServer({
    name: config.name,
    version: config.version,
  });
}
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
export async function startMcpServer(server) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
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
export function createZodTool(server, options) {
  const { name, description, schema, handler } = options;
  // server.tool() uses complex conditional types (ToolCallback<TSchema>) that
  // cannot be directly satisfied by our simplified handler signature. At runtime
  // the callback receives a plain object for args; the two-step cast through
  // unknown is safe and semantically correct.
  const wrappedHandler = async (args) => {
    try {
      return await handler(args);
    } catch (err) {
      return formatError(err);
    }
  };
  server.tool(name, description, schema, wrappedHandler);
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
export function createMockServer() {
  const handlers = new Map();
  const tool = (name, _description, _schema, handler) => {
    handlers.set(name, handler);
  };
  const call = async (name, args = {}) => {
    const handler = handlers.get(name);
    if (!handler) {
      throw new Error(`Tool "${name}" not registered on mock server`);
    }
    return handler(args);
  };
  return { tool, handlers, call };
}
export function createMockRegistry() {
  const handlers = new Map();
  const register = (def) => {
    handlers.set(def.name, def.handler);
  };
  const call = async (name, args = {}) => {
    const handler = handlers.get(name);
    if (!handler) {
      throw new Error(`Mock tool handler not found for "${name}"`);
    }
    return handler(args);
  };
  return { register, handlers, call };
}
// ─── Convenience re-exports ───────────────────────────────────────────────────
/**
 * Extract the text from the first content item of a tool result.
 * Useful in tests:
 * ```ts
 * expect(getText(result)).toContain("success");
 * ```
 */
export function getText(result) {
  return result.content[0]?.text ?? "";
}
/**
 * True if the tool result represents an error.
 */
export function isErrorResult(result) {
  return result.isError === true;
}
// ─── Feedback & Error Shipper ────────────────────────────────────────────────
export * from "./feedback.js";
export * from "./error-shipper.js";
//# sourceMappingURL=index.js.map
