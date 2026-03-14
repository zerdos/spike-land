import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

interface VirtualizedMessageListProps {
  /** Total number of messages. */
  count: number;
  /** Render a single message by index. */
  renderItem: (index: number) => ReactNode;
  /** Estimated height of each message in pixels. */
  estimatedItemHeight?: number;
  /** Number of extra items to render above/below the viewport. */
  bufferSize?: number;
  /** Threshold below which virtualization is skipped. */
  virtualizationThreshold?: number;
  /** Class name for the scroll container. */
  className?: string;
}

export function VirtualizedMessageList({
  count,
  renderItem,
  estimatedItemHeight = 80,
  bufferSize = 5,
  virtualizationThreshold = 50,
  className = "",
}: VirtualizedMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  // For small lists, render everything directly
  const shouldVirtualize = count > virtualizationThreshold;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [count]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !shouldVirtualize) return;
    setScrollTop(scrollRef.current.scrollTop);
  }, [shouldVirtualize]);

  // Measure container on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(scrollRef.current);
    return () => observer.disconnect();
  }, []);

  if (!shouldVirtualize) {
    // Render all items without virtualization
    return (
      <div ref={scrollRef} className={`overflow-y-auto ${className}`} onScroll={handleScroll}>
        <div className="space-y-4 px-3 py-3">
          {Array.from({ length: count }, (_, i) => (
            <div key={i}>{renderItem(i)}</div>
          ))}
        </div>
      </div>
    );
  }

  // Virtual window calculation
  const totalHeight = count * estimatedItemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / estimatedItemHeight) - bufferSize);
  const visibleCount = Math.ceil(containerHeight / estimatedItemHeight) + bufferSize * 2;
  const endIndex = Math.min(count, startIndex + visibleCount);

  const offsetTop = startIndex * estimatedItemHeight;
  const offsetBottom = Math.max(0, totalHeight - endIndex * estimatedItemHeight);

  return (
    <div ref={scrollRef} className={`overflow-y-auto ${className}`} onScroll={handleScroll}>
      <div style={{ paddingTop: offsetTop, paddingBottom: offsetBottom }}>
        <div className="space-y-4 px-3 py-3">
          {Array.from({ length: endIndex - startIndex }, (_, i) => (
            <div key={startIndex + i}>{renderItem(startIndex + i)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
