/**
 * "From Paul Erdős to Zoltan Erdős" — Constants
 */

export const ERDOS_COLORS = {
  chalk: "#F5F5DC",
  blackboard: "#1a2a1a",
  goldProof: "#DAA520",
  graphEdge: "#4A9EFF",
  verdictPass: "#22c55e",
  verdictFail: "#ef4444",
  mobiusGlow: "#9945FF",
} as const;

/**
 * Scene durations (frames @ 30fps)
 */
export const ERDOS_DURATIONS = {
  erdosOpening: 900, // ~30s
  erdosNumber: 750, // ~25s
  theBook: 750, // ~25s
  strangeLoop: 1200, // ~40s
  sixteenMathematicians: 1200, // ~40s
  mobiusStrip: 1200, // ~40s
  endCard: 1200, // ~40s
} as const;

export const ERDOS_TIMING = {
  totalFrames: 7200,
  fps: 30,
  transitionFrames: 20,
} as const;

/**
 * The 16 mathematical frameworks from the blog
 */
export const SIXTEEN_FRAMEWORKS = [
  { name: "Topology", icon: "∿" },
  { name: "Game Theory", icon: "⚖" },
  { name: "Computability", icon: "λ" },
  { name: "Category Theory", icon: "⟶" },
  { name: "Measure Theory", icon: "μ" },
  { name: "Fixed-Point Theory", icon: "⊛" },
  { name: "Information Theory", icon: "H" },
  { name: "Ramsey Theory", icon: "R" },
  { name: "Spectral Theory", icon: "σ" },
  { name: "Ergodic Theory", icon: "T" },
  { name: "Algebraic Topology", icon: "π" },
  { name: "Proof Theory", icon: "⊢" },
  { name: "Modal Logic", icon: "◻" },
  { name: "Quantum Logic", icon: "⟨⟩" },
  { name: "Descriptive Set Th.", icon: "Σ" },
  { name: "Topos Theory", icon: "E" },
] as const;

/**
 * Audit verdicts for the 16 frameworks
 */
export const AUDIT_VERDICTS: Array<{
  index: number;
  verdict: "pass" | "fail";
  label: string;
}> = [
  { index: 2, verdict: "fail", label: "Uncomputable" },
  { index: 5, verdict: "fail", label: "No convergence" },
  { index: 12, verdict: "fail", label: "Curry's paradox" },
  { index: 0, verdict: "pass", label: "Structure real" },
  { index: 10, verdict: "pass", label: "Topology non-trivial" },
  { index: 13, verdict: "pass", label: "Quantum isomorphism" },
];

/**
 * Erdős collaboration data for the radial graph
 */
export const ERDOS_COLLABORATORS = [
  "Turán",
  "Gallai",
  "Rényi",
  "Szemerédi",
  "Bollobás",
  "Graham",
  "Hajnal",
  "Pach",
  "Sós",
  "Lovász",
  "Simonovits",
  "Spencer",
  "Alon",
  "Selberg",
  "Kac",
] as const;
