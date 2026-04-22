"use client";

import { useState, useCallback, useMemo, type ComponentType } from "react";
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
import { cn } from "@spike-land-ai/shared";
import { Link } from "../lazy-imports/link";

type PersonaId = "erdos" | "peti" | "daftpunk" | "zoltan" | "raju" | "arnold";

interface Persona {
  id: PersonaId;
  name: string;
  tagline: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  colorClass: string;
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
    colorClass: "from-violet-500 to-indigo-500",
    appCta: { label: "Try BugBook ELO", href: "/apps/bugbook" },
  },
  peti: {
    id: "peti",
    name: "The Peti",
    tagline: "The QA Obsessive",
    description:
      "Nothing ships until it is correct. You find bugs in other people's demos in the first thirty seconds — and then you file them with seventeen reproduction steps.",
    icon: ShieldCheck,
    colorClass: "from-emerald-500 to-teal-500",
    appCta: { label: "Try Code Review", href: "/apps/code-review" },
  },
  daftpunk: {
    id: "daftpunk",
    name: "The Daftpunk",
    tagline: "The Rhythmic Maker",
    description:
      "You ship at night. Style matters as much as function. Your commits have beats and your editor has a BPM display somewhere.",
    icon: Headphones,
    colorClass: "from-fuchsia-500 to-rose-500",
    appCta: { label: "Try Music Tools", href: "/music" },
  },
  zoltan: {
    id: "zoltan",
    name: "The Zoltán",
    tagline: "The Lone Founder",
    description:
      "Dog on your lap. Cold tea. 3 AM commits. You have been building in public so long that the public stopped caring — and then quietly started again.",
    icon: Home,
    colorClass: "from-amber-500 to-orange-500",
    appCta: { label: "Try Notepad", href: "/apps/notepad" },
  },
  raju: {
    id: "raju",
    name: "The Raju",
    tagline: "The Systems Operator",
    description:
      "You think in pipelines, uptime, and observability. A good Grafana dashboard is art. You trust graphs more than gut feel.",
    icon: Activity,
    colorClass: "from-cyan-500 to-blue-500",
    appCta: { label: "See Analytics", href: "/analytics" },
  },
  arnold: {
    id: "arnold",
    name: "The Arnold",
    tagline: "The PR Realist",
    description:
      "You care how the world sees the work. Shipping without a launch post is shipping into a void. You have written more titles than functions this quarter.",
    icon: Megaphone,
    colorClass: "from-yellow-500 to-amber-500",
    appCta: { label: "Read the Blog", href: "/blog" },
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
  return {
    erdos: 0,
    peti: 0,
    daftpunk: 0,
    zoltan: 0,
    raju: 0,
    arnold: 0,
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

export function LandingQuiz() {
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

  return (
    <section aria-labelledby="landing-quiz-heading" className="rubik-section rubik-container-wide">
      <div className="mx-auto max-w-2xl text-center">
        <p className="rubik-kicker text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-primary">
          60-second quiz
        </p>
        <h2
          id="landing-quiz-heading"
          className="mt-3 text-balance text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl"
        >
          Which spike.land are you?
        </h2>
        <p className="mt-4 text-lg font-medium leading-8 text-muted-foreground">
          Six quick questions. One persona. One app worth trying tonight.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl">
        {!done && currentQuestion && (
          <QuizCard
            question={currentQuestion}
            currentIndex={current}
            total={QUESTIONS.length}
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
    </section>
  );
}

interface QuizCardProps {
  question: QuizQuestionData;
  currentIndex: number;
  total: number;
  onAnswer: (optionIdx: number) => void;
}

function QuizCard({ question, currentIndex, total, onAnswer }: QuizCardProps) {
  const progress = ((currentIndex + 1) / total) * 100;
  return (
    <div className="rubik-panel rubik-panel-muted p-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <span>
            Question {currentIndex + 1} of {total}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <h3 className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
        {question.prompt}
      </h3>
      <div className="mt-6 grid gap-3">
        {question.options.map((option, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onAnswer(idx)}
            className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-background px-5 py-4 text-left text-base font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <span>{option.label}</span>
            <ChevronRight
              aria-hidden="true"
              className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
            />
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
  return (
    <div className="rubik-panel rubik-panel-muted overflow-hidden p-0">
      <div className={cn("relative h-32 bg-gradient-to-br", persona.colorClass)}>
        <div className="absolute inset-0 bg-black/10" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 translate-x-8 translate-y-1/2">
          <div className="flex size-20 items-center justify-center rounded-3xl border-4 border-background bg-background shadow-xl">
            <div
              className={cn(
                "flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br",
                persona.colorClass,
              )}
            >
              <Icon className="size-7 text-white" />
            </div>
          </div>
        </div>
      </div>
      <div className="px-8 pb-8 pt-16">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          You are
        </p>
        <h3 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
          {persona.name}
        </h3>
        <p className="mt-1 text-lg font-medium text-muted-foreground">{persona.tagline}</p>
        <p className="mt-5 text-base leading-7 text-foreground">{persona.description}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={persona.appCta.href}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            {persona.appCta.label}
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {copied ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <Share2 size={16} aria-hidden="true" />
            )}
            {copied ? "Copied" : "Share"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-2xl border border-transparent px-5 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw size={16} aria-hidden="true" />
            Retake
          </button>
        </div>
      </div>
    </div>
  );
}
