import { memo, useState, useCallback, isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

function CodeBlockCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy code"
      className="absolute right-2 top-2 rounded-lg border border-border bg-background/90 p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover/code:opacity-100 hover:text-foreground"
    >
      {copied ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
    </button>
  );
}

interface ChatMarkdownProps {
  content: string;
}

export const ChatMarkdown = memo(
  function ChatMarkdown({ content }: ChatMarkdownProps) {
    return (
      <div className="chat-markdown text-sm leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            h1: ({ children }) => (
              <h1 className="mt-4 mb-2 text-lg font-semibold text-foreground">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="mt-3 mb-2 text-base font-semibold text-foreground">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="mt-2 mb-1 text-sm font-semibold text-foreground">{children}</h3>
            ),
            code: ({ children, className: codeClassName }) => {
              const isBlock = codeClassName?.startsWith("language-");
              if (isBlock) {
                return <code className="text-xs font-mono">{children}</code>;
              }
              return (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
                  {children}
                </code>
              );
            },
            pre: ({ children }) => {
              const codeText = extractCodeText(children);
              return (
                <div className="group/code relative my-2">
                  <pre className="overflow-x-auto rounded-xl border border-border bg-muted/50 p-3 text-xs font-mono leading-5">
                    {children}
                  </pre>
                  {codeText && <CodeBlockCopyButton code={codeText} />}
                </div>
              );
            },
            ul: ({ children }) => (
              <ul className="mb-2 space-y-0.5 pl-4 list-disc last:mb-0">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-2 space-y-0.5 pl-4 list-decimal last:mb-0">{children}</ol>
            ),
            li: ({ children }) => <li className="text-sm leading-6">{children}</li>,
            a: ({ href, children }) => (
              <a
                href={href}
                className="font-medium text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            blockquote: ({ children }) => (
              <blockquote className="my-2 border-l-2 border-primary/40 pl-3 italic text-muted-foreground">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="my-2 overflow-x-auto">
                <table className="w-full text-xs border-collapse">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="px-2 py-1.5 text-left font-semibold border-b border-border bg-muted/30 text-xs">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-2 py-1.5 border-b border-border/50 text-xs">{children}</td>
            ),
            hr: () => <hr className="my-3 border-border" />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  },
  (prev, next) => prev.content === next.content,
);

function extractCodeText(children: ReactNode): string {
  if (!children) return "";
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(extractCodeText).join("");
  if (isValidElement(children)) {
    return extractCodeText((children.props as { children?: ReactNode }).children);
  }
  return "";
}
