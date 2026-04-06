import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { SpikeChatClient } from "../core-logic/client.js";
import type { ChatEvent, ChatMessage } from "../core-logic/types.js";

export interface ChatWidgetProps {
  /** spike-chat base URL */
  baseUrl?: string;
  /** Bearer token for auth */
  apiKey?: string;
  /** Channel to connect to */
  channelId: string;
  /** User ID for WebSocket */
  userId: string;
  /** Display name shown on messages */
  displayName?: string;
  /** Position of the widget */
  position?: "bottom-right" | "bottom-left";
  /** Initially open? */
  defaultOpen?: boolean;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function ChatWidget({
  baseUrl = "https://chat.spike.land",
  apiKey,
  channelId,
  userId,
  displayName,
  position = "bottom-right",
  defaultOpen = false,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const clientRef = useRef<SpikeChatClient | null>(null);
  const subscriptionRef = useRef<{ close: () => void } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  // Scroll to bottom whenever messages change or panel opens
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Clear unread when opening
  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  // Init client, load history, subscribe
  useEffect(() => {
    const client = new SpikeChatClient({ baseUrl, apiKey });
    clientRef.current = client;

    client
      .listMessages(channelId, { limit: 20 })
      .then((msgs) => setMessages(msgs))
      .catch(() => {
        // Non-fatal — widget still usable for sending
      });

    const handleEvent = (event: ChatEvent) => {
      if (event.type === "message_new" && event.message) {
        const incoming = event.message;
        setMessages((prev) => {
          // Deduplicate optimistic messages by content+userId
          const withoutOptimistic = prev.filter(
            (m) =>
              !(
                m.id.startsWith("optimistic-") &&
                m.content === incoming.content &&
                m.userId === incoming.userId
              ),
          );
          return [...withoutOptimistic, incoming];
        });
        if (!isOpenRef.current) {
          setUnreadCount((n) => n + 1);
        }
      }
    };

    subscriptionRef.current = client.subscribe({
      channelId,
      userId,
      onEvent: handleEvent,
    });

    return () => {
      subscriptionRef.current?.close();
    };
  }, [baseUrl, apiKey, channelId, userId]);

  const sendMessage = useCallback(async () => {
    const content = input.trim();
    if (!content || isLoading || !clientRef.current) return;

    const optimistic: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      channelId,
      userId: displayName ?? userId,
      content,
      contentType: "text",
      threadId: null,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setIsLoading(true);

    try {
      await clientRef.current.postMessage(channelId, content);
    } catch {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(content);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, channelId, userId, displayName]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage],
  );

  const handleInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const positionClasses = position === "bottom-right" ? "right-4 bottom-4" : "left-4 bottom-4";

  const panelPositionClasses =
    position === "bottom-right" ? "right-4 bottom-20" : "left-4 bottom-20";

  return (
    <>
      {/* Chat panel */}
      {isOpen && (
        <div
          className={`fixed ${panelPositionClasses} z-50 flex w-[380px] max-h-[min(500px,70vh)] flex-col rounded-xl border border-border bg-card shadow-lg`}
        >
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-xl border-b border-border bg-card px-4 py-3">
            <span className="text-sm font-semibold text-foreground">{channelId}</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Message list */}
          <div ref={scrollRef} className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-3">
            {messages.length === 0 && (
              <p className="text-center text-xs text-muted-foreground">No messages yet.</p>
            )}
            {messages.map((msg) => {
              const isOwn = msg.userId === userId || msg.userId === (displayName ?? userId);
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}
                >
                  <span className="text-[10px] text-muted-foreground">
                    {msg.userId} · {formatTime(msg.createdAt)}
                  </span>
                  <span
                    className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm leading-snug ${
                      isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.content}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Input area */}
          <div className="flex items-end gap-2 rounded-b-xl border-t border-border bg-card px-3 py-3">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message…"
              rows={1}
              className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        className={`fixed ${positionClasses} z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90`}
      >
        <MessageCircle className="h-6 w-6" />
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
