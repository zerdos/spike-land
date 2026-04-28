import { SpikeChatClient } from "../../chat-client/core-logic/client.js";
let sharedClient = null;
let sharedConfig = null;
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
export function initChatNotify(config) {
    sharedConfig = config;
    sharedClient = new SpikeChatClient(config);
}
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
export async function chatNotify(content, opts) {
    if (!sharedClient || !sharedConfig)
        return null;
    const channel = opts?.channel ?? sharedConfig.defaultChannel ?? "mcp-events";
    const serverTag = sharedConfig.serverName ? `[${sharedConfig.serverName}] ` : "";
    const silent = sharedConfig.silent !== false;
    try {
        const postOpts = { contentType: opts?.contentType ?? "text" };
        if (opts?.metadata !== undefined) {
            postOpts.metadata = opts.metadata;
        }
        return await sharedClient.postMessage(channel, `${serverTag}${content}`, postOpts);
    }
    catch (err) {
        if (!silent)
            throw err;
        console.error("[chatNotify]", err instanceof Error ? err.message : String(err));
        return null;
    }
}
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
export async function notifyToolResult(toolName, outcome, detail) {
    const icon = outcome === "success" ? "ok" : "ERR";
    const msg = detail ? `${icon} ${toolName}: ${detail}` : `${icon} ${toolName}`;
    return chatNotify(msg, {
        metadata: { tool: toolName, outcome },
    });
}
//# sourceMappingURL=chat-notify.js.map