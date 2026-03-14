import { type ChangeEvent, type KeyboardEvent, useCallback, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  placeholder?: string;
  maxHeight?: number;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  isStreaming,
  placeholder = "Ask Spike...",
  maxHeight = 120,
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      e.target.style.height = "auto";
      e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;
    },
    [onChange, maxHeight],
  );

  const handleSend = useCallback(() => {
    if (!value.trim() || isStreaming) return;
    onSend();
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    inputRef.current?.focus();
    // Haptic feedback on mobile
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [value, isStreaming, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // Reset textarea height when value is cleared externally
  useEffect(() => {
    if (!value && inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  }, [value]);

  return (
    <div className="border-t border-border bg-card/60 px-3 py-2.5">
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          enterKeyHint="send"
          aria-label="Chat message"
          className="min-h-[36px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
          style={{ fontSize: "max(16px, 1em)" }}
          disabled={isStreaming}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!value.trim() || isStreaming}
          aria-label="Send message"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-background transition hover:opacity-90 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isStreaming ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground hidden sm:block">
        Enter to send &middot; Shift+Enter for newline
      </p>
    </div>
  );
}
