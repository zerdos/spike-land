import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import type { ConversationItem } from "../hooks/useChat";
import { apiUrl } from "../../core-logic/api";

const PERSONA = "rubik-3";

interface DesignVariant {
  id: string;
  name: string;
  focus: string;
}

const VARIANT_COLORS: Record<string, string> = {
  "dense-grid": "bg-emerald-500/10 text-emerald-600",
  editorial: "bg-rose-500/10 text-rose-600",
  terminal: "bg-green-500/10 text-green-500",
  glassmorphism: "bg-blue-500/10 text-blue-400",
  obsidian: "bg-purple-500/10 text-purple-400",
  "phone-compact": "bg-orange-500/10 text-orange-500",
  "4k-expanse": "bg-cyan-500/10 text-cyan-500",
  "kinetic-type": "bg-pink-500/10 text-pink-500",
  "card-world": "bg-amber-500/10 text-amber-600",
  "command-first": "bg-slate-500/10 text-slate-400",
  "store-forward": "bg-indigo-500/10 text-indigo-500",
  "blog-forward": "bg-teal-500/10 text-teal-500",
  "chat-forward": "bg-violet-500/10 text-violet-500",
  "dashboard-pro": "bg-sky-500/10 text-sky-500",
  enterprise: "bg-gray-500/10 text-gray-500",
  playful: "bg-yellow-500/10 text-yellow-600",
};

function RubikChatMessage({ item }: { item: ConversationItem }) {
  if (item.kind === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.content}</p>
        </div>
      </div>
    );
  }

  if (item.kind === "assistant_text") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-2xl bg-card px-4 py-3 shadow-[var(--panel-shadow)]">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {item.content}
          </p>
        </div>
      </div>
    );
  }

  if (item.kind === "tool_call") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-xl border border-border bg-muted/50 px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary">
              {item.status === "pending" ? (
                <span className="h-2 w-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : item.status === "error" ? (
                "!"
              ) : (
                "\u2713"
              )}
            </span>
            <span className="font-mono">{item.name}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase ${
                item.status === "done"
                  ? "bg-success/10 text-success-foreground"
                  : item.status === "error"
                    ? "bg-destructive/10 text-destructive-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {item.status}
            </span>
          </div>
          {item.result && (
            <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-background p-2 font-mono text-xs text-muted-foreground">
              {item.result.length > 500 ? `${item.result.slice(0, 500)}...` : item.result}
            </pre>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export function RubikChatPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    threads,
    currentThreadId,
    items,
    usage,
    isLoadingHistory,
    isStreaming,
    error,
    sendMessage,
    selectThread,
    newThread,
    clearError,
  } = useChat({ enabled: isAuthenticated, persona: PERSONA });

  const [input, setInput] = useState("");
  const [variants, setVariants] = useState<DesignVariant[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    void (async () => {
      try {
        const res = await fetch(apiUrl("/chat/design-variants"));
        if (res.ok) {
          const data = (await res.json()) as { variants: DesignVariant[] };
          setVariants(data.variants);
        }
      } catch {
        // Best-effort load
      }
    })();
  }, [isAuthenticated]);

  const seedVariants = useCallback(async () => {
    if (isSeeding) return;
    setIsSeeding(true);
    try {
      const res = await fetch(apiUrl("/chat/seed-variants"), {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = (await res.json()) as { variants: Array<{ id: string; name: string }> };
        if (data.variants.length > 0) {
          void selectThread(data.variants[0].id);
        }
      }
    } catch {
      // Best-effort seed
    } finally {
      setIsSeeding(false);
    }
  }, [isSeeding, selectThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items]);

  useEffect(() => {
    if (!isStreaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isStreaming]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return;
    const msg = input;
    setInput("");
    await sendMessage(msg);
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  if (authLoading) {
    return (
      <div className="flex h-[calc(100dvh-3.5rem)] lg:h-[calc(100dvh-4.5rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] lg:h-[calc(100dvh-4.5rem)]">
      {/* Thread sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-muted/30 lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-border p-4">
            <button
              type="button"
              onClick={newThread}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              + New conversation
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => void selectThread(thread.id)}
                className={`mb-1 w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  currentThreadId === thread.id
                    ? "bg-card font-medium text-foreground shadow-[var(--panel-shadow)]"
                    : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
                }`}
              >
                <p className="truncate">{thread.title}</p>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 font-mono text-sm font-bold text-primary">
              R3
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-foreground">Rubik 3.0</h1>
              <p className="text-xs text-muted-foreground">
                Design + Quality + Product Intelligence
              </p>
            </div>
          </div>
          {usage && (
            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <span className="font-mono">{usage.totalTokens.toLocaleString()}</span>
              <span>/</span>
              <span className="font-mono">{usage.contextWindow.toLocaleString()}</span>
              <span>tokens</span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-border border-t-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="mx-auto max-w-4xl space-y-8 py-12">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 font-mono text-2xl font-bold text-primary">
                  R3
                </div>
                <h2 className="mb-2 text-lg font-semibold text-foreground">Rubik 3.0</h2>
                <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                  I&apos;m spike.land&apos;s design + quality + product intelligence. Ask me about
                  the design system, quality methodology, platform architecture, or let me review
                  your work.
                </p>
              </div>

              {variants.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Design Variants</h3>
                      <p className="text-xs text-muted-foreground">
                        16 pre-seeded design directions to explore
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void seedVariants()}
                      disabled={isSeeding}
                      className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      {isSeeding ? "Seeding..." : "Seed All 16 Threads"}
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {variants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => {
                          void sendMessage(
                            `Explore the "${variant.name}" design direction. Focus: ${variant.focus}`,
                          );
                        }}
                        disabled={isStreaming}
                        className="group rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-primary/20 hover:shadow-[var(--panel-shadow)]"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                              VARIANT_COLORS[variant.id] ?? "bg-muted text-muted-foreground"
                            }`}
                          >
                            {variant.name.charAt(0)}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {variant.name}
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {variant.focus}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {items.map((item) => (
                <RubikChatMessage key={item.id} item={item} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mb-2 flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm text-destructive-foreground lg:mx-6">
            <span>{error}</span>
            <button type="button" onClick={clearError} className="font-medium hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-border px-4 py-3 lg:px-6">
          <div className="mx-auto flex max-w-3xl items-end gap-3">
            <div className="relative min-w-0 flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Rubik 3.0..."
                disabled={isStreaming}
                rows={1}
                className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                style={{ minHeight: "44px", maxHeight: "120px" }}
              />
            </div>
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={isStreaming || !input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              aria-label="Send message"
            >
              {isStreaming ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
