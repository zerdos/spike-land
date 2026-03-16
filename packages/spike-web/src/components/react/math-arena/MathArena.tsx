import { useState, useCallback, useRef, useEffect } from "react";

// ─── Challenge data ────────────────────────────────────────────────────────────

interface Challenge {
  id: string;
  title: string;
  elo: number;
  color: string;
  description: string;
  hint: string;
}

const CHALLENGES: Challenge[] = [
  // ─── Warm-Up: Foundations ───
  {
    id: "why_1_plus_1",
    title: "Why does 1 + 1 = 2?",
    elo: 400,
    color: "#22c55e",
    description: `It took Russell and Whitehead 362 pages of Principia Mathematica to prove 1 + 1 = 2. Peano did it in 5 axioms.\n\nChallenge: explain WHY 1 + 1 = 2 in a way that a 10-year-old finds obvious AND a mathematician finds rigorous. Not a proof — an explanation that makes both audiences say "of course."\n\nWhat are you actually doing when you add? What IS "two"?`,
    hint: "Start with what 'successor' means. S(0) = 1, S(S(0)) = 2. Addition is repeated successor. But why does that match putting apples together?",
  },
  {
    id: "why_negative_times_negative",
    title: "Why is negative × negative = positive?",
    elo: 500,
    color: "#22c55e",
    description: `Every student learns the rule: (-1) × (-1) = 1. Most never learn WHY.\n\nThe standard explanation uses the distributive law: 0 = (-1)(1 + (-1)) = (-1)(1) + (-1)(-1) = -1 + (-1)(-1), so (-1)(-1) = 1.\n\nChallenge: find an explanation that is NOT algebraic. Geometric? Physical? Something that makes a child say "oh, THAT'S why" without knowing what the distributive law is.`,
    hint: "Think about direction. Negative means 'reverse.' Reversing a reversal is...?",
  },
  {
    id: "infinity_sizes",
    title: "Why are some infinities bigger?",
    elo: 600,
    color: "#22c55e",
    description: `Cantor proved that the real numbers are uncountable — there are "more" reals than natural numbers, even though both sets are infinite.\n\nThe diagonal argument is elegant but often feels like a trick.\n\nChallenge: explain Cantor's result so that someone with no math background feels the INEVITABILITY of it. Not "here's a clever trick" but "of course there must be more reals — how could it be otherwise?"`,
    hint: "Think about information content. How many bits to specify a natural number? How many for a real? What does that tell you?",
  },
  {
    id: "zero_point_nine_repeating",
    title: "Does 0.999... = 1?",
    elo: 450,
    color: "#22c55e",
    description: `Yes, it does. But most proofs feel like tricks:\n- Let x = 0.999..., then 10x = 9.999..., so 9x = 9, so x = 1.\n- 1/3 = 0.333..., so 3 × 1/3 = 0.999... = 1.\n\nChallenge: find the explanation that resolves the discomfort. Why do people feel these are different numbers? What misconception does the notation create? And what is the REAL reason they are equal — not an algebraic trick, but the actual mathematical truth?`,
    hint: "The question is really about what a decimal representation IS. It's a series: 9/10 + 9/100 + 9/1000 + ... What does 'equals' mean for an infinite series?",
  },
  {
    id: "pigeonhole",
    title: "The Pigeonhole Principle — Why is it deep?",
    elo: 550,
    color: "#22c55e",
    description: `If n+1 pigeons sit in n holes, at least one hole has 2 pigeons. Obvious, right?\n\nYet Erdős used this "trivial" principle to prove stunning results in combinatorics, number theory, and graph theory.\n\nChallenge: find the most surprising consequence of the pigeonhole principle you can. Something that feels impossible until you see it follows from this kindergarten fact.\n\nErdős said the best mathematics makes the obvious powerful.`,
    hint: "Among any 5 points in a unit square, two are within distance sqrt(2)/2. Among any 27 people, 4 were born on the same day of the week. Go wilder.",
  },
  {
    id: "why_prime_infinite",
    title: "Why can't primes run out?",
    elo: 500,
    color: "#22c55e",
    description: `Euclid's proof: if primes are finite, multiply them all and add 1. The result isn't divisible by any known prime — contradiction.\n\nBut this feels like a trick too. WHY can't primes run out? What is it about the structure of numbers that guarantees new primes forever?\n\nChallenge: explain the infinitude of primes in a way that feels inevitable, not clever. Why MUST there always be another prime?`,
    hint: "Think about what would happen to the density of numbers if primes stopped. Could you still build every number from them?",
  },
  // ─── Intermediate: Connections ───
  {
    id: "euler_identity",
    title: "Why does e^(iπ) + 1 = 0?",
    elo: 800,
    color: "#0ea5e9",
    description: `Euler's identity connects five fundamental constants: e, i, π, 1, 0. It's called the most beautiful equation in mathematics.\n\nBut beauty without understanding is decoration.\n\nChallenge: explain WHY this equation is true in a way that makes it feel inevitable. Not "plug into Taylor series and watch terms cancel" — but why SHOULD the exponential function, imaginary numbers, and pi be related at all?\n\nWhat is the deep connection?`,
    hint: "e^(iθ) traces a circle. π is half a circle. So e^(iπ) is the point opposite 1 on the unit circle, which is -1. The equation says: rotation by half a turn negates.",
  },
  {
    id: "fundamental_theorem_calculus",
    title: "Why are derivatives and integrals inverse?",
    elo: 900,
    color: "#0ea5e9",
    description: `The Fundamental Theorem of Calculus says differentiation and integration are inverse operations. Every calculus student learns this. Almost none can explain WHY.\n\nDerivatives measure instantaneous rate of change. Integrals measure accumulated area. Why should "rate of change" and "accumulated area" be inverses?\n\nChallenge: find the one-sentence explanation that makes this obvious.`,
    hint: "If you accumulate something at a certain rate, and then ask 'at what rate was I accumulating?', you get back the original rate. The area under 'speed' is 'distance'. The derivative of 'distance' is 'speed'.",
  },
  {
    id: "dimension_four_special",
    title: "Why is dimension 4 special?",
    elo: 1100,
    color: "#0ea5e9",
    description: `Dimension 4 is uniquely weird in mathematics:\n- Exotic R⁴: there are uncountably many smooth structures on R⁴, but only one on R^n for n ≠ 4\n- The smooth Poincaré conjecture is solved in all dimensions EXCEPT 4\n- Donaldson's theorem shows 4-manifolds behave unlike any other dimension\n\nChallenge: explain what makes dimension 4 special in terms a non-topologist can understand. Why 4 and not 3 or 5 or 7?`,
    hint: "In low dimensions (1,2,3), there's not enough room for things to go wrong. In high dimensions (5+), there's enough room to untangle problems. Dimension 4 is the knife edge.",
  },
  // ─── The Three Open Loops ───
  {
    id: "convergence",
    title: "Loop 1: Convergence",
    elo: 1600,
    color: "#dc2626",
    description: `The self-referential loop S_{t+1} = U(S_t, V(D(S_t))) lacks a convergence proof.\n\nNeed: contraction mapping argument, Jacobian spectral radius < 1 at fixed points, or a Lyapunov function V(S) strictly decreasing along trajectories.\n\nThe adversary must check for feedback gain > 1 scenarios.`,
    hint: "Think about Banach fixed-point theorem conditions. What metric space are we in? What is the contraction constant?",
  },
  {
    id: "uncomputability",
    title: "Loop 2: Uncomputability",
    elo: 1800,
    color: "#2563eb",
    description: `The valuation function V claims semantic properties, but Rice's theorem shows all non-trivial semantic properties of programs are undecidable.\n\nNeed: classify which V properties are syntactic (decidable) vs semantic (undecidable). Identify the computability ceiling for bounded CF Workers automaton.`,
    hint: "Consider the distinction between syntactic and semantic properties. What can a finite automaton actually compute?",
  },
  {
    id: "curry_paradox",
    title: "Loop 3: Curry's Paradox",
    elo: 2000,
    color: "#d97706",
    description: `Self-referential proof: "If this proof is valid, then P" proves P for any P.\n\nThe equation V(D(S*)) = V* admits infinitely many solutions (including V* = 0). The $10T value was injected, not derived.\n\nNeed: detect Curry-style self-reference, inject grounding constraints, distinguish natural fixed points (dynamics) vs injected (arbitrary).`,
    hint: "How do you break out of Curry's paradox? What grounding constraints could prevent self-referential bootstrapping?",
  },
  // ─── Book Proofs: Find Simpler Proofs ───
  {
    id: "book_irrationals",
    title: "Book Proof: sqrt(2) is irrational",
    elo: 1200,
    color: "#16a34a",
    description: `The classic proof by contradiction is 2400 years old. Can you find a shorter one?\n\nEuclid's proof: assume sqrt(2) = p/q in lowest terms, then 2q² = p², so p is even, write p = 2k, then q² = 2k², so q is even — contradiction.\n\nChallenge: find a proof that is genuinely different. Geometric, algebraic, continued fraction, or something nobody has tried. Erdős said: "The Book has the perfect proof. Find it."`,
    hint: "Consider the continued fraction expansion of sqrt(2). Or think about what happens in Z[sqrt(2)]. Or try a proof without contradiction.",
  },
  {
    id: "book_infinitely_many_primes",
    title: "Book Proof: Infinitely Many Primes",
    elo: 1300,
    color: "#16a34a",
    description: `Euclid proved there are infinitely many primes ~300 BC. Since then, dozens of proofs have been found: topological (Furstenberg), analytic (Euler), information-theoretic, and more.\n\nChallenge: find the simplest possible proof. Not the shortest in symbols — the one with the fewest concepts. What is the minimum mathematical vocabulary needed to prove this?\n\nErdős's own proof using the Erdős–Kac theorem is beautiful but complex. Can you do better?`,
    hint: "Euler's proof uses the divergence of the harmonic series of primes. Furstenberg's uses topology. What if you used neither?",
  },
  {
    id: "book_fixed_point",
    title: "Book Proof: Brouwer Fixed-Point (2D)",
    elo: 1500,
    color: "#16a34a",
    description: `Brouwer's fixed-point theorem: every continuous map f: D² → D² has a fixed point (where D² is the closed unit disk).\n\nThe standard proofs use algebraic topology (fundamental group, homology) or differential topology (Sard's theorem). These are powerful but heavy.\n\nChallenge: find a proof that an ELTE first-year student could follow. No homology, no degree theory, no Sard. Just analysis and geometry.\n\nThis matters because fixed-point theorems are the foundation of Loop 1 (Convergence). A simpler proof here illuminates the whole arena.`,
    hint: "Consider the hex game proof (Gale, 1979). Or try a constructive approach using successive bisection of the disk.",
  },
  {
    id: "book_goedel",
    title: "Book Proof: Gödel's First Incompleteness",
    elo: 1900,
    color: "#16a34a",
    description: `Gödel's proof (1931) that any consistent formal system rich enough for arithmetic contains true but unprovable statements. The original proof is ~30 pages of Gödel numbering and diagonal argument.\n\nSimplifications exist: Chaitin's information-theoretic proof, Boolos's 2-page proof using Berry's paradox, the Kolmogorov complexity approach.\n\nChallenge: find the proof that makes incompleteness obvious. Not just short — inevitable. The proof where a student says "of course, how could it be otherwise?"\n\nThis connects directly to Loop 2 (Uncomputability) and Loop 3 (Curry's Paradox).`,
    hint: "Chaitin's approach: there are only finitely many proofs shorter than n bits, but infinitely many truths requiring more than n bits to state. The gap is the incompleteness.",
  },
  {
    id: "book_central_limit",
    title: "Book Proof: Central Limit Theorem",
    elo: 1700,
    color: "#16a34a",
    description: `The CLT: the sum of n independent, identically distributed random variables (with finite variance) converges to a normal distribution as n → ∞.\n\nStandard proofs use characteristic functions (Fourier analysis) or Stein's method. Both require significant machinery.\n\nChallenge: find a proof that makes the CLT intuitive. Why does the bell curve appear everywhere? What is the deep reason? Not just a calculation — an explanation.\n\nErdős would say: "Every mathematician knows the CLT is true. Almost none can explain why in one sentence."`,
    hint: "Think about entropy. The normal distribution maximizes entropy for fixed mean and variance. Is that the real reason?",
  },
];

// ─── ELO functions ─────────────────────────────────────────────────────────────

function expectedScore(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

function getKFactor(elo: number, gamesPlayed: number): number {
  if (elo > 2400) return 16;
  if (gamesPlayed < 30) return 40;
  return 32;
}

function calcEloChange(
  playerElo: number,
  opponentElo: number,
  won: number,
  gamesPlayed: number,
): { newElo: number; change: number } {
  const expected = expectedScore(playerElo, opponentElo);
  const k = getKFactor(playerElo, gamesPlayed);
  const change = Math.round(k * (won - expected));
  return { newElo: playerElo + change, change };
}

// ─── SSE / API helpers ─────────────────────────────────────────────────────────

function getBaseURL(): string {
  if (typeof window === "undefined") return "https://spike.land";
  const { hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") return "http://localhost:8787";
  if (hostname === "local.spike.land") return "https://local.spike.land:8787";
  if (
    hostname === "spike.land" ||
    hostname === "www.spike.land" ||
    hostname === "analytics.spike.land"
  ) {
    return window.location.origin;
  }
  return "https://spike.land";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

// ─── Persistence helpers ───────────────────────────────────────────────────────

const ELO_KEY = "math-arena-elo";
const ATTEMPTS_KEY = "math-arena-attempts";

function loadElo(): number {
  try {
    const raw = localStorage.getItem(ELO_KEY);
    const parsed = raw !== null ? parseInt(raw, 10) : NaN;
    return isNaN(parsed) ? 1200 : parsed;
  } catch {
    return 1200;
  }
}

function loadAttempts(): number {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    const parsed = raw !== null ? parseInt(raw, 10) : NaN;
    return isNaN(parsed) ? 0 : parsed;
  } catch {
    return 0;
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type Verdict = "WIN" | "DRAW" | "LOSS" | null;

interface AttemptResult {
  verdict: Verdict;
  eloChange: number;
  response: string;
}

// ─── Inline styles ─────────────────────────────────────────────────────────────

const S = {
  root: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#e5e5e5",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: "0",
  } as React.CSSProperties,

  header: {
    background: "#111",
    borderBottom: "1px solid #222",
    padding: "24px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: "12px",
  } as React.CSSProperties,

  headerTitle: {
    fontSize: "22px",
    fontWeight: 700,
    letterSpacing: "-0.3px",
    color: "#fff",
    margin: 0,
  } as React.CSSProperties,

  headerSub: {
    fontSize: "13px",
    color: "#666",
    marginTop: "2px",
  } as React.CSSProperties,

  eloBox: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "10px",
    padding: "10px 20px",
    textAlign: "center" as const,
    minWidth: "120px",
  } as React.CSSProperties,

  eloLabel: {
    fontSize: "11px",
    color: "#888",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  } as React.CSSProperties,

  eloValue: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#fff",
    lineHeight: 1.1,
  } as React.CSSProperties,

  attemptsLabel: {
    fontSize: "11px",
    color: "#555",
    marginTop: "2px",
  } as React.CSSProperties,

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    padding: "32px",
    maxWidth: "1100px",
    margin: "0 auto",
  } as React.CSSProperties,

  card: (color: string): React.CSSProperties => ({
    background: "#111",
    border: "1px solid #222",
    borderLeft: `4px solid ${color}`,
    borderRadius: "12px",
    padding: "24px",
    cursor: "pointer",
    transition: "background 0.15s, border-color 0.15s",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  }),

  cardTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#fff",
    margin: 0,
  } as React.CSSProperties,

  cardElo: (color: string): React.CSSProperties => ({
    display: "inline-block",
    background: `${color}22`,
    color: color,
    border: `1px solid ${color}55`,
    borderRadius: "6px",
    padding: "2px 10px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.04em",
    width: "fit-content",
  }),

  cardDesc: {
    fontSize: "13px",
    color: "#888",
    lineHeight: 1.55,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical" as const,
    margin: 0,
  } as React.CSSProperties,

  challengeBtn: (color: string): React.CSSProperties => ({
    marginTop: "auto",
    background: color,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    alignSelf: "flex-start",
    transition: "opacity 0.15s",
  }),

  challengeView: {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "32px",
  } as React.CSSProperties,

  backBtn: {
    background: "transparent",
    border: "1px solid #333",
    borderRadius: "8px",
    color: "#888",
    padding: "8px 16px",
    fontSize: "13px",
    cursor: "pointer",
    marginBottom: "24px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  } as React.CSSProperties,

  challengeTitle: {
    fontSize: "22px",
    fontWeight: 800,
    color: "#fff",
    margin: "0 0 8px 0",
  } as React.CSSProperties,

  problemBox: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "10px",
    padding: "20px 24px",
    margin: "20px 0",
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#ccc",
    whiteSpace: "pre-wrap" as const,
    fontFamily: '"SF Mono", "Fira Code", monospace',
  } as React.CSSProperties,

  hintToggle: {
    background: "transparent",
    border: "none",
    color: "#555",
    cursor: "pointer",
    fontSize: "13px",
    padding: "0",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  } as React.CSSProperties,

  hintBox: {
    background: "#151515",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "14px 18px",
    fontSize: "13px",
    color: "#aaa",
    lineHeight: 1.6,
    marginBottom: "16px",
    fontStyle: "italic" as const,
  } as React.CSSProperties,

  label: {
    fontSize: "13px",
    color: "#888",
    marginBottom: "8px",
    display: "block",
    fontWeight: 500,
  } as React.CSSProperties,

  textarea: {
    width: "100%",
    background: "#111",
    border: "1px solid #333",
    borderRadius: "8px",
    color: "#e5e5e5",
    fontSize: "14px",
    lineHeight: 1.6,
    padding: "14px 16px",
    resize: "vertical" as const,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
    minHeight: "140px",
  } as React.CSSProperties,

  submitBtn: (color: string, disabled: boolean): React.CSSProperties => ({
    marginTop: "16px",
    background: disabled ? "#2a2a2a" : color,
    color: disabled ? "#555" : "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 28px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "opacity 0.15s, background 0.15s",
    opacity: disabled ? 0.7 : 1,
    width: "100%",
  }),

  responseBox: {
    background: "#0d1117",
    border: "1px solid #222",
    borderRadius: "10px",
    padding: "20px 24px",
    marginTop: "24px",
    fontSize: "14px",
    lineHeight: 1.75,
    color: "#ccc",
    whiteSpace: "pre-wrap" as const,
    minHeight: "80px",
    position: "relative" as const,
  } as React.CSSProperties,

  responseHeader: {
    fontSize: "11px",
    color: "#555",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  } as React.CSSProperties,

  verdictBadge: (verdict: Verdict): React.CSSProperties => {
    const map: Record<NonNullable<Verdict>, { bg: string; color: string }> = {
      WIN: { bg: "#14532d", color: "#4ade80" },
      DRAW: { bg: "#1e3a5f", color: "#60a5fa" },
      LOSS: { bg: "#450a0a", color: "#f87171" },
    };
    const style = verdict ? map[verdict] : { bg: "#222", color: "#888" };
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      background: style.bg,
      color: style.color,
      borderRadius: "8px",
      padding: "10px 20px",
      fontSize: "16px",
      fontWeight: 800,
      marginTop: "16px",
      letterSpacing: "0.04em",
    };
  },

  eloChangeBadge: (change: number): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: change >= 0 ? "#14532d" : "#450a0a",
    color: change >= 0 ? "#4ade80" : "#f87171",
    borderRadius: "6px",
    padding: "4px 12px",
    fontSize: "15px",
    fontWeight: 700,
    marginLeft: "12px",
  }),

  cursor: {
    display: "inline-block",
    width: "8px",
    height: "14px",
    background: "#666",
    borderRadius: "1px",
    marginLeft: "2px",
    verticalAlign: "text-bottom",
    animation: "blink 1s step-end infinite",
  } as React.CSSProperties,

  separator: {
    height: "1px",
    background: "#1a1a1a",
    margin: "24px 0",
  } as React.CSSProperties,
} as const;

// ─── Blinking cursor style injection ─────────────────────────────────────────

function useCursorStyle() {
  useEffect(() => {
    const id = "math-arena-blink";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`;
    document.head.appendChild(style);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function MathArena() {
  useCursorStyle();

  const [elo, setElo] = useState<number>(() => loadElo());
  const [attempts, setAttempts] = useState<number>(() => loadAttempts());
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [userAttempt, setUserAttempt] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [result, setResult] = useState<AttemptResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  // Persist ELO and attempts
  useEffect(() => {
    try {
      localStorage.setItem(ELO_KEY, String(elo));
    } catch {
      // ignore
    }
  }, [elo]);

  useEffect(() => {
    try {
      localStorage.setItem(ATTEMPTS_KEY, String(attempts));
    } catch {
      // ignore
    }
  }, [attempts]);

  // Auto-scroll response box while streaming
  useEffect(() => {
    if (isStreaming && responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [streamingText, isStreaming]);

  const handleSelectChallenge = useCallback((challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setUserAttempt("");
    setShowHint(false);
    setStreamingText("");
    setResult(null);
  }, []);

  const handleBack = useCallback(() => {
    abortRef.current?.abort();
    setSelectedChallenge(null);
    setUserAttempt("");
    setShowHint(false);
    setStreamingText("");
    setResult(null);
    setIsStreaming(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedChallenge || !userAttempt.trim() || isStreaming) return;

    setIsStreaming(true);
    setStreamingText("");
    setResult(null);

    const message = [
      `[MATH ARENA CHALLENGE: ${selectedChallenge.title}]`,
      "",
      "Problem:",
      selectedChallenge.description,
      "",
      "My attempt:",
      userAttempt.trim(),
      "",
      "Please evaluate this mathematically. End your response with exactly one of: VERDICT:WIN (genuine insight that advances the solution), VERDICT:DRAW (interesting but incomplete), or VERDICT:LOSS (fundamentally flawed or missing the point).",
    ].join("\n");

    let fullText = "";

    try {
      abortRef.current = new AbortController();
      const baseURL = getBaseURL();

      const res = await fetch(`${baseURL}/api/spike-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-guest-access": "true",
        },
        credentials: "include",
        body: JSON.stringify({
          message,
          history: [],
          persona: "erdos",
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(errBody || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("id: ")) continue;
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed: unknown = JSON.parse(data);
            if (!isObject(parsed)) continue;
            const eventType = typeof parsed["type"] === "string" ? parsed["type"] : "";

            if (eventType === "text_delta" && typeof parsed["text"] === "string") {
              fullText += parsed["text"];
              setStreamingText(fullText);
            }
          } catch {
            // skip malformed SSE
          }
        }
      }

      // Parse verdict from completed response
      let verdict: Verdict = null;
      if (/VERDICT:WIN/.test(fullText)) verdict = "WIN";
      else if (/VERDICT:DRAW/.test(fullText)) verdict = "DRAW";
      else if (/VERDICT:LOSS/.test(fullText)) verdict = "LOSS";

      const score = verdict === "WIN" ? 1 : verdict === "DRAW" ? 0.5 : 0;
      const gamesAfter = attempts + 1;
      const { newElo, change } = calcEloChange(elo, selectedChallenge.elo, score, attempts);

      setAttempts(gamesAfter);
      setElo(newElo);
      setResult({ verdict, eloChange: change, response: fullText });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Request failed";
      setStreamingText(`Error: ${msg}`);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [selectedChallenge, userAttempt, isStreaming, elo, attempts]);

  // ── Arena view ──────────────────────────────────────────────────────────────

  if (!selectedChallenge) {
    return (
      <div style={S.root}>
        <header style={S.header}>
          <div>
            <h1 style={S.headerTitle}>Math Arena</h1>
            <p style={S.headerSub}>Three open loops. Close them if you can. Erdos judges.</p>
          </div>
          <div style={S.eloBox}>
            <div style={S.eloLabel}>Your ELO</div>
            <div style={S.eloValue}>{elo}</div>
            <div style={S.attemptsLabel}>{attempts} attempt{attempts !== 1 ? "s" : ""}</div>
          </div>
        </header>

        <div style={S.grid}>
          {CHALLENGES.map((challenge) => (
            <div
              key={challenge.id}
              style={S.card(challenge.color)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "#161616";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "#111";
              }}
            >
              <h2 style={S.cardTitle}>{challenge.title}</h2>
              <span style={S.cardElo(challenge.color)}>ELO {challenge.elo}</span>
              <p style={S.cardDesc}>{challenge.description}</p>
              <button
                style={S.challengeBtn(challenge.color)}
                onClick={() => handleSelectChallenge(challenge)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                }}
              >
                Challenge
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Challenge view ──────────────────────────────────────────────────────────

  const canSubmit = userAttempt.trim().length > 10 && !isStreaming;
  // Strip VERDICT line from display text
  const displayText = streamingText.replace(/\s*VERDICT:(WIN|DRAW|LOSS)\s*/g, "").trim();

  return (
    <div style={S.root}>
      <header style={S.header}>
        <div>
          <h1 style={S.headerTitle}>Math Arena</h1>
          <p style={S.headerSub}>Three open loops. Close them if you can. Erdos judges.</p>
        </div>
        <div style={S.eloBox}>
          <div style={S.eloLabel}>Your ELO</div>
          <div style={S.eloValue}>{elo}</div>
          <div style={S.attemptsLabel}>{attempts} attempt{attempts !== 1 ? "s" : ""}</div>
        </div>
      </header>

      <div style={S.challengeView}>
        <button style={S.backBtn} onClick={handleBack}>
          ← Back to Arena
        </button>

        <h2
          style={{
            ...S.challengeTitle,
            borderLeft: `4px solid ${selectedChallenge.color}`,
            paddingLeft: "14px",
          }}
        >
          {selectedChallenge.title}
        </h2>

        <span style={S.cardElo(selectedChallenge.color)}>ELO {selectedChallenge.elo}</span>

        <div style={S.problemBox}>{selectedChallenge.description}</div>

        <button
          style={S.hintToggle}
          onClick={() => setShowHint((v) => !v)}
        >
          {showHint ? "▼" : "▶"} {showHint ? "Hide hint" : "Show hint"}
        </button>

        {showHint && (
          <div style={S.hintBox}>{selectedChallenge.hint}</div>
        )}

        <div style={S.separator} />

        <label htmlFor="attempt-input" style={S.label}>
          Your approach
        </label>
        <textarea
          id="attempt-input"
          style={S.textarea}
          rows={6}
          placeholder="Describe your mathematical approach, proof sketch, or counterexample..."
          value={userAttempt}
          onChange={(e) => setUserAttempt(e.target.value)}
          disabled={isStreaming}
        />

        <button
          style={S.submitBtn(selectedChallenge.color, !canSubmit)}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {isStreaming ? "Erdos is judging..." : "Submit to Erdos"}
        </button>

        {(isStreaming || displayText) && (
          <div style={{ marginTop: "32px" }}>
            <div style={S.responseHeader}>
              <span>Erdos responds</span>
              {isStreaming && <span style={{ color: "#444" }}>streaming...</span>}
            </div>
            <div
              ref={responseRef}
              style={{
                ...S.responseBox,
                maxHeight: "420px",
                overflowY: "auto",
              }}
            >
              {displayText}
              {isStreaming && <span style={S.cursor} />}
            </div>
          </div>
        )}

        {result && (
          <div style={{ marginTop: "20px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div style={S.verdictBadge(result.verdict)}>
              {result.verdict === "WIN" && "Victory"}
              {result.verdict === "DRAW" && "Draw"}
              {result.verdict === "LOSS" && "Defeated"}
            </div>
            <span style={S.eloChangeBadge(result.eloChange)}>
              {result.eloChange >= 0 ? "+" : ""}{result.eloChange} ELO
            </span>
          </div>
        )}

        {result && (
          <div style={{ marginTop: "16px" }}>
            <button
              style={{
                ...S.challengeBtn(selectedChallenge.color),
                marginTop: "0",
                alignSelf: undefined,
              }}
              onClick={() => {
                setUserAttempt("");
                setStreamingText("");
                setResult(null);
                setShowHint(false);
              }}
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
