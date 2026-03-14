import type { ReactNode } from "react";

interface AnimatedMessageProps {
  children: ReactNode;
  index: number;
}

/**
 * Wraps a chat message with a slide-up fade-in entrance animation.
 * Uses staggered delay based on index for sequential appearance.
 */
export function AnimatedMessage({ children, index }: AnimatedMessageProps) {
  return (
    <div
      className="animate-chat-msg-in"
      style={{ animationDelay: `${Math.min(index * 50, 200)}ms` }}
    >
      {children}
    </div>
  );
}

/**
 * Typing indicator — three bouncing dots shown when the assistant
 * is streaming but hasn't produced content yet.
 */
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block size-1.5 rounded-full bg-muted-foreground/60 animate-typing-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

/**
 * Blinking cursor shown at the end of streaming content.
 */
export function StreamingCursor() {
  return (
    <span className="inline-block w-[2px] h-[1em] bg-foreground animate-pulse align-text-bottom ml-0.5" />
  );
}
