import { useEffect, useMemo, useRef, useState } from "react";
import { RadixChatInput } from "../radix-chat/RadixChatInput";
import { RadixMessageBubble } from "../radix-chat/RadixMessageBubble";
import { useRadixChat, type PipelineStage } from "../radix-chat/useRadixChat";

interface PersonaProfile {
  value: string;
  label: string;
  accent: string;
  subtitle: string;
  greeting: string;
  suggestions: string[];
}

const PERSONAS: PersonaProfile[] = [
  {
    value: "",
    label: "Spike",
    accent: "#0f766e",
    subtitle: "Generic Spike Chat with the four-stage Aether pipeline and MCP-native tool use.",
    greeting: "What should we work on?",
    suggestions: [
      "Help me scope a feature before I build it.",
      "Review my current approach and show me the weakest point.",
      "Turn this rough idea into an execution plan.",
    ],
  },
  {
    value: "rubik-3",
    label: "Rubik",
    accent: "#2563eb",
    subtitle: "Sharper planning, cleaner tradeoffs, less transcript sludge.",
    greeting: "Give me the real problem, not the decoy.",
    suggestions: [
      "Interrogate this product idea until the real constraint shows up.",
      "Design a practical ship plan for this week.",
      "Tell me what I am pretending not to know.",
    ],
  },
  {
    value: "radix",
    label: "Radix",
    accent: "#7c3aed",
    subtitle: "Systems-minded execution with the original Spike operating logic.",
    greeting: "Show me the moving parts.",
    suggestions: [
      "Map the best MCP tools for this task.",
      "Give me a systems view of this product.",
      "Find the leverage point in this workflow.",
    ],
  },
  {
    value: "erdos",
    label: "Erdos",
    accent: "#4f46e5",
    subtitle: "Collaborative mathematical thinking and elegant problem framing.",
    greeting: "Let us see whether there is a simpler way.",
    suggestions: [
      "Reframe this problem more elegantly.",
      "Find the hidden structure here.",
      "What is the shortest route to a proof or decision?",
    ],
  },
  {
    value: "peti",
    label: "Peti",
    accent: "#16a34a",
    subtitle: "QA pressure-testing, failure hunting, and bug-oriented skepticism.",
    greeting: "I assume it is broken. Now prove me wrong.",
    suggestions: [
      "Find the top five failure modes in this flow.",
      "Write a lean QA plan for this feature.",
      "What breaks first if traffic spikes tomorrow?",
    ],
  },
  {
    value: "raju",
    label: "Raju",
    accent: "#0891b2",
    subtitle: "Backend architecture, reliability, and systems tradeoffs.",
    greeting: "Walk me through the failure path.",
    suggestions: [
      "Review this architecture like it will fail in production.",
      "Design the safest rollout path for this change.",
      "Where is the hidden operational risk here?",
    ],
  },
];

const STAGE_LABELS: Record<PipelineStage, string> = {
  classify: "Classifying",
  plan: "Planning",
  execute: "Executing",
  extract: "Extracting",
  idle: "Ready",
};

function resolveProfile(persona: string) {
  return PERSONAS.find((entry) => entry.value === persona) ?? PERSONAS[0];
}

export default function SpikeChatApp() {
  const [persona, setPersona] = useState("");
  const profile = useMemo(() => resolveProfile(persona), [persona]);
  const { messages, sendMessage, isStreaming, currentStage, error, clearError, clearMessages } =
    useRadixChat(persona || undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentStage, isStreaming]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        width: "100%",
        background:
          "radial-gradient(circle at top left, rgba(15,118,110,0.10), transparent 30%), linear-gradient(180deg, #fcfffe 0%, #f4f7f6 100%)",
        color: "#111827",
        fontFamily: '"Rubik", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          padding: "0.9rem 1rem",
          borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0 }}>
          <div
            style={{
              width: "2.4rem",
              height: "2.4rem",
              borderRadius: "0.9rem",
              background: `${profile.accent}18`,
              color: profile.accent,
              display: "grid",
              placeItems: "center",
              fontSize: "1rem",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            S
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                }}
              >
                Spike Chat
              </h1>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.22rem 0.55rem",
                  borderRadius: "999px",
                  background: "rgba(15, 118, 110, 0.08)",
                  color: "#0f766e",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                <span
                  style={{
                    width: "0.45rem",
                    height: "0.45rem",
                    borderRadius: "999px",
                    background: "#10b981",
                    display: "inline-block",
                  }}
                />
                Live
              </span>
            </div>
            <p
              style={{
                margin: "0.2rem 0 0",
                fontSize: "0.85rem",
                lineHeight: 1.45,
                color: "rgba(17, 24, 39, 0.68)",
                maxWidth: "44rem",
              }}
            >
              {profile.subtitle}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(17, 24, 39, 0.55)",
            }}
          >
            Persona
            <select
              aria-label="Select persona"
              value={persona}
              onChange={(event) => setPersona(event.target.value)}
              style={{
                border: "1px solid rgba(15, 23, 42, 0.12)",
                borderRadius: "999px",
                padding: "0.45rem 0.8rem",
                background: "#fff",
                color: "#111827",
                font: "inherit",
                textTransform: "none",
                letterSpacing: "normal",
                cursor: "pointer",
              }}
            >
              {PERSONAS.map((entry) => (
                <option key={entry.label} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={clearMessages}
            style={{
              padding: "0.55rem 0.9rem",
              borderRadius: "999px",
              border: "1px solid rgba(15, 23, 42, 0.12)",
              background: "#fff",
              color: "#111827",
              font: "inherit",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      </header>

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            padding: "0.7rem 1rem",
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: "0.84rem",
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={clearError}
            style={{
              border: "none",
              background: "transparent",
              color: "inherit",
              font: "inherit",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          padding: "0.7rem 1rem",
          borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
          background: "rgba(255,255,255,0.72)",
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: profile.accent,
        }}
      >
        <span>Stage</span>
        <span
          style={{
            padding: "0.28rem 0.55rem",
            borderRadius: "999px",
            background: `${profile.accent}14`,
          }}
        >
          {STAGE_LABELS[currentStage]}
        </span>
        <span style={{ color: "rgba(17, 24, 39, 0.45)" }}>
          {isStreaming ? "Streaming" : "Waiting"}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "grid",
              placeItems: "center",
              padding: "2rem 0",
            }}
          >
            <div
              style={{
                width: "min(100%, 56rem)",
                border: "1px solid rgba(15, 23, 42, 0.08)",
                borderRadius: "1.75rem",
                background: "rgba(255,255,255,0.86)",
                padding: "1.4rem",
                boxShadow: "0 24px 80px rgba(15, 23, 42, 0.06)",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.28rem 0.6rem",
                  borderRadius: "999px",
                  background: `${profile.accent}12`,
                  color: profile.accent,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Public app
              </div>
              <h2
                style={{
                  margin: "0.9rem 0 0.45rem",
                  fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
                  lineHeight: 1.04,
                  letterSpacing: "-0.04em",
                }}
              >
                {profile.greeting}
              </h2>
              <p
                style={{
                  margin: 0,
                  maxWidth: "42rem",
                  fontSize: "0.98rem",
                  lineHeight: 1.65,
                  color: "rgba(17, 24, 39, 0.68)",
                }}
              >
                This route now runs the real chat client instead of the static promo shell. Ask for
                planning, debugging, architecture, or tool-assisted analysis directly here.
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.6rem",
                  marginTop: "1rem",
                }}
              >
                {profile.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      void sendMessage(suggestion);
                    }}
                    style={{
                      padding: "0.72rem 0.95rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(15, 23, 42, 0.12)",
                      background: "#fff",
                      color: "#111827",
                      font: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <RadixMessageBubble key={message.id} message={message} accent={profile.accent} />
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(15, 23, 42, 0.08)",
          background: "rgba(255,255,255,0.94)",
        }}
      >
        <RadixChatInput
          onSend={(message) => {
            void sendMessage(message);
          }}
          disabled={isStreaming}
          accent={profile.accent}
          placeholder="Ask Spike Chat anything..."
        />
      </div>
    </div>
  );
}
