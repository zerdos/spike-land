import { type KeyboardEvent, useEffect, useRef, useState, useCallback, memo } from "react";
import { Send, Copy, Check, User, Bot, Loader2, Brain, Trash2, Zap } from "lucide-react";
import { useAetherChat, type AetherMessage, type PipelineStage } from "../hooks/useAetherChat";

const STAGE_LABELS: Record<PipelineStage, string> = {
  classify: "Classifying intent...",
  plan: "Planning response...",
  execute: "Generating response...",
  extract: "Learning from conversation...",
  idle: "",
};

const MessageItem = memo(function MessageItem({ msg }: { msg: AetherMessage }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [msg.content]);

  return (
    <div
      className={`group flex w-full flex-col gap-2 mb-4 ${
        msg.role === "user" ? "items-end" : "items-start"
      }`}
    >
      <div className="flex items-center gap-2 px-1">
        {msg.role === "assistant" && <Bot className="size-3.5 text-primary" />}
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
          {msg.role === "assistant" ? "Spike" : "you"}
        </span>
        {msg.role === "user" && <User className="size-3.5 text-muted-foreground" />}
      </div>
      <div
        className={`relative max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all ${
          msg.role === "user"
            ? "bg-primary text-primary-foreground rounded-tr-none"
            : "bg-card border border-border text-foreground rounded-tl-none hover:border-primary/30"
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

        {/* Tool calls */}
        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="mt-2 space-y-1 border-t border-border/50 pt-2">
            {msg.toolCalls.map((tc, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs font-mono text-muted-foreground"
              >
                <Zap className="size-3" />
                <span>{tc.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    tc.status === "done"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : tc.status === "error"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary animate-pulse"
                  }`}
                >
                  {tc.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {msg.role === "assistant" && (
          <button
            onClick={handleCopy}
            className="absolute -right-8 top-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
            title="Copy message"
          >
            {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
});

function StageIndicator({ stage }: { stage: PipelineStage }) {
  if (stage === "idle") return null;
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center gap-2 rounded-2xl bg-card border border-border px-4 py-3 shadow-sm">
        <Loader2 className="size-4 animate-spin text-primary" />
        <span className="text-xs font-medium text-muted-foreground animate-pulse">
          {STAGE_LABELS[stage]}
        </span>
      </div>
    </div>
  );
}

export function SpikeChatApp() {
  const {
    messages,
    sendMessage,
    isStreaming,
    currentStage,
    error,
    clearError,
    clearMessages,
    noteCount,
  } = useAetherChat();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length, isStreaming, currentStage]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    void sendMessage(trimmed);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    inputRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Spike Chat</h2>
            <p className="text-[10px] text-muted-foreground">Powered by Grok</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {noteCount > 0 && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-medium"
              title="Active memory notes"
            >
              <Brain className="size-3" />
              {noteCount}
            </div>
          )}
          <button
            onClick={clearMessages}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 text-destructive text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        role="log"
        aria-label="Chat history"
        className="flex-1 overflow-y-auto p-4 md:p-6"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
            <div className="p-4 rounded-full bg-primary/5">
              <Zap className="size-8 text-primary/40" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Welcome to Spike Chat</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                An AI assistant with memory. I learn from our conversations to help you better over
                time.
              </p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <MessageItem key={msg.id} msg={msg} />
        ))}
        <StageIndicator stage={currentStage} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
        <div className="mx-auto max-w-4xl relative flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all min-h-[46px]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="shrink-0 size-[46px] rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
          >
            <Send className="size-4" />
          </button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for new line
        </p>
      </div>
    </div>
  );
}
