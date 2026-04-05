import { memo, useState, useCallback, isValidElement, lazy, Suspense, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import {
  detectMusicFormat,
  isAbcNotation,
  isToneCode,
  detectYouTubeUrl,
  detectSpotifyUrl,
  detectAudioUrl,
} from "../music/detectMusic";

const ABCEditor = lazy(() => import("../music/ABCEditor").then((m) => ({ default: m.ABCEditor })));
const ToneEditor = lazy(() =>
  import("../music/ToneEditor").then((m) => ({ default: m.ToneEditor })),
);
const MidiEditor = lazy(() =>
  import("../music/MidiEditor").then((m) => ({ default: m.MidiEditor })),
);
const MusicPlayer = lazy(() =>
  import("../music/MusicPlayer").then((m) => ({ default: m.MusicPlayer })),
);
const YouTubeEmbed = lazy(() =>
  import("../music/MediaEmbed").then((m) => ({ default: m.YouTubeEmbed })),
);
const SpotifyEmbed = lazy(() =>
  import("../music/MediaEmbed").then((m) => ({ default: m.SpotifyEmbed })),
);

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
                return (
                  <code
                    className="text-xs font-mono"
                    data-lang={codeClassName?.replace("language-", "")}
                  >
                    {children}
                  </code>
                );
              }
              return (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
                  {children}
                </code>
              );
            },
            pre: ({ children }) => {
              const codeText = extractCodeText(children);
              const lang = extractCodeLang(children);

              // Detect music code blocks and render appropriate editor
              if (codeText && lang) {
                const musicFormat = detectMusicFormat(lang, codeText);
                if (musicFormat) {
                  return (
                    <Suspense fallback={<MusicBlockSkeleton />}>
                      {musicFormat === "abc" && <ABCEditor initialCode={codeText} />}
                      {musicFormat === "tone" && <ToneEditor initialCode={codeText} />}
                      {musicFormat === "midi" && <MidiEditor />}
                    </Suspense>
                  );
                }
              }

              // Auto-detect ABC notation even without language tag
              if (codeText && isAbcNotation(codeText)) {
                return (
                  <Suspense fallback={<MusicBlockSkeleton />}>
                    <ABCEditor initialCode={codeText} />
                  </Suspense>
                );
              }

              // Auto-detect Tone.js / Web Audio code
              if (codeText && isToneCode(codeText)) {
                return (
                  <Suspense fallback={<MusicBlockSkeleton />}>
                    <ToneEditor initialCode={codeText} />
                  </Suspense>
                );
              }

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
            a: ({ href, children }) => {
              // Auto-embed YouTube links
              if (href) {
                const yt = detectYouTubeUrl(href);
                if (yt) {
                  return (
                    <Suspense fallback={<MusicBlockSkeleton />}>
                      <YouTubeEmbed videoId={yt.videoId} />
                    </Suspense>
                  );
                }

                // Auto-embed Spotify links
                const sp = detectSpotifyUrl(href);
                if (sp) {
                  return (
                    <Suspense fallback={<MusicBlockSkeleton />}>
                      <SpotifyEmbed type={sp.type} id={sp.id} />
                    </Suspense>
                  );
                }

                // Auto-embed direct audio URLs
                const audioUrl = detectAudioUrl(href);
                if (audioUrl) {
                  return (
                    <Suspense fallback={<MusicBlockSkeleton />}>
                      <MusicPlayer src={audioUrl} format="audio" />
                    </Suspense>
                  );
                }
              }

              return (
                <a
                  href={href}
                  className="font-medium text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              );
            },
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

function MusicBlockSkeleton() {
  return (
    <div className="my-2 rounded-xl border border-border bg-card/80 p-4">
      <div className="flex items-center gap-2">
        <div className="size-4 animate-pulse rounded-full bg-primary/20" />
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-3 h-16 animate-pulse rounded-lg bg-muted/50" />
    </div>
  );
}

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

function extractCodeLang(children: ReactNode): string {
  if (!children) return "";
  if (isValidElement(children)) {
    const props = children.props as {
      className?: string;
      "data-lang"?: string;
      children?: ReactNode;
    };
    if (props["data-lang"]) return props["data-lang"];
    const className = props.className;
    if (className?.startsWith("language-")) {
      return className.replace("language-", "");
    }
    // Recurse into children
    return extractCodeLang(props.children);
  }
  if (Array.isArray(children)) {
    for (const child of children) {
      const result = extractCodeLang(child);
      if (result) return result;
    }
  }
  return "";
}
