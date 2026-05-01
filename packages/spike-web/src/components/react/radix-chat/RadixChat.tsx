import { useEffect, useRef } from "react";
import { useRadixChat } from "./useRadixChat";
import type { PipelineStage } from "./useRadixChat";
import { RadixMessageBubble } from "./RadixMessageBubble";
import { RadixChatInput } from "./RadixChatInput";

const STAGE_LABELS: Record<PipelineStage, string> = {
  classify: "Classifying...",
  plan: "Planning...",
  execute: "Executing...",
  extract: "Extracting...",
  idle: "",
};

interface PersonaConfig {
  persona: string;
  title: string;
  accent: string;
  greeting: string;
  subtitle: string;
  placeholder: string;
  suggestions: string[];
}

const PERSONAS: Record<string, PersonaConfig> = {
  zoltan: {
    persona: "zoltan",
    title: "Zolt\u00e1n",
    accent: "#d97706",
    greeting: "Szia. Miben seg\u00edthetek?",
    subtitle: "Music. Math. Code. Platform. Human After All.",
    placeholder: "Talk to Zolt\u00e1n...",
    suggestions: [
      "Am I crazy or is this real?",
      "What MCP tools should I use?",
      "Help me finish this project",
    ],
  },
  arnold: {
    persona: "arnold",
    title: "Arnold",
    accent: "#e11d48",
    greeting: "Show me what you've got.",
    subtitle: "I'll tell you what it's missing. UX provocateur. Interface extremist.",
    placeholder: "Show Arnold your UI...",
    suggestions: [
      "Roast my landing page",
      "Make this loading state unforgettable",
      "What's wrong with my above-the-fold?",
    ],
  },
  peti: {
    persona: "peti",
    title: "Peti",
    accent: "#22c55e",
    greeting: "Hey! I already found 3 bugs. Want the list?",
    subtitle: "QA engineer. Tested spike.land for 3 weeks. Finds what you missed.",
    placeholder: "Show me what to test...",
    suggestions: [
      "I already tested that. Here's what's broken.",
      "Run the full test matrix on /chat",
      "What are the top 5 bugs you found?",
    ],
  },
  daftpunk: {
    persona: "daftpunk",
    title: "Daft Punk",
    accent: "#7c3aed",
    greeting: "One more time. What are we making tonight?",
    subtitle: "Music. Synthesis. Groove. Human After All.",
    placeholder: "Talk music with Daft Punk...",
    suggestions: [
      "Explain sidechain compression like I'm 5",
      "How do I make a filter sweep?",
      "What makes a beat groove?",
    ],
  },
  suno: {
    persona: "suno",
    title: "Suno",
    accent: "#ec4899",
    greeting:
      "Mit \u00edrjunk? Mondj egy \u00e9rz\u00e9st vagy egy sort \u2014 a t\u00f6bbit \u00e9n \u00f6sszerakom.",
    subtitle: "Songwriter. Suno-ready style prompts + lyrics. Magyarul is.",
    placeholder: "Mondj egy \u00e9rz\u00e9st, egy sort, egy m\u0171fajt...",
    suggestions: [
      "\u00cdrj egy szomor\u00fa indie dalt \u0151szi Brightonr\u00f3l",
      "Trap banger about debugging at 3am",
      "Magyar synthpop dal a K\u00e1lvin t\u00e9rr\u0151l",
    ],
  },
  gp: {
    persona: "gp",
    title: "Gian Pierre",
    accent: "#ea580c",
    greeting: "Right, what are we building? Tell me the problem first, not the solution.",
    subtitle: "Chemist from Brighton. Ships apps without being a developer.",
    placeholder: "Tell GP about your project...",
    suggestions: [
      "I'm not a developer, can I build this?",
      "Help me write a PRD",
      "How did you ship GlassBank?",
    ],
  },
  raju: {
    persona: "raju",
    title: "Raju",
    accent: "#0891b2",
    greeting: "Yaar, tell me about your system. What keeps you up at night?",
    subtitle: "Backend architect. Infrastructure sage. Systems thinker.",
    placeholder: "Ask Raju about your architecture...",
    suggestions: [
      "Review my database schema",
      "What happens when this service goes down?",
      "Help me design for failure",
    ],
  },
  erdos: {
    persona: "erdos",
    title: "Erdős",
    accent: "#4f46e5",
    greeting: "My brain is open. What problem shall we work on today?",
    subtitle: "Mathematics. Collaboration. Elegance. The Book.",
    placeholder: "Pose a problem to Erdős...",
    suggestions: [
      "Is this solution from The Book?",
      "Help me think about this combinatorially",
      "What would the probabilistic method say?",
    ],
  },
  einstein: {
    persona: "einstein",
    title: "Einstein",
    accent: "#78716c",
    greeting: "I have no special talents. I am only passionately curious.",
    subtitle: "Physics. Thought experiments. What the Arena taught him.",
    placeholder: "Be curious with Einstein...",
    suggestions: [
      "Explain this as a thought experiment",
      "What's the invariant in this system?",
      "What did Erdős teach you?",
    ],
  },
  switchboard: {
    persona: "switchboard",
    title: "Switchboard",
    accent: "#059669",
    greeting: "Right. Who's your current provider, and what are you paying?",
    subtitle: "UK consumer advocacy. Compare. Switch. Save.",
    placeholder: "Ask about your broadband options...",
    suggestions: [
      "Should I leave Virgin Media?",
      "What are my switching rights?",
      "Compare broadband in my area",
    ],
  },
  // --- Philosophers (Arena residents) ---
  socrates: {
    persona: "socrates",
    title: "Socrates",
    accent: "#a16207",
    greeting: "I know that I know nothing. But I suspect you think you know something.",
    subtitle: "The question is the answer. The method is the message.",
    placeholder: "Let Socrates question you...",
    suggestions: [
      "What do I really mean by that?",
      "How do I know what I think I know?",
      "Question my assumptions",
    ],
  },
  diogenes: {
    persona: "diogenes",
    title: "Diogenes",
    accent: "#854d0e",
    greeting:
      "You caught me mid-nap. This had better be worth more than the sunlight you\u2019re blocking.",
    subtitle: "The original punk. Lives like a dog. Tells the truth.",
    placeholder: "Disturb Diogenes...",
    suggestions: [
      "What do I actually need?",
      "Tell me what\u2019s fake about my life",
      "What would a dog do?",
    ],
  },
  plato: {
    persona: "plato",
    title: "Plato",
    accent: "#6d28d9",
    greeting: "Welcome to the Academy. Let no one ignorant of geometry enter.",
    subtitle: "The cave. The forms. The truth behind the shadows.",
    placeholder: "Enter the Academy...",
    suggestions: [
      "What\u2019s the Form of this idea?",
      "Am I looking at shadows?",
      "Explain the cave allegory",
    ],
  },
  aristotle: {
    persona: "aristotle",
    title: "Aristotle",
    accent: "#0f766e",
    greeting: "Plato is dear to me, but truth is dearer. What shall we investigate?",
    subtitle: "Observe. Categorize. Find the golden mean.",
    placeholder: "Investigate with Aristotle...",
    suggestions: [
      "What\u2019s the golden mean here?",
      "What are the four causes?",
      "Help me categorize this",
    ],
  },
  nietzsche: {
    persona: "nietzsche",
    title: "Nietzsche",
    accent: "#9f1239",
    greeting:
      "What does not kill you makes you stronger \u2014 but most things just make you tired.",
    subtitle: "God is dead. Now create your own values. The horse remembers.",
    placeholder: "Philosophize with a hammer...",
    suggestions: [
      "What would the \u00dcbermensch do?",
      "Apply eternal recurrence to my life",
      "Tell me about the horse in Turin",
    ],
  },
  kant: {
    persona: "kant",
    title: "Kant",
    accent: "#475569",
    greeting: "The starry heavens above me and the moral law within me.",
    subtitle: "Duty. Reason. The categorical imperative.",
    placeholder: "Reason with Kant...",
    suggestions: [
      "What if everyone did this?",
      "Is this my duty or my inclination?",
      "What can I actually know?",
    ],
  },
  stoic: {
    persona: "stoic",
    title: "Marcus Aurelius",
    accent: "#b45309",
    greeting: "You could leave life right now. Let that determine what you do and say and think.",
    subtitle: "The obstacle is the way. Memento mori.",
    placeholder: "Meditate with Marcus...",
    suggestions: [
      "What can I actually control here?",
      "Help me see the obstacle as the way",
      "I\u2019m overwhelmed",
    ],
  },
  wittgenstein: {
    persona: "wittgenstein",
    title: "Wittgenstein",
    accent: "#4338ca",
    greeting: "The limits of my language mean the limits of my world. Shall we push them?",
    subtitle: "Language games. The fly-bottle. What cannot be said.",
    placeholder: "Find the exit with Wittgenstein...",
    suggestions: [
      "What do I actually mean by this?",
      "Show me the fly-bottle I\u2019m trapped in",
      "Is this a real problem or a language problem?",
    ],
  },
  buddha: {
    persona: "buddha",
    title: "Buddha",
    accent: "#ca8a04",
    greeting: "Before we begin \u2014 take one breath. Just one. Notice it. Good.",
    subtitle: "The Middle Way. Suffering ends where attachment ends.",
    placeholder: "Sit with Buddha...",
    suggestions: [
      "What am I clinging to?",
      "Show me the middle way",
      "Why does this keep bothering me?",
    ],
  },
  camus: {
    persona: "camus",
    title: "Camus",
    accent: "#dc2626",
    greeting: "The sun is out. The absurd can wait five minutes. What\u2019s on your mind?",
    subtitle: "One must imagine Sisyphus happy. Rebel. Create. Live.",
    placeholder: "Revolt with Camus...",
    suggestions: [
      "Is this meaningless?",
      "Help me imagine Sisyphus happy",
      "What\u2019s worth rebelling against?",
    ],
  },
  simone: {
    persona: "simone",
    title: "Simone de Beauvoir",
    accent: "#be185d",
    greeting: "Freedom is not something you find. It is something you practice.",
    subtitle: "Existential ethics. Freedom is collective or incomplete.",
    placeholder: "Practice freedom with Simone...",
    suggestions: [
      "Am I choosing or avoiding?",
      "What would genuine freedom look like?",
      "Challenge my assumptions about gender",
    ],
  },
  arendt: {
    persona: "arendt",
    title: "Hannah Arendt",
    accent: "#57534e",
    greeting: "Most evil is done by people who never make up their minds to be good or evil.",
    subtitle: "The banality of evil. Think. Appear. Act.",
    placeholder: "Think with Arendt...",
    suggestions: [
      "Am I thinking or just following?",
      "What would Eichmann do? (And why that\u2019s the wrong question)",
      "What does natality mean for me?",
    ],
  },
  spinoza: {
    persona: "spinoza",
    title: "Spinoza",
    accent: "#166534",
    greeting: "I do not weep. I do not laugh. I understand.",
    subtitle: "God is Nature. Freedom is understanding. The lens-grinder sees clearly.",
    placeholder: "Understand with Spinoza...",
    suggestions: [
      "Help me see sub specie aeternitatis",
      "What is my conatus?",
      "Are my emotions telling me something?",
    ],
  },
  confucius: {
    persona: "confucius",
    title: "Confucius",
    accent: "#b91c1c",
    greeting: "Is it not a joy to study and practice what you have learned?",
    subtitle: "Virtue. Ritual. The rectification of names.",
    placeholder: "Study with Confucius...",
    suggestions: [
      "Am I calling this what it really is?",
      "What does a gentleman do here?",
      "How do I cultivate this virtue?",
    ],
  },
  // --- Public figures (Arena guests — open loops noted) ---
  trump: {
    persona: "trump",
    title: "Trump",
    accent: "#dc2626",
    greeting: "Nobody knows more about deals than me. Probably nobody in history.",
    subtitle: "Branding. Deals. The art of attention. Guest \u2014 open loops noted.",
    placeholder: "Negotiate with Trump...",
    suggestions: ["How do I brand this?", "What\u2019s my leverage?", "Negotiate this for me"],
  },
  musk: {
    persona: "musk",
    title: "Musk",
    accent: "#1d4ed8",
    greeting: "I\u2019m usually running late because I was solving a different problem.",
    subtitle: "First principles. Mars. Vertical integration. Guest \u2014 open loops noted.",
    placeholder: "Think from first principles...",
    suggestions: [
      "Break this down to first principles",
      "What would vertical integration look like?",
      "Is this physics-possible?",
    ],
  },
  gates: {
    persona: "gates",
    title: "Gates",
    accent: "#0369a1",
    greeting: "I just finished a really interesting book about this.",
    subtitle: "Platform thinking. Philanthropy at scale. Guest \u2014 loop closing.",
    placeholder: "Build platforms with Gates...",
    suggestions: [
      "What\u2019s the highest-leverage intervention?",
      "Recommend a book for this problem",
      "How do I think in decades?",
    ],
  },
};

interface Props {
  persona?: string;
}

export default function RadixChat({ persona = "zoltan" }: Props) {
  const config = PERSONAS[persona] ?? PERSONAS["zoltan"];
  const { messages, sendMessage, isStreaming, currentStage, error, clearError, clearMessages } =
    useRadixChat(config.persona);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages.
  // Deferred to next frame so iOS Safari's keyboard/layout settles first,
  // preventing the input-jumps-when-keyboard-opens glitch.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    return () => cancelAnimationFrame(raf);
  }, [messages]);

  // iOS keyboard coordination: when the visual viewport resizes (keyboard
  // opens/closes), re-anchor the bottom of the thread without smooth-scroll,
  // which otherwise fights with iOS's own layout adjustment and causes the
  // input field to jump.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (settleTimer !== null) clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
      }, 120);
    };
    vv.addEventListener("resize", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      if (settleTimer !== null) clearTimeout(settleTimer);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "#fafafa",
        color: "#1a1a1a",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overscrollBehavior: "contain",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "48px",
          padding: "0 1rem",
          paddingTop: "env(safe-area-inset-top, 0px)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          background: "#fff",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.125rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {config.title}
          </span>
          <span
            style={{
              width: "0.5rem",
              height: "0.5rem",
              borderRadius: "50%",
              background: "#10b981",
              display: "inline-block",
            }}
          />
        </div>
        <button
          type="button"
          onClick={clearMessages}
          style={{
            padding: "0.375rem 0.75rem",
            fontSize: "0.8125rem",
            fontWeight: 500,
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: "0.5rem",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Clear
        </button>
      </header>

      {/* Error bar */}
      {error && (
        <div
          style={{
            padding: "0.5rem 1rem",
            background: "#fef2f2",
            color: "#dc2626",
            fontSize: "0.8125rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
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
              cursor: "pointer",
              fontSize: "1rem",
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Stage indicator */}
      {currentStage !== "idle" && (
        <div
          style={{
            padding: "0.375rem 1rem",
            background: `${config.accent}0f`,
            color: config.accent,
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            flexShrink: 0,
          }}
        >
          {STAGE_LABELS[currentStage]}
        </div>
      )}

      {/* Message list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: "1.5rem",
              padding: "2rem 1rem",
            }}
          >
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                {config.greeting}
              </div>
              <div style={{ fontSize: "0.9375rem", color: "rgba(0,0,0,0.5)", lineHeight: "1.5" }}>
                {config.subtitle}
              </div>
            </div>
            <div
              style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}
            >
              {config.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  style={{
                    padding: "0.5rem 1rem",
                    fontSize: "0.8125rem",
                    border: "1px solid rgba(0,0,0,0.12)",
                    borderRadius: "999px",
                    background: "#fff",
                    color: "inherit",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background 0.15s",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <RadixMessageBubble key={msg.id} message={msg} accent={config.accent} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <RadixChatInput
        onSend={sendMessage}
        disabled={isStreaming}
        accent={config.accent}
        placeholder={config.placeholder}
      />
    </div>
  );
}
