import { DurableObject } from "cloudflare:workers";
import type { Env } from "../core-logic/env";
import type { WsAttachment } from "../core-logic/types";

// Messages sent from Client -> Server
type ClientMessage = { type: "typing_start" } | { type: "typing_stop" } | { type: "ping" };

function isClientMessage(value: unknown): value is ClientMessage {
  if (typeof value !== "object" || value === null) return false;
  const type = (value as Record<string, unknown>)["type"];
  return type === "typing_start" || type === "typing_stop" || type === "ping";
}

function getAttachment(ws: WebSocket): WsAttachment | null {
  const raw = ws.deserializeAttachment() as unknown;
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  // Only userId is required at runtime; the full shape is guaranteed by serializeAttachment.
  if (typeof obj["userId"] !== "string") return null;
  return raw as WsAttachment;
}

export class ChannelDurableObject extends DurableObject {
  private typingUsers: Set<string> = new Set();
  private typingTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];
      if (!client || !server) {
        return new Response("WebSocket pair unavailable", { status: 500 });
      }

      const userId =
        request.headers.get("x-user-id") ?? url.searchParams.get("userId") ?? "anonymous";
      const displayName =
        request.headers.get("x-display-name") ?? url.searchParams.get("displayName") ?? "Unknown";
      const channelId = url.searchParams.get("channelId") ?? "unknown";

      const attachment: WsAttachment = {
        userId,
        displayName,
        channelId,
        isBot: false,
      };

      this.ctx.acceptWebSocket(server, [channelId]);
      server.serializeAttachment(attachment);

      return new Response(null, { status: 101, webSocket: client });
    }

    if (request.method === "POST" && url.pathname === "/broadcast") {
      const body: unknown = await request.json();
      this.broadcast(JSON.stringify(body));
      return new Response("OK", { status: 200 });
    }

    return new Response("Not found", { status: 404 });
  }

  private broadcast(message: string, excludeWs?: WebSocket): void {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== excludeWs) {
        try {
          ws.send(message);
        } catch {
          // ignore send errors for individual sockets
        }
      }
    }
  }

  // --- Hibernation API handlers ---
  override webSocketMessage(ws: WebSocket, msg: string | ArrayBuffer): void {
    if (typeof msg !== "string") return;

    let data: unknown;
    try {
      data = JSON.parse(msg);
    } catch (err) {
      console.warn(
        {
          err,
          byteLength: typeof msg === "string" ? msg.length : (msg as ArrayBuffer).byteLength,
          ws: (ws as unknown as { url?: string }).url ?? null,
        },
        "ws_invalid_frame",
      );
      try {
        ws.send(JSON.stringify({ type: "error", error: "invalid_frame" }));
      } catch {
        // socket may already be closed; ignore
      }
      return;
    }

    if (!isClientMessage(data)) return;

    const attachment = getAttachment(ws);
    if (!attachment) return;

    switch (data.type) {
      case "ping": {
        ws.send(JSON.stringify({ type: "pong" }));
        break;
      }
      case "typing_start": {
        this.typingUsers.add(attachment.userId);
        const existing = this.typingTimeouts.get(attachment.userId);
        if (existing !== undefined) clearTimeout(existing);
        this.typingTimeouts.set(
          attachment.userId,
          setTimeout(() => this.clearTyping(attachment.userId), 5000),
        );
        this.broadcast(JSON.stringify({ type: "typing", users: Array.from(this.typingUsers) }));
        break;
      }
      case "typing_stop": {
        this.clearTyping(attachment.userId);
        break;
      }
    }
  }

  private clearTyping(userId: string): void {
    const timer = this.typingTimeouts.get(userId);
    if (timer !== undefined) clearTimeout(timer);
    this.typingUsers.delete(userId);
    this.typingTimeouts.delete(userId);
    this.broadcast(JSON.stringify({ type: "typing", users: Array.from(this.typingUsers) }));
  }

  override webSocketClose(ws: WebSocket, _code: number, _reason: string, _wasClean: boolean): void {
    const attachment = getAttachment(ws);
    if (attachment) {
      this.clearTyping(attachment.userId);
    }
  }

  override webSocketError(ws: WebSocket, error: unknown): void {
    console.error("[ChannelDurableObject] WebSocket error:", error);
    const attachment = getAttachment(ws);
    if (attachment) {
      this.clearTyping(attachment.userId);
    }
  }
}
