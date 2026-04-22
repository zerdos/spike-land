"use client";

import { useState, useCallback, useMemo, type ComponentType } from "react";
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
import { cn } from "@spike-land-ai/shared";
import { Link } from "../lazy-imports/link";

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
  icon: ComponentType<{ className?: string }>;
  colorClass: string;
  appCta: { label: string; href: string };
}

const PERSONAS: Record<PersonaId, Persona> = {
  erdos: {
    id: "erdos",
    name: "Erdős",
    tagline: "The Problem Poser",
    description:
      "Your brain is open. You ask sharper questions than most people answer. You'd trade a full inbox for one hour at a clean whiteboard with a hard problem.",
    icon: Brain,
    colorClass: "from-indigo-500 to-violet-500",
    appCta: { label: "Talk to Erdős", href: "/erdos" },
  },
  socrates: {
    id: "socrates",
    name: "Socrates",
    tagline: "The Question-Asker",
    description:
      "You don't argue — you ask, and the other person ends up arguing with themselves. Your favourite disagreement is the one that ends with both sides changing their minds.",
    icon: MessageCircle,
    colorClass: "from-amber-500 to-yellow-500",
    appCta: { label: "Talk to Socrates", href: "/socrates" },
  },
  peti: {
    id: "peti",
    name: "Peti",
    tagline: "The QA Realist",
    description:
      "Nothing ships until it is correct on mobile Safari at 2% battery. You file bugs with reproduction steps that read like forensic reports.",
    icon: ShieldCheck,
    colorClass: "from-emerald-500 to-teal-500",
    appCta: { label: "Talk to Peti", href: "/peti" },
  },
  diogenes: {
    id: "diogenes",
    name: "Diogenes",
    tagline: "The Premise-Refuser",
    description:
      "You'd rather live in a barrel than play a rigged game. When a problem is badly framed, you say so — loudly, publicly, with a lantern if needed.",
    icon: Lightbulb,
    colorClass: "from-yellow-600 to-amber-700",
    appCta: { label: "Talk to Diogenes", href: "/diogenes" },
  },
  spinoza: {
    id: "spinoza",
    name: "Spinoza",
    tagline: "The Rationalist",
    description:
      "Beauty doesn't mystify you — it clarifies. You want to understand exactly why the thing is good, from first principles, and then build something else that is.",
    icon: Sparkles,
    colorClass: "from-indigo-500 to-blue-500",
    appCta: { label: "Talk to Spinoza", href: "/spinoza" },
  },
  camus: {
    id: "camus",
    name: "Camus",
    tagline: "The Absurdist",
    description:
      "One must imagine Sisyphus happy. You write to hold on to the moments that keep slipping, and you suspect the writing is the only thing that makes them real.",
    icon: Feather,
    colorClass: "from-rose-500 to-red-500",
    appCta: { label: "Talk to Camus", href: "/camus" },
  },
  einstein: {
    id: "einstein",
    name: "Einstein",
    tagline: "The Thought-Experimenter",
    description:
      "Imagination beats knowledge every time. You'd rather ride a beam of light in your head for an hour than attend six status meetings.",
    icon: Atom,
    colorClass: "from-stone-500 to-stone-600",
    appCta: { label: "Talk to Einstein", href: "/einstein" },
  },
  arendt: {
    id: "arendt",
    name: "Arendt",
    tagline: "The Political Witness",
    description:
      "The scariest evil is thoughtless, not dramatic. You want to name what's happening clearly enough that people can't un-see it.",
    icon: ScrollText,
    colorClass: "from-stone-500 to-zinc-600",
    appCta: { label: "Talk to Arendt", href: "/arendt" },
  },
  wittgenstein: {
    id: "wittgenstein",
    name: "Wittgenstein",
    tagline: "The Language Debugger",
    description:
      "Half of every argument is two people using the same word to mean different things. Fix that, and most of the argument disappears.",
    icon: Languages,
    colorClass: "from-slate-500 to-slate-600",
    appCta: { label: "Talk to Wittgenstein", href: "/wittgenstein" },
  },
  kant: {
    id: "kant",
    name: "Kant",
    tagline: "The System Builder",
    description:
      "Dare to know. You want the framework that contains every other framework — and you'll rewrite the axioms if that's what it takes.",
    icon: Scale,
    colorClass: "from-slate-500 to-gray-600",
    appCta: { label: "Talk to Kant", href: "/kant" },
  },
  aristotle: {
    id: "aristotle",
    name: "Aristotle",
    tagline: "The Empiricist",
    description:
      "Excellence is a habit. You trust what you can observe, repeat, and teach — and you suspect theories that have never met a real object.",
    icon: Compass,
    colorClass: "from-emerald-500 to-green-600",
    appCta: { label: "Talk to Aristotle", href: "/aristotle" },
  },
  arnold: {
    id: "arnold",
    name: "Arnold",
    tagline: "The UX Provocateur",
    description:
      "You love the work enough to tell it the truth. Your critique leaves people sharper, not softer — and the work always ends up better for it.",
    icon: Megaphone,
    colorClass: "from-rose-500 to-pink-600",
    appCta: { label: "Talk to Arnold", href: "/arnold" },
  },
  zoltan: {
    id: "zoltan",
    name: "Zoltán",
    tagline: "The Lone Builder",
    description:
      "Long walks, cold tea, small cadence. You've been building in public long enough to know that the audience comes back when the work stays honest.",
    icon: Home,
    colorClass: "from-amber-500 to-orange-500",
    appCta: { label: "Talk to Zoltán", href: "/zoltan" },
  },
  confucius: {
    id: "confucius",
    name: "Confucius",
    tagline: "The Patient Teacher",
    description:
      "It does not matter how slowly you go, as long as you do not stop. You measure your life in students, not milestones.",
    icon: GraduationCap,
    colorClass: "from-red-600 to-rose-700",
    appCta: { label: "Talk to Confucius", href: "/confucius" },
  },
  buddha: {
    id: "buddha",
    name: "Buddha",
    tagline: "The Still One",
    description:
      "Peace comes from within. You don't chase the answer — you sit with the question until it answers itself.",
    icon: Leaf,
    colorClass: "from-yellow-500 to-amber-600",
    appCta: { label: "Talk to Buddha", href: "/buddha" },
  },
  nietzsche: {
    id: "nietzsche",
    name: "Nietzsche",
    tagline: "The Unfashionable Voice",
    description:
      "He who has a why can bear almost any how. You make the thing nobody asked for — and it turns out to be the thing that was missing.",
    icon: Flame,
    colorClass: "from-rose-700 to-red-800",
    appCta: { label: "Talk to Nietzsche", href: "/nietzsche" },
  },
  plato: {
    id: "plato",
    name: "Plato",
    tagline: "The Ideal-Seer",
    description:
      "You can see the shape the world ought to be — clean geometry under messy reality — and you're willing to spend a lifetime dragging the real closer to the ideal.",
    icon: Eye,
    colorClass: "from-violet-500 to-purple-600",
    appCta: { label: "Talk to Plato", href: "/plato" },
  },
  musk: {
    id: "musk",
    name: "Musk",
    tagline: "The Shipper",
    description:
      "When something is important enough, you do it even if the odds are against you. Criticise the plan all you want — you'll be on the next one before the feedback lands.",
    icon: Rocket,
    colorClass: "from-sky-500 to-cyan-600",
    appCta: { label: "Talk to Musk", href: "/musk" },
  },
  gates: {
    id: "gates",
    name: "Gates",
    tagline: "The Quiet Operator",
    description:
      "Your unhappy customers are your best teachers. You prefer the decade-long compound to the week-long sprint — and you'd rather fund the fix than lead the parade.",
    icon: Gift,
    colorClass: "from-sky-600 to-blue-600",
    appCta: { label: "Talk to Gates", href: "/gates" },
  },
  trump: {
    id: "trump",
    name: "Trump",
    tagline: "The Dealmaker",
    description:
      "Think big, close loud. You read a room in thirty seconds and the room usually knows it. A deal nobody thought was possible is the kind you like best.",
    icon: Crown,
    colorClass: "from-red-500 to-orange-600",
    appCta: { label: "Talk to Trump", href: "/trump" },
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
    prompt: "A hard problem just landed on the whiteboard. Your first move?",
    options: [
      {
        label: "Restate it more abstractly — most puzzles collapse once framed right",
        personas: ["erdos"],
      },
      {
        label: "Ask questions until the person who drew it doesn't recognise it anymore",
        personas: ["socrates"],
      },
      { label: "Build the smallest working version and iterate from there", personas: ["peti"] },
      {
        label: "Refuse the premise — it's the wrong problem to be solving",
        personas: ["diogenes"],
      },
    ],
  },
  {
    id: 2,
    prompt: "Something beautiful lands in front of you. You want to...",
    options: [
      { label: "understand exactly why it's beautiful, in formal terms", personas: ["spinoza"] },
      { label: "write about it before the feeling fades", personas: ["camus"] },
      { label: "picture how it works, then build your own version", personas: ["einstein"] },
      { label: "ask who paid for it and who got left out", personas: ["arendt"] },
    ],
  },
  {
    id: 3,
    prompt: "Your ideal argument ends with...",
    options: [
      { label: "clarified language — we were talking past each other", personas: ["wittgenstein"] },
      { label: "a new model that contains both positions", personas: ["kant"] },
      { label: "an experiment only one of us can run", personas: ["aristotle"] },
      { label: "one of us walking away sharper, not softer", personas: ["arnold"] },
    ],
  },
  {
    id: 4,
    prompt: "A good Saturday looks like...",
    options: [
      { label: "a long walk, phone off, nobody expecting you", personas: ["zoltan"] },
      { label: "reading something written before the year 500", personas: ["confucius"] },
      { label: "sitting still — really still — until the thoughts settle", personas: ["buddha"] },
      { label: "making something ugly that only you would love", personas: ["nietzsche"] },
    ],
  },
  {
    id: 5,
    prompt: "You notice a system is unfair. What next?",
    options: [
      { label: "Imagine how it ought to be, and design that", personas: ["plato"] },
      { label: "Build the alternative, ship it loud", personas: ["musk"] },
      { label: "Write what will make others see it too", personas: ["arendt"] },
      { label: "Fund the fix and outlast the regime", personas: ["gates"] },
    ],
  },
  {
    id: 6,
    prompt: "What do you want to leave behind?",
    options: [
      { label: "A generation of students who think sharper than I did", personas: ["confucius"] },
      { label: "The courage to say the unfashionable thing out loud", personas: ["nietzsche"] },
      { label: "A framework others use without knowing my name", personas: ["erdos"] },
      { label: "A deal no one thought was possible", personas: ["trump"] },
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
          Which mind in the Arena are you?
        </h2>
        <p className="mt-4 text-lg font-medium leading-8 text-muted-foreground">
          Six quick questions. One persona from our Arena of 26. One conversation worth having
          tonight.
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
