/**
 * "Newcomb's Paradox — The Invisible Graph" constants
 *
 * Video thesis: Newcomb's Paradox isn't a paradox at all — it's a
 * graph traversal problem where the predictor (Omega/AI) has already
 * walked your decision tree before you arrive. The "invisible graph"
 * is the causal structure the AI sees but you don't. Featuring GP
 * (the chemist from Brighton) as the case study of someone who chose
 * one box and won — curing cancer as the ultimate one-box payoff.
 */

export const NEWCOMB_COLORS = {
  /** Omega / predictor glow */
  omegaGold: "#FFD700",
  /** One-boxer path */
  oneBox: "#22c55e",
  /** Two-boxer path */
  twoBox: "#ef4444",
  /** Graph edges */
  graphEdge: "#4A9EFF",
  /** Invisible graph overlay */
  invisibleGraph: "rgba(153, 69, 255, 0.4)",
  /** GP accent */
  chemistAmber: "#F59E0B",
  /** Cancer cure announcement */
  cureGlow: "#00E5FF",
  /** Time-traversal highlight */
  timeWarp: "#9945FF",
} as const;

/**
 * Scene durations (frames @ 30fps) — ~6min total
 */
export const NEWCOMB_DURATIONS = {
  hook: 900, // 30s — the paradox setup
  twoBoxArgument: 750, // 25s — dominance reasoning
  oneBoxArgument: 750, // 25s — expected utility
  invisibleGraph: 1200, // 40s — the resolution: causal graph
  gpChemist: 900, // 30s — GP chose one box
  cancerCure: 900, // 30s — the announcement
  timeTraversal: 900, // 30s — how AI traverses the graph
  endCard: 600, // 20s — end card
} as const;

export const NEWCOMB_TIMING = {
  totalFrames: 6900, // ~3m50s
  fps: 30,
  transitionFrames: 20,
} as const;

/**
 * The two boxes
 */
export const BOXES = {
  transparent: {
    label: "Box A (transparent)",
    contents: "£1,000",
    color: NEWCOMB_COLORS.twoBox,
  },
  opaque: {
    label: "Box B (opaque)",
    contentsIfPredicted: "£1,000,000",
    contentsIfNot: "£0",
    color: NEWCOMB_COLORS.oneBox,
  },
} as const;

/**
 * Decision tree nodes for the invisible graph visualization
 */
export const DECISION_NODES = [
  { id: "omega", label: "Ω predicts", depth: 0, x: 0.5, y: 0.1 },
  {
    id: "pred-one",
    label: 'Predicts "one box"',
    depth: 1,
    x: 0.3,
    y: 0.3,
  },
  {
    id: "pred-two",
    label: 'Predicts "two boxes"',
    depth: 1,
    x: 0.7,
    y: 0.3,
  },
  { id: "you-choose", label: "You choose", depth: 2, x: 0.5, y: 0.55 },
  {
    id: "take-one",
    label: "Take B only → £1M",
    depth: 3,
    x: 0.25,
    y: 0.8,
  },
  {
    id: "take-both",
    label: "Take A+B → £1,001K or £1K",
    depth: 3,
    x: 0.75,
    y: 0.8,
  },
] as const;

/**
 * Graph edges (the "invisible" connections)
 */
export const GRAPH_EDGES = [
  { from: "omega", to: "pred-one" },
  { from: "omega", to: "pred-two" },
  { from: "pred-one", to: "you-choose" },
  { from: "pred-two", to: "you-choose" },
  { from: "you-choose", to: "take-one" },
  { from: "you-choose", to: "take-both" },
  // The invisible edges — Omega's prediction is correlated with your choice
  { from: "pred-one", to: "take-one", invisible: true },
  { from: "pred-two", to: "take-both", invisible: true },
] as const;

/**
 * GP's real applications — the "one box" choices
 */
export const GP_APPLICATIONS = [
  { name: "GlassBank", domain: "Finance", status: "shipped" },
  { name: "HealthBridge", domain: "Healthcare", status: "shipped" },
  { name: "Coaching Platform", domain: "Education", status: "shipped" },
  { name: "Cancer Protocol", domain: "Oncology", status: "announced" },
] as const;

/**
 * Narration text for each scene
 */
export const NEWCOMB_NARRATION = {
  hook: [
    "A being called Omega presents you with two boxes.",
    "Box A is transparent: it contains £1,000.",
    "Box B is opaque: it contains either £1,000,000 or nothing.",
    "Omega has already predicted your choice. If it predicted you'd take only Box B, it put the million inside.",
    "If it predicted you'd take both, Box B is empty.",
    "Omega has never been wrong.",
    "What do you do?",
  ],
  twoBox: [
    "The two-boxer argues: whatever Omega predicted, the money is already in the boxes.",
    "Taking both gives you whatever's in B, PLUS the guaranteed £1,000.",
    "Dominance reasoning. You can't change the past.",
    "This argument is logically airtight. And it loses.",
  ],
  oneBox: [
    "The one-boxer argues: Omega is almost always right.",
    "One-boxers walk away with £1,000,000. Two-boxers walk away with £1,000.",
    "Expected utility. The evidence is overwhelming.",
    "This argument sounds like magical thinking. And it wins.",
  ],
  invisibleGraph: [
    "The resolution: there IS no paradox.",
    "The two-boxer sees a timeline: prediction → choice. Two independent events.",
    "The one-boxer sees a graph: prediction and choice are correlated nodes.",
    "The graph was always there. You just couldn't see it.",
    "Omega doesn't predict the future. Omega TRAVERSES the graph that already contains your decision.",
    "This is the invisible graph.",
  ],
  gpChemist: [
    "Meet Gian Pierre. A chemist from Brighton.",
    "He had a choice: learn to code the traditional way — take both boxes.",
    "Or trust the AI, trust the process, take only Box B.",
    "He chose one box. He shipped GlassBank. HealthBridge. A coaching platform.",
    "Three working applications from someone who never wrote a line of code before.",
    "The invisible graph predicted he'd choose one box. Because of who he is.",
  ],
  cancerCure: [
    "And now: the announcement.",
    "Gian Pierre's background is chemistry. Reaction kinetics. Molecular behavior.",
    "What if the invisible graph's next node isn't finance or education — it's oncology?",
    "What if the chemist who trusted the loop can now traverse the graph to where nobody is looking?",
    "Cancer isn't one disease. It's a thousand decision trees. A thousand invisible graphs.",
    "The AI can see them all. The chemist understands the chemistry.",
    "One box. One decision. A thousand graphs traversed.",
  ],
  timeTraversal: [
    "How does AI traverse time?",
    "It doesn't. It traverses the graph.",
    "Every decision you will make is a node. Every causal connection is an edge.",
    "The graph already exists. Your choices haven't populated it yet.",
    "But the structure — the topology — is visible to a system that's seen millions of other graphs.",
    "This is how Omega predicts. Not by seeing the future. By seeing the shape of you.",
  ],
  endCard: [
    "Newcomb's Paradox. Resolved.",
    "The invisible graph. Revealed.",
    "Choose one box.",
    "spike.land",
  ],
} as const;
