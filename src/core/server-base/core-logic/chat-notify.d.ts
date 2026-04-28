import type { ChatClientConfig, ChatMessage } from "../../chat-client/core-logic/types.js";
/**
 * Configuration for the chat notification system.
 * Extends `ChatClientConfig` with MCP-server-specific options.
 */
export interface ChatNotifyConfig extends ChatClientConfig {
  /** Default channel to post to. Defaults to "mcp-events". */
  defaultChannel?: string;
  /** Server name prepended to every message as `[serverName] `. */
  serverName?: string;
  /**
   * When `true` (the default), errors from `postMessage` are swallowed and
   * written to stderr instead of being re-thrown.
   */
  silent?: boolean;
}
/**
 * Initialize the chat notification system.
 *
 * Call once at server startup before any tool handlers run.
 * If not called, `chatNotify` and `notifyToolResult` are no-ops.
 *
 * @example
 * ```ts
 * initChatNotify({
 *   apiKey: process.env.SPIKE_CHAT_API_KEY,
 *   serverName: "my-mcp",
 *   defaultChannel: "mcp-events",
 * });
 * ```
 */
export declare function initChatNotify(config: ChatNotifyConfig): void;
/**
 * Send a notification to a spike-chat channel.
 *
 * Returns `null` when `initChatNotify` has not been called.
 * On network errors the behaviour depends on `ChatNotifyConfig.silent`
 * (default: `true` — errors are swallowed and written to stderr).
 *
 * @param content - Message body.
 * @param opts    - Optional overrides for channel, content-type, and metadata.
 */
export declare function chatNotify(
  content: string,
  opts?: {
    /** Override the default channel for this single message. */
    channel?: string;
    /** MIME-style content type forwarded to spike-chat. Defaults to "text". */
    contentType?: string;
    /** Arbitrary metadata forwarded to spike-chat. */
    metadata?: Record<string, unknown>;
  },
): Promise<ChatMessage | null>;
/**
 * Notify about a tool execution result.
 *
 * Convenience wrapper that formats the tool name and outcome into a short
 * status line and delegates to `chatNotify`.
 *
 * @param toolName - The MCP tool name (e.g. `"search_hackernews"`).
 * @param outcome  - Whether the tool succeeded or failed.
 * @param detail   - Optional extra detail appended after `toolName`.
 *
 * @example
 * ```ts
 * await notifyToolResult("search_hackernews", "success", "10 results");
 * // Posts: "ok search_hackernews: 10 results"
 * ```
 */
export declare function notifyToolResult(
  toolName: string,
  outcome: "success" | "error",
  detail?: string,
): Promise<ChatMessage | null>;
//# sourceMappingURL=chat-notify.d.ts.map
