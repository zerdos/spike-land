/**
 * Configuration for the SpikeChatClient.
 */
export interface ChatClientConfig {
  /** Base URL of spike-chat service. Default: "https://chat.spike.land" */
  baseUrl?: string;
  /** Bearer token for auth (agents/bots) */
  apiKey?: string | undefined;
  /** Agent ID for x-agent-id header */
  agentId?: string | undefined;
  /** Custom fetch implementation (for CF Workers service bindings) */
  fetch?: typeof globalThis.fetch | undefined;
}
/**
 * A chat message returned by the spike-chat API.
 */
export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  contentType: string;
  threadId: string | null;
  createdAt: number;
  deletedAt?: number | null;
  metadata?: Record<string, unknown>;
}
/**
 * A chat channel returned by the spike-chat API.
 */
export interface ChatChannel {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  type: "public" | "private" | "dm";
  createdBy: string;
  createdAt: number;
}
/**
 * The set of event types emitted over the channel WebSocket.
 */
export type ChatEventType =
  | "message_new"
  | "message_deleted"
  | "app_updated"
  | "typing_start"
  | "typing_stop"
  | "pong";
/**
 * An event received from the channel WebSocket.
 */
export interface ChatEvent {
  type: ChatEventType;
  message?: ChatMessage;
  id?: string;
  appSlug?: string;
  version?: string;
  changedFiles?: string[];
  messageId?: string;
}
/**
 * Options for subscribing to a channel WebSocket.
 */
export interface SubscribeOptions {
  channelId: string;
  userId: string;
  onEvent: (event: ChatEvent) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}
//# sourceMappingURL=types.d.ts.map
