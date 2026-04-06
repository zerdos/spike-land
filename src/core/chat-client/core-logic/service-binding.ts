import { SpikeChatClient } from "./client.js";
import type { ChatClientConfig } from "./types.js";

/**
 * Create a SpikeChatClient that routes through a Cloudflare service binding.
 *
 * This avoids public network round-trips — the fetch call goes directly from
 * one Worker to another via the binding, without leaving Cloudflare's network.
 *
 * @example
 * ```ts
 * // In a Cloudflare Worker that has `spike_chat` bound as a service binding:
 * const client = createServiceBindingClient(env.SPIKE_CHAT, { agentId: "my-worker" });
 * const messages = await client.listMessages("app-my-app");
 * ```
 */
export function createServiceBindingClient(
  serviceBinding: { fetch: typeof globalThis.fetch },
  config?: Omit<ChatClientConfig, "fetch" | "baseUrl">,
): SpikeChatClient {
  return new SpikeChatClient({
    ...config,
    baseUrl: "http://spike-chat",
    fetch: serviceBinding.fetch.bind(serviceBinding),
  });
}
