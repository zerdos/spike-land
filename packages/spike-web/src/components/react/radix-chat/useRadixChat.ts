import { useState, useCallback, useRef, useEffect } from "react";

declare global {
  interface Window {
    getMusicState?: () => Record<string, unknown>;
    handleMusicTool?: (toolName: string, toolArgs: unknown) => Promise<unknown>;
  }
}

export interface RadixMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export type PipelineStage = "classify" | "plan" | "execute" | "extract" | "idle";

interface UseRadixChatReturn {
  messages: RadixMessage[];
  sendMessage: (content: string) => Promise<void>;
  isStreaming: boolean;
  currentStage: PipelineStage;
  error: string | null;
  clearError: () => void;
  clearMessages: () => void;
}

const VALID_STAGES: ReadonlySet<string> = new Set<PipelineStage>([
  "classify",
  "plan",
  "execute",
  "extract",
  "idle",
]);

function toPipelineStage(value: string | undefined): PipelineStage {
  return value !== undefined && VALID_STAGES.has(value) ? (value as PipelineStage) : "idle";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function getBaseURL(): string {
  if (typeof window === "undefined") return "https://spike.land";
  const { hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:8787";
  }
  if (hostname === "local.spike.land") {
    return "https://local.spike.land:8787";
  }
  if (
    hostname === "spike.land" ||
    hostname === "www.spike.land" ||
    hostname === "analytics.spike.land"
  ) {
    return window.location.origin;
  }
  return "https://spike.land";
}

function loadStoredMessages(storageKey: string): RadixMessage[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is RadixMessage =>
        isObject(item) &&
        typeof item["id"] === "string" &&
        (item["role"] === "user" || item["role"] === "assistant"),
    );
  } catch {
    return [];
  }
}

let nextId = 0;
function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${++nextId}`;
}

export function useRadixChat(persona?: string): UseRadixChatReturn {
  const personaSlug = persona?.trim() || "";
  const storageKey = personaSlug ? `${personaSlug}-chat-messages` : "spike-chat-messages";
  const messagePrefix = personaSlug || "spike-chat";

  const [messages, setMessages] = useState<RadixMessage[]>(() => loadStoredMessages(storageKey));
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStage, setCurrentStage] = useState<PipelineStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    setMessages(loadStoredMessages(storageKey));
    setIsStreaming(false);
    setCurrentStage("idle");
    setError(null);
  }, [storageKey]);

  // Persist messages to localStorage (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [messages, storageKey]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const userMsg: RadixMessage = {
        id: makeId(messagePrefix),
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setCurrentStage("classify");
      setError(null);

      const assistantMsg: RadixMessage = {
        id: makeId(messagePrefix),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      try {
        abortRef.current = new AbortController();

        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        let pageContext: { title: string; contentSnippet: string } | undefined;
        // Inject music state if available globally
        if (typeof window !== "undefined" && window.getMusicState) {
          pageContext = {
            title: "Music Creator",
            contentSnippet: `Current loop state: ${JSON.stringify(window.getMusicState())}`,
          };
        }

        const baseURL = getBaseURL();
        const res = await fetch(`${baseURL}/api/spike-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-guest-access": "true",
          },
          credentials: "include",
          body: JSON.stringify({
            message: content.trim(),
            history,
            ...(personaSlug ? { persona: personaSlug } : {}),
            pageContext,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(errBody || `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("id: ")) continue;
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed: unknown = JSON.parse(data);
              if (!isObject(parsed)) continue;

              const eventType = typeof parsed["type"] === "string" ? parsed["type"] : "";

              if (eventType === "stage_update") {
                const stage = typeof parsed["stage"] === "string" ? parsed["stage"] : undefined;
                setCurrentStage(toPipelineStage(stage));
              } else if (eventType === "text_delta" && typeof parsed["text"] === "string") {
                const deltaText = parsed["text"];
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id ? { ...m, content: m.content + deltaText } : m,
                  ),
                );
              } else if (eventType === "tool_call_start") {
                const toolName = typeof parsed["name"] === "string" ? parsed["name"] : "";
                const toolArgs = typeof parsed["args"] === "object" ? parsed["args"] : {};
                const toolCallId =
                  typeof parsed["toolCallId"] === "string" ? parsed["toolCallId"] : "";

                if (
                  toolName.startsWith("music_") &&
                  typeof window !== "undefined" &&
                  window.handleMusicTool
                ) {
                  try {
                    const result = await window.handleMusicTool(toolName, toolArgs);
                    // Send result back to DO session
                    fetch(`${baseURL}/api/spike-chat/browser-results`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "x-guest-access": "true" },
                      credentials: "include",
                      body: JSON.stringify({
                        sessionId: `spike-chat-guest`, // Note: backend handles real user id
                        toolCallId,
                        result,
                      }),
                    }).catch(console.error);
                  } catch (e) {
                    console.error("Error executing music tool", e);
                  }
                }
              } else if (eventType === "error") {
                const errMsg =
                  typeof parsed["error"] === "string" ? parsed["error"] : "Unknown error";
                setError(errMsg);
              }
            } catch {
              // skip malformed SSE
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "Failed to send message";
        setError(msg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id && !m.content
              ? { ...m, content: "Sorry, something went wrong. Please try again." }
              : m,
          ),
        );
      } finally {
        setIsStreaming(false);
        setCurrentStage("idle");
        abortRef.current = null;
      }
    },
    [isStreaming, messagePrefix, messages, personaSlug],
  );

  const clearError = useCallback(() => setError(null), []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    messages,
    sendMessage,
    isStreaming,
    currentStage,
    error,
    clearError,
    clearMessages,
  };
}
