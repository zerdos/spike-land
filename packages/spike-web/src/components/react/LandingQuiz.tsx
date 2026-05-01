import { useState, useCallback, useMemo, type ComponentType, type CSSProperties } from "react";
import {
  Atom,
  Brain,
  Check,
  ChevronRight,
  Compass,
  Crown,
  Eye,
  Feather,
  Flame,
  Gift,
  GraduationCap,
  Home,
  Languages,
  Leaf,
  Lightbulb,
  Megaphone,
  MessageCircle,
  Rocket,
  RotateCcw,
  Scale,
  ScrollText,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type PersonaId =
  | "erdos"
  | "socrates"
  | "peti"
  | "diogenes"
  | "spinoza"
  | "camus"
  | "einstein"
  | "arendt"
  | "wittgenstein"
  | "kant"
  | "aristotle"
  | "arnold"
  | "zoltan"
  | "confucius"
  | "buddha"
  | "nietzsche"
  | "plato"
  | "musk"
  | "gates"
  | "trump";

interface Persona {
  id: PersonaId;
  name: string;
  tagline: string;
  description: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  accent: string;
}

const PERSONAS: Record<PersonaId, Persona> = {
  erdos: {
    id: "erdos",
    name: "Erdős",
    tagline: "The Problem Poser",
    description:
      "Your brain is open. You ask sharper questions than most people answer. You'd trade a full inbox for one hour at a clean whiteboard with a hard problem.",
    icon: Brain,
    accent: "#4f46e5",
  },
  socrates: {
    id: "socrates",
    name: "Socrates",
    tagline: "The Question-Asker",
    description:
      "You don't argue — you ask, and the other person ends up arguing with themselves. Your favourite disagreement is the one that ends with both sides changing their minds.",
    icon: MessageCircle,
    accent: "#a16207",
  },
  peti: {
    id: "peti",
    name: "Peti",
    tagline: "The QA Realist",
    description:
      "Nothing ships until it is correct on mobile Safari at 2% battery. You file bugs with reproduction steps that read like forensic reports.",
    icon: ShieldCheck,
    accent: "#22c55e",
  },
  diogenes: {
    id: "diogenes",
    name: "Diogenes",
    tagline: "The Premise-Refuser",
    description:
      "You'd rather live in a barrel than play a rigged game. When a problem is badly framed, you say so — loudly, publicly, with a lantern if needed.",
    icon: Lightbulb,
    accent: "#854d0e",
  },
  spinoza: {
    id: "spinoza",
    name: "Spinoza",
    tagline: "The Rationalist",
    description:
      "Beauty doesn't mystify you — it clarifies. You want to understand exactly why the thing is good, from first principles, and then build something else that is.",
    icon: Sparkles,
    accent: "#6366f1",
  },
  camus: {
    id: "camus",
    name: "Camus",
    tagline: "The Absurdist",
    description:
      "One must imagine Sisyphus happy. You write to hold on to the moments that keep slipping, and you suspect the writing is the only thing that makes them real.",
    icon: Feather,
    accent: "#dc2626",
  },
  einstein: {
    id: "einstein",
    name: "Einstein",
    tagline: "The Thought-Experimenter",
    description:
      "Imagination beats knowledge every time. You'd rather ride a beam of light in your head for an hour than attend six status meetings.",
    icon: Atom,
    accent: "#78716c",
  },
  arendt: {
    id: "arendt",
    name: "Arendt",
    tagline: "The Political Witness",
    description:
      "The scariest evil is thoughtless, not dramatic. You want to name what's happening clearly enough that people can't un-see it.",
    icon: ScrollText,
    accent: "#57534e",
  },
  wittgenstein: {
    id: "wittgenstein",
    name: "Wittgenstein",
    tagline: "The Language Debugger",
    description:
      "Half of every argument is two people using the same word to mean different things. Fix that, and most of the argument disappears.",
    icon: Languages,
    accent: "#64748b",
  },
  kant: {
    id: "kant",
    name: "Kant",
    tagline: "The System Builder",
    description:
      "Dare to know. You want the framework that contains every other framework — and you'll rewrite the axioms if that's what it takes.",
    icon: Scale,
    accent: "#475569",
  },
  aristotle: {
    id: "aristotle",
    name: "Aristotle",
    tagline: "The Empiricist",
    description:
      "Excellence is a habit. You trust what you can observe, repeat, and teach — and you suspect theories that have never met a real object.",
    icon: Compass,
    accent: "#059669",
  },
  arnold: {
    id: "arnold",
    name: "Arnold",
    tagline: "The UX Provocateur",
    description:
      "You love the work enough to tell it the truth. Your critique leaves people sharper, not softer — and the work always ends up better for it.",
    icon: Megaphone,
    accent: "#e11d48",
  },
  zoltan: {
    id: "zoltan",
    name: "Zoltán",
    tagline: "The Lone Builder",
    description:
      "Long walks, cold tea, small cadence. You've been building in public long enough to know that the audience comes back when the work stays honest.",
    icon: Home,
    accent: "#d97706",
  },
  confucius: {
    id: "confucius",
    name: "Confucius",
    tagline: "The Patient Teacher",
    description:
      "It does not matter how slowly you go, as long as you do not stop. You measure your life in students, not milestones.",
    icon: GraduationCap,
    accent: "#b91c1c",
  },
  buddha: {
    id: "buddha",
    name: "Buddha",
    tagline: "The Still One",
    description:
      "Peace comes from within. You don't chase the answer — you sit with the question until it answers itself.",
    icon: Leaf,
    accent: "#ca8a04",
  },
  nietzsche: {
    id: "nietzsche",
    name: "Nietzsche",
    tagline: "The Unfashionable Voice",
    description:
      "He who has a why can bear almost any how. You make the thing nobody asked for — and it turns out to be the thing that was missing.",
    icon: Flame,
    accent: "#9f1239",
  },
  plato: {
    id: "plato",
    name: "Plato",
    tagline: "The Ideal-Seer",
    description:
      "You can see the shape the world ought to be — clean geometry under messy reality — and you're willing to spend a lifetime dragging the real closer to the ideal.",
    icon: Eye,
    accent: "#7c3aed",
  },
  musk: {
    id: "musk",
    name: "Musk",
    tagline: "The Shipper",
    description:
      "When something is important enough, you do it even if the odds are against you. Criticise the plan all you want — you'll be on the next one before the feedback lands.",
    icon: Rocket,
    accent: "#0ea5e9",
  },
  gates: {
    id: "gates",
    name: "Gates",
    tagline: "The Quiet Operator",
    description:
      "Your unhappy customers are your best teachers. You prefer the decade-long compound to the week-long sprint — and you'd rather fund the fix than lead the parade.",
    icon: Gift,
    accent: "#0284c7",
  },
  trump: {
    id: "trump",
    name: "Trump",
    tagline: "The Dealmaker",
    description:
      "Think big, close loud. You read a room in thirty seconds and the room usually knows it. A deal nobody thought was possible is the kind you like best.",
    icon: Crown,
    accent: "#ef4444",
  },
};

interface QuizOption {
  label: string;
  personas: PersonaId[];
}

interface QuizQuestionData {
  id: number;
  prompt: string;
  options: QuizOption[];
}

const QUESTIONS: QuizQuestionData[] = [
  {
    id: 1,
    prompt: "A complex AI agent just failed a test. Your first move?",
    options: [
      {
        label: "Restate the system boundary — most bugs collapse once framed right",
        personas: ["erdos"],
      },
      {
        label: "Ask the LLM to explain its logic step-by-step until it finds the flaw",
        personas: ["socrates"],
      },
      { label: "Write a failing reproduction script with exact steps", personas: ["peti"] },
      {
        label: "Refuse the premise — the entire architecture is wrong",
        personas: ["diogenes"],
      },
    ],
  },
  {
    id: 2,
    prompt: "You need to ship a new feature by Friday. What's your approach?",
    options: [
      {
        label: "Define the exact Zod schemas before writing a line of code",
        personas: ["spinoza"],
      },
      { label: "Vibe-code the prototype while the inspiration is fresh", personas: ["camus"] },
      { label: "Run a thought experiment on how the database might scale", personas: ["einstein"] },
      {
        label: "Audit who wrote the legacy code and why they made those trade-offs",
        personas: ["arendt"],
      },
    ],
  },
  {
    id: 3,
    prompt: "Your ideal code review ends with...",
    options: [
      {
        label: "Refactored variable names — we were confusing two concepts",
        personas: ["wittgenstein"],
      },
      {
        label: "A new overarching design pattern that unifies both approaches",
        personas: ["kant"],
      },
      { label: "An empirical A/B test because data beats opinions", personas: ["aristotle"] },
      { label: "The developer walking away sharper, not softer", personas: ["arnold"] },
    ],
  },
  {
    id: 4,
    prompt: "Your perfect weekend side project involves...",
    options: [
      { label: "Zero notifications, and building a tool from scratch alone", personas: ["zoltan"] },
      {
        label: "Reading the original source code of a legendary framework",
        personas: ["confucius"],
      },
      {
        label: "Sitting still until the perfect architecture reveals itself",
        personas: ["buddha"],
      },
      { label: "Building a controversial app that nobody asked for", personas: ["nietzsche"] },
    ],
  },
  {
    id: 5,
    prompt: "A SaaS tool just raised its prices again. What next?",
    options: [
      { label: "Design the ideal open-source architecture to replace it", personas: ["plato"] },
      { label: "Build an MVP clone over the weekend and launch it loudly", personas: ["musk"] },
      { label: "Write a blog post exposing their lock-in tactics", personas: ["arendt"] },
      { label: "Quietly fund an open-source team to outlast them", personas: ["gates"] },
    ],
  },
  {
    id: 6,
    prompt: "What is your ultimate goal when building software?",
    options: [
      { label: "Mentoring junior devs who will code better than I do", personas: ["confucius"] },
      { label: "Having the courage to ship raw, unfashionable ideas", personas: ["nietzsche"] },
      {
        label: "A core library that thousands depend on without knowing my name",
        personas: ["erdos"],
      },
      { label: "A massive exit and a deal no one thought was possible", personas: ["trump"] },
    ],
  },
];

type Scores = Record<PersonaId, number>;

function emptyScores(): Scores {
  return {
    erdos: 0,
    socrates: 0,
    peti: 0,
    diogenes: 0,
    spinoza: 0,
    camus: 0,
    einstein: 0,
    arendt: 0,
    wittgenstein: 0,
    kant: 0,
    aristotle: 0,
    arnold: 0,
    zoltan: 0,
    confucius: 0,
    buddha: 0,
    nietzsche: 0,
    plato: 0,
    musk: 0,
    gates: 0,
    trump: 0,
  };
}

export function computeQuizWinner(answers: number[]): PersonaId | null {
  if (answers.length !== QUESTIONS.length) return null;
  const scores = emptyScores();
  const order: PersonaId[] = [];
  const seen = new Set<PersonaId>();
  answers.forEach((optionIdx, qIdx) => {
    const question = QUESTIONS[qIdx];
    if (!question) return;
    const option = question.options[optionIdx];
    if (!option) return;
    option.personas.forEach((p) => {
      scores[p] += 1;
      if (!seen.has(p)) {
        seen.add(p);
        order.push(p);
      }
    });
  });
  const first = order[0];
  if (!first) return null;
  let best: PersonaId = first;
  for (const id of order) {
    if (scores[id] > scores[best]) best = id;
  }
  return best;
}

export default function LandingQuiz() {
  const [answers, setAnswers] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  const current = answers.length;
  const done = current >= QUESTIONS.length;
  const currentQuestion = QUESTIONS[current];
  const winner = useMemo(() => (done ? computeQuizWinner(answers) : null), [done, answers]);

  const handleAnswer = useCallback((optionIdx: number) => {
    setAnswers((prev) => [...prev, optionIdx]);
  }, []);

  const handleReset = useCallback(() => {
    setAnswers([]);
    setCopied(false);
  }, []);

  const handleShare = useCallback(async () => {
    if (!winner) return;
    const persona = PERSONAS[winner];
    const url = "https://spike.land/";
    const text = `I am ${persona.name} on spike.land — ${persona.tagline}.`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "spike.land", text, url });
        return;
      } catch {
        /* fall through to clipboard */
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* silent */
      }
    }
  }, [winner]);

  const progressPct = Math.round((current / QUESTIONS.length) * 100);

  return (
    <div className="lq-root">
      <div className="lq-header">
        <p className="rubik-eyebrow">60-second quiz</p>
        <h2 className="lq-title">Which mind in the Arena are you?</h2>
        <p className="lq-sub">
          Six quick questions. One persona from our Arena of 26. One conversation worth having
          tonight.
        </p>
      </div>

      <div className="lq-body">
        {!done && currentQuestion && (
          <QuizCard
            question={currentQuestion}
            currentIndex={current}
            total={QUESTIONS.length}
            progressPct={progressPct}
            onAnswer={handleAnswer}
          />
        )}
        {done && winner && (
          <QuizResult
            persona={PERSONAS[winner]}
            onShare={handleShare}
            onReset={handleReset}
            copied={copied}
          />
        )}
      </div>
    </div>
  );
}

interface QuizCardProps {
  question: QuizQuestionData;
  currentIndex: number;
  total: number;
  progressPct: number;
  onAnswer: (optionIdx: number) => void;
}

function QuizCard({ question, currentIndex, total, progressPct, onAnswer }: QuizCardProps) {
  return (
    <div className="lq-card rubik-panel">
      <div className="lq-progress-row">
        <span className="lq-progress-label">
          Question {currentIndex + 1} of {total}
        </span>
        <div
          className="lq-progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPct}
          aria-label="Quiz progress"
        >
          <div className="lq-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <h3 className="lq-prompt">{question.prompt}</h3>

      <div className="lq-options">
        {question.options.map((option, idx) => (
          <button
            key={`${question.id}-${idx}`}
            type="button"
            onClick={() => onAnswer(idx)}
            className="lq-option"
          >
            <span className="lq-option-label">{option.label}</span>
            <ChevronRight size={16} strokeWidth={2.25} />
          </button>
        ))}
      </div>
    </div>
  );
}

interface QuizResultProps {
  persona: Persona;
  onShare: () => void;
  onReset: () => void;
  copied: boolean;
}

function QuizResult({ persona, onShare, onReset, copied }: QuizResultProps) {
  const Icon = persona.icon;
  const accentStyle = { "--lq-accent": persona.accent } as CSSProperties;
  const href = `/${persona.id}`;
  const ctaLabel = `Talk to ${persona.name}`;

  return (
    <div className="lq-result rubik-panel" style={accentStyle}>
      <div className="lq-result-header">
        <div className="lq-result-icon">
          <Icon size={28} strokeWidth={2} />
        </div>
        <div>
          <p className="lq-result-eyebrow">You are</p>
          <h3 className="lq-result-name">{persona.name}</h3>
          <p className="lq-result-tagline">{persona.tagline}</p>
        </div>
      </div>

      <p className="lq-result-desc">{persona.description}</p>

      <div className="lq-result-actions">
        <a href={href} className="lq-btn lq-btn-primary">
          {ctaLabel}
          <ChevronRight size={16} strokeWidth={2.5} />
        </a>
        <a href="/arena" className="lq-btn lq-btn-secondary">
          See all 26
        </a>
        <button type="button" onClick={onShare} className="lq-btn lq-btn-secondary">
          {copied ? <Check size={16} strokeWidth={2.5} /> : <Share2 size={16} strokeWidth={2.25} />}
          {copied ? "Copied" : "Share"}
        </button>
        <button type="button" onClick={onReset} className="lq-btn lq-btn-ghost">
          <RotateCcw size={16} strokeWidth={2.25} />
          Retake
        </button>
      </div>
    </div>
  );
}
