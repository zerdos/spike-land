import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useRadixChat } from "../react/radix-chat/useRadixChat";

// A minimal markdown renderer matching the one in RadixMessageBubble
function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /```(\w*)\n([\s\S]*?)```/g,
      (_m, _lang, code) =>
        `<pre style="background:rgba(0,0,0,0.06);padding:0.75rem;border-radius:0.375rem;overflow-x:auto;font-size:0.8125rem;margin:0.5rem 0"><code>${code.trim()}</code></pre>`,
    )
    .replace(
      /`([^`]+)`/g,
      '<code style="background:rgba(0,0,0,0.06);padding:0.125rem 0.375rem;border-radius:0.25rem;font-size:0.85em">$1</code>',
    )
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline">$1</a>',
    )
    .replace(/\n/g, "<br />");

  html = html.replace(/(?:^|<br \/>)((?:- .+?(?:<br \/>|$))+)/g, (_m, items: string) => {
    const lis = items
      .split("<br />")
      .filter((l: string) => l.startsWith("- "))
      .map((l: string) => `<li>${l.slice(2)}</li>`)
      .join("");
    return `<ul style="margin:0.5rem 0;padding-left:1.25rem">${lis}</ul>`;
  });

  return html;
}

export function SpikeChatDemo() {
  const { messages, sendMessage, isStreaming, currentStage } = useRadixChat("radix");
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  // biome-ignore lint/correctness/useExhaustiveDependencies: Trigger scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !isStreaming) {
      sendMessage(inputValue);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const displayNotes = [
    {
      confidence: "0.92",
      text: "Route /apps/spike-chat should resolve to a dedicated product page.",
    },
    {
      confidence: "0.81",
      text: "Full transcript replay is wasteful when stage artifacts already exist.",
    },
    {
      confidence: "0.74",
      text: "Deployment regressions are easier to isolate when route metadata is explicit.",
    },
  ];

  const displayTools = [
    { name: "inspect_spa_assets", status: "done" },
    { name: "trace_app_route", status: "done" },
    { name: "render_prerendered_page", status: "active" },
  ];

  return (
    <div className="workspace glass-card flex-1 min-h-0">
      <div className="workspace-topbar">
        <div>
          <p className="workspace-label">channel</p>
          <h2 className="workspace-name">app-spike-chat</h2>
        </div>
        <div className="workspace-state">
          <span className="stage-badge">{currentStage === "idle" ? "ready" : currentStage}</span>
          <span className="memory-badge">memory +{Math.max(3, messages.length)}</span>
        </div>
      </div>

      <div className="workspace-body flex-1 overflow-y-auto">
        <div className="conversation flex-1 overflow-y-auto pr-2 pb-4">
          {messages.length === 0 ? (
            <>
              <div className="bubble bubble-assistant">
                <span className="bubble-role">Spike</span>
                <p>I kept the stable prompt prefix cached. What do you want to ship today?</p>
              </div>
            </>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`bubble bubble-${m.role}`}>
                <span className="bubble-role">{m.role === "user" ? "You" : "Spike"}</span>
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Markdown is sanitized and explicitly handled */}
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
              </div>
            ))
          )}

          {/* Loading indicator if streaming and the last message isn't from the assistant yet */}
          {isStreaming && messages.length > 0 && messages[messages.length - 1].role === "user" && (
            <div className="bubble bubble-assistant">
              <span className="bubble-role">Spike</span>
              <p>...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <aside className="workspace-rail hidden md:flex flex-col">
          <div className="rail-card">
            <p className="rail-label">Active notes</p>
            <ul className="note-list">
              {displayNotes.map((note) => (
                <li key={`note-${note.text}`} className="note-item">
                  <span className="note-score">{note.confidence}</span>
                  <span>{note.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rail-card mt-3">
            <p className="rail-label">Tool activity</p>
            <ul className="tool-list">
              {displayTools.map((event) => (
                <li key={`tool-${event.name}`} className="tool-item">
                  <span>{event.name}</span>
                  <span className={`tool-status ${event.status}`}>{event.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <div className="composer shrink-0">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          className="composer-input flex-1 bg-transparent border-none outline-none text-inherit font-inherit text-sm placeholder:text-muted-fg"
          disabled={isStreaming}
        />
        <button
          type="button"
          className="composer-send disabled:opacity-50"
          onClick={handleSend}
          disabled={isStreaming || !inputValue.trim()}
        >
          {isStreaming ? "..." : "enter"}
        </button>
      </div>
    </div>
  );
}
