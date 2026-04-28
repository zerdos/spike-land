const DEFAULT_BASE_URL = "https://chat.spike.land";
const RECONNECT_DELAY_MS = 3000;
/**
 * Typed client for the spike-chat REST and WebSocket API.
 *
 * @example
 * ```ts
 * const client = new SpikeChatClient({ apiKey: process.env.AGENT_API_KEY });
 * const messages = await client.listMessages("app-my-app");
 * ```
 */
export class SpikeChatClient {
    baseUrl;
    fetchImpl;
    defaultHeaders;
    constructor(config = {}) {
        this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
        this.fetchImpl = config.fetch ?? globalThis.fetch.bind(globalThis);
        this.defaultHeaders = {
            "Content-Type": "application/json",
        };
        if (config.apiKey) {
            this.defaultHeaders["Authorization"] = `Bearer ${config.apiKey}`;
        }
        if (config.agentId) {
            this.defaultHeaders["x-agent-id"] = config.agentId;
        }
    }
    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------
    buildUrl(path, params) {
        const url = new URL(`${this.baseUrl}${path}`);
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined) {
                    url.searchParams.set(key, value);
                }
            }
        }
        return url.toString();
    }
    async request(path, init) {
        const url = this.buildUrl(path);
        const res = await this.fetchImpl(url, {
            ...init,
            headers: {
                ...this.defaultHeaders,
                ...init?.headers,
            },
        });
        if (!res.ok) {
            const body = await res.text().catch(() => "");
            throw new Error(`spike-chat ${res.status} ${res.statusText}: ${body}`);
        }
        // 204 No Content or empty body
        const text = await res.text();
        if (!text)
            return undefined;
        return JSON.parse(text);
    }
    async requestWithParams(path, params, init) {
        const url = this.buildUrl(path, params);
        const res = await this.fetchImpl(url, {
            ...init,
            headers: {
                ...this.defaultHeaders,
                ...init?.headers,
            },
        });
        if (!res.ok) {
            const body = await res.text().catch(() => "");
            throw new Error(`spike-chat ${res.status} ${res.statusText}: ${body}`);
        }
        const text = await res.text();
        if (!text)
            return undefined;
        return JSON.parse(text);
    }
    // ---------------------------------------------------------------------------
    // Channel methods
    // ---------------------------------------------------------------------------
    /**
     * List all channels in a workspace.
     */
    listChannels(workspaceId) {
        return this.requestWithParams("/api/v1/channels", { workspaceId });
    }
    /**
     * Create a new channel.
     */
    createChannel(opts) {
        return this.request("/api/v1/channels", {
            method: "POST",
            body: JSON.stringify(opts),
        });
    }
    /**
     * Get a single channel by ID.
     */
    getChannel(id) {
        return this.request(`/api/v1/channels/${encodeURIComponent(id)}`);
    }
    /**
     * Join a channel.
     */
    joinChannel(id) {
        return this.request(`/api/v1/channels/${encodeURIComponent(id)}/join`, {
            method: "POST",
        });
    }
    // ---------------------------------------------------------------------------
    // Message methods
    // ---------------------------------------------------------------------------
    /**
     * List messages in a channel. Supports cursor-based pagination via ULID.
     */
    listMessages(channelId, opts = {}) {
        return this.requestWithParams("/api/v1/messages", {
            channelId,
            limit: opts.limit !== undefined ? String(opts.limit) : undefined,
            since: opts.since,
        });
    }
    /**
     * Post a message to a channel.
     */
    postMessage(channelId, content, opts = {}) {
        return this.request("/api/v1/messages", {
            method: "POST",
            body: JSON.stringify({
                channelId,
                content,
                contentType: opts.contentType,
                metadata: opts.metadata,
                threadId: opts.threadId,
            }),
        });
    }
    /**
     * Soft-delete a message by ID.
     */
    deleteMessage(id) {
        return this.request(`/api/v1/messages/${encodeURIComponent(id)}`, {
            method: "DELETE",
        });
    }
    // ---------------------------------------------------------------------------
    // Convenience methods
    // ---------------------------------------------------------------------------
    /**
     * Post an app_updated event to the channel for the given app slug.
     * The channel ID is derived as `app-<appSlug>`.
     */
    postAppUpdate(appSlug, summary, metadata = {}) {
        return this.postMessage(`app-${appSlug}`, summary, {
            contentType: "app_updated",
            metadata,
        });
    }
    // ---------------------------------------------------------------------------
    // Polling
    // ---------------------------------------------------------------------------
    /**
     * Poll multiple channels for new messages.
     * Updates the provided cursors map in-place with the last seen message ID per channel.
     * Only channels that have new messages appear in the returned array.
     */
    async poll(channelIds, cursors) {
        const results = [];
        await Promise.all(channelIds.map(async (channelId) => {
            const since = cursors.get(channelId);
            const messages = await this.listMessages(channelId, since !== undefined ? { since } : {});
            if (messages.length > 0) {
                results.push({ channelId, messages });
                const last = messages[messages.length - 1];
                if (last !== undefined) {
                    cursors.set(channelId, last.id);
                }
            }
        }));
        return results;
    }
    // ---------------------------------------------------------------------------
    // WebSocket subscription
    // ---------------------------------------------------------------------------
    /**
     * Subscribe to real-time events on a channel via WebSocket.
     * Auto-reconnects after 3 seconds on unexpected close unless `close()` is called.
     *
     * Returns a handle with a `close()` method to stop the subscription.
     *
     * In environments without WebSocket support a warning is logged and a no-op
     * handle is returned.
     */
    subscribe(options) {
        if (typeof WebSocket === "undefined") {
            console.warn("[spike-chat-client] WebSocket is not available in this environment. subscribe() is a no-op.");
            return { close: () => undefined };
        }
        const wsBase = this.baseUrl.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://");
        const wsUrl = `${wsBase}/api/v1/channels/${encodeURIComponent(options.channelId)}/ws?userId=${encodeURIComponent(options.userId)}`;
        let ws = null;
        let closed = false;
        let reconnectTimer = null;
        const connect = () => {
            ws = new WebSocket(wsUrl);
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    options.onEvent(data);
                }
                catch {
                    // Non-JSON frames (e.g. ping text) are silently ignored.
                }
            };
            ws.onerror = () => {
                options.onError?.(new Error("spike-chat WebSocket error"));
            };
            ws.onclose = () => {
                if (closed) {
                    options.onClose?.();
                    return;
                }
                // Unexpected close — schedule a reconnect.
                reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
            };
        };
        connect();
        return {
            close() {
                closed = true;
                if (reconnectTimer !== null) {
                    clearTimeout(reconnectTimer);
                    reconnectTimer = null;
                }
                ws?.close();
            },
        };
    }
}
//# sourceMappingURL=client.js.map