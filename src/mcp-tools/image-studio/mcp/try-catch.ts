import type { ErrorCode } from "./types.js";

// Re-export Result<T>, ok, fail, tryCatch from the shared base package
export {
  fail,
  ok,
  type Result,
  tryCatch,
} from "@spike-land-ai/mcp-server-base";

/**
 * A standard domain error that can be caught by the ToolBuilder to return structured MCP errors.
 */
export class DomainError extends Error {
  public code: ErrorCode;
  public retryable: boolean;
  constructor(code: ErrorCode, message: string, retryable = false) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.retryable = retryable;
  }
}
