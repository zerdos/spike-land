import type { ChatChannel, ChatClientConfig, ChatMessage, SubscribeOptions } from "./types.js";
/**
 * Typed client for the spike-chat REST and WebSocket API.
 *
 * @example
 * ```ts
 * const client = new SpikeChatClient({ apiKey: process.env.AGENT_API_KEY });
 * const messages = await client.listMessages("app-my-app");
 * ```
 */
export declare class SpikeChatClient {
  private readonly baseUrl;
  private readonly fetchImpl;
  private readonly defaultHeaders;
  constructor(config?: ChatClientConfig);
  private buildUrl;
  private request;
  private requestWithParams;
  /**
   * List all channels in a workspace.
   */
  listChannels(workspaceId: string): Promise<ChatChannel[]>;
  /**
   * Create a new channel.
   */
  createChannel(opts: { workspaceId: string; name: string; slug: string; type?: string }): Promise<{
    id: string;
  }>;
  /**
   * Get a single channel by ID.
   */
  getChannel(id: string): Promise<ChatChannel>;
  /**
   * Join a channel.
   */
  joinChannel(id: string): Promise<void>;
  /**
   * List messages in a channel. Supports cursor-based pagination via ULID.
   */
  listMessages(
    channelId: string,
    opts?: {
      limit?: number;
      since?: string;
    },
  ): Promise<ChatMessage[]>;
  /**
   * Post a message to a channel.
   */
  postMessage(
    channelId: string,
    content: string,
    opts?: {
      contentType?: string;
      metadata?: Record<string, unknown>;
      threadId?: string;
    },
  ): Promise<ChatMessage>;
  /**
   * Soft-delete a message by ID.
   */
  deleteMessage(id: string): Promise<void>;
  /**
   * Post an app_updated event to the channel for the given app slug.
   * The channel ID is derived as `app-<appSlug>`.
   */
  postAppUpdate(
    appSlug: string,
    summary: string,
    metadata?: {
      version?: string;
      changedFiles?: string[];
    },
  ): Promise<ChatMessage>;
  /**
   * Poll multiple channels for new messages.
   * Updates the provided cursors map in-place with the last seen message ID per channel.
   * Only channels that have new messages appear in the returned array.
   */
  poll(
    channelIds: string[],
    cursors: Map<string, string>,
  ): Promise<
    Array<{
      channelId: string;
      messages: ChatMessage[];
    }>
  >;
  /**
   * Subscribe to real-time events on a channel via WebSocket.
   * Auto-reconnects after 3 seconds on unexpected close unless `close()` is called.
   *
   * Returns a handle with a `close()` method to stop the subscription.
   *
   * In environments without WebSocket support a warning is logged and a no-op
   * handle is returned.
   */
  subscribe(options: SubscribeOptions): {
    close: () => void;
  };
}
//# sourceMappingURL=client.d.ts.map
