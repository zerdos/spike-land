import { useState, useCallback, useMemo, type ComponentType, type CSSProperties } from "react";
import {
  Activity,
  Brain,
  Check,
  ChevronRight,
  Headphones,
  Home,
  Megaphone,
  RotateCcw,
  Share2,
  ShieldCheck,
} from "lucide-react";

type PersonaId = "erdos" | "peti" | "daftpunk" | "zoltan" | "raju" | "arnold";

interface Persona {
  id: PersonaId;
  name: string;
  tagline: string;
  description: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  accent: string;
  appCta: { label: string; href: string };
}

const PERSONAS: Record<PersonaId, Persona> = {
  erdos: {
    id: "erdos",
    name: "The Erdős",
    tagline: "The Problem Poser",
    description:
      "You ask more questions than you answer. You walk into a room, drop a five-minute puzzle, and walk out. Collaboration is your oxygen.",
    icon: Brain,
    accent: "#6366f1",
    appCta: { label: "Meet Erdős", href: "/erdos" },
  },
  peti: {
    id: "peti",
    name: "The Peti",
    tagline: "The QA Obsessive",
    description:
      "Nothing ships until it is correct. You find bugs in other people's demos in the first thirty seconds — and then you file them with seventeen reproduction steps.",
    icon: ShieldCheck,
    accent: "#10b981",
    appCta: { label: "Meet Peti", href: "/peti" },
  },
  daftpunk: {
    id: "daftpunk",
    name: "The Daftpunk",
    tagline: "The Rhythmic Maker",
    description:
      "You ship at night. Style matters as much as function. Your commits have beats and your editor has a BPM display somewhere.",
    icon: Headphones,
    accent: "#ec4899",
    appCta: { label: "Meet Daftpunk", href: "/daftpunk" },
  },
  zoltan: {
    id: "zoltan",
    name: "The Zoltán",
    tagline: "The Lone Founder",
    description:
      "Dog on your lap. Cold tea. 3 AM commits. You have been building in public so long that the public stopped caring — and then quietly started again.",
    icon: Home,
    accent: "#f59e0b",
    appCta: { label: "Meet Zoltán", href: "/zoltan" },
  },
  raju: {
    id: "raju",
    name: "The Raju",
    tagline: "The Systems Operator",
    description:
      "You think in pipelines, uptime, and observability. A good Grafana dashboard is art. You trust graphs more than gut feel.",
    icon: Activity,
    accent: "#06b6d4",
    appCta: { label: "See Tools", href: "/tools" },
  },
  arnold: {
    id: "arnold",
    name: "The Arnold",
    tagline: "The PR Realist",
    description:
      "You care how the world sees the work. Shipping without a launch post is shipping into a void. You have written more titles than functions this quarter.",
    icon: Megaphone,
    accent: "#eab308",
    appCta: { label: "Meet Arnold", href: "/arnold" },
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
    prompt: "It is 3 AM. What are you doing?",
    options: [
      { label: "Whiteboarding a proof I just figured out", personas: ["erdos"] },
      { label: "Reproducing a bug I found at 9 PM", personas: ["peti"] },
      { label: "Mixing a new set at 128 BPM", personas: ["daftpunk"] },
      { label: "Writing a blog post nobody asked for", personas: ["zoltan"] },
    ],
  },
  {
    id: 2,
    prompt: "Something in production just broke. First move?",
    options: [
      { label: "I already filed the test case that predicted this", personas: ["peti"] },
      { label: "Check Grafana first, then the logs", personas: ["raju"] },
      { label: "Post about it publicly — transparency first", personas: ["arnold"] },
      { label: "Quietly push a fix at 2 AM", personas: ["zoltan"] },
    ],
  },
  {
    id: 3,
    prompt: "Your desk has:",
    options: [
      { label: "Two dogs and a cold tea", personas: ["zoltan"] },
      { label: "Headphones and a BPM display", personas: ["daftpunk"] },
      { label: "Three monitors full of dashboards", personas: ["raju"] },
      { label: "A notebook full of half-solved problems", personas: ["erdos"] },
    ],
  },
  {
    id: 4,
    prompt: "Pick a colour palette:",
    options: [
      { label: "Neon violet and chrome", personas: ["daftpunk"] },
      { label: "Terminal green on black", personas: ["peti"] },
      { label: "Amber lamp and warm wood", personas: ["zoltan"] },
      { label: "Whatever wins the LinkedIn CTR test", personas: ["arnold"] },
    ],
  },
  {
    id: 5,
    prompt: "The best metric is:",
    options: [
      { label: "99.99% uptime or do not talk to me", personas: ["raju"] },
      { label: "Bugs caught pre-release", personas: ["peti"] },
      { label: "Number of open problems I have posed", personas: ["erdos"] },
      { label: "Shares and newsletter signups", personas: ["arnold"] },
    ],
  },
  {
    id: 6,
    prompt: "Your ideal Saturday:",
    options: [
      { label: "Long walk with the dogs, phone on airplane mode", personas: ["zoltan"] },
      { label: "Chess tournament or a maths puzzle collab", personas: ["erdos"] },
      { label: "Forest-stage sunrise set", personas: ["daftpunk"] },
      { label: "Post-mortem review of last week's incident", personas: ["raju"] },
    ],
  },
];

type Scores = Record<PersonaId, number>;

function emptyScores(): Scores {
  return { erdos: 0, peti: 0, daftpunk: 0, zoltan: 0, raju: 0, arnold: 0 };
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
        <h2 className="lq-title">Which spike.land are you?</h2>
        <p className="lq-sub">Six quick questions. One persona. One thing worth trying tonight.</p>
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
        <a href={persona.appCta.href} className="lq-btn lq-btn-primary">
          {persona.appCta.label}
          <ChevronRight size={16} strokeWidth={2.5} />
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
