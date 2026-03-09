interface ArticleViewProps {
  content: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function ArticleView({ content, collapsed = false, onToggle }: ArticleViewProps) {
  // Split content into paragraphs for rendering
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);

  return (
    <div className="rubik-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Article
        </h3>
        {onToggle && (
          <button
            onClick={onToggle}
            className="text-xs font-semibold uppercase tracking-[0.12em] text-primary hover:text-primary/80"
          >
            {collapsed ? "Show Article" : "Hide Article"}
          </button>
        )}
      </div>
      {!collapsed && (
        <div className="max-h-96 overflow-y-auto px-6 py-5">
          <div className="prose prose-sm max-w-none text-foreground prose-p:leading-8 prose-p:text-foreground/90 prose-headings:tracking-tight">
            {paragraphs.map((p, i) => (
              <p key={i} className="mb-3 leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
