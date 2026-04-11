/**
 * Shared constants, types, and data for Rooftop Paradise rendering.
 * Used by both the orchestrator and worker threads.
 */

// ── Timing ──────────────────────────────────────────────────
export const BPM = 110;
export const BEAT = 60 / BPM;
export const STEP = BEAT / 4;
export const STEPS_BAR = 16;
export const BARS_ROUND = 4;
export const ROUNDS = 69;
export const STEPS_ROUND = STEPS_BAR * BARS_ROUND;
export const TOTAL_STEPS = ROUNDS * STEPS_ROUND;
export const TOTAL_SEC = TOTAL_STEPS * STEP;
export const AABA = [0, 0, 1, 0] as const;

// ── Chords (D major) ───────────────────────────────────────
export const CHORDS: Record<string, number[]> = {
  Dmaj7: [50, 62, 66, 69, 73],
  Gmaj7: [55, 59, 62, 66, 71],
  Bm7: [47, 50, 54, 57, 59],
  A: [45, 52, 57, 61, 64],
};
export const PROG = ["Dmaj7", "Gmaj7", "Bm7", "A"] as const;

// ── Phrases ─────────────────────────────────────────────────
export type Phrase = [number, number][];

export const HOOK: Phrase = [
  [71, 8],
  [69, 4],
  [66, 4],
  [62, 8],
  [0, 8],
];
export const HOOKB: Phrase = [
  [66, 8],
  [69, 8],
  [71, 4],
  [74, 4],
  [71, 8],
];
export const BASSA: Phrase = [
  [38, 8],
  [0, 4],
  [45, 4],
  [38, 4],
  [0, 4],
  [0, 8],
];
export const BASSB: Phrase = [
  [43, 8],
  [42, 4],
  [40, 4],
  [38, 8],
  [0, 8],
];
export const PIANOA: Phrase = [
  [62, 2],
  [64, 2],
  [66, 4],
  [69, 2],
  [66, 2],
  [64, 4],
  [62, 4],
  [0, 4],
];
export const PIANOB: Phrase = [
  [66, 4],
  [69, 2],
  [71, 2],
  [69, 4],
  [66, 2],
  [64, 2],
  [62, 8],
];
export const BEASTR: Phrase = [
  [62, 2],
  [0, 2],
  [62, 2],
  [59, 2],
  [57, 4],
  [59, 2],
  [0, 2],
  [62, 4],
];
export const PIANOLA = [50, 54, 57, 62, 57, 54, 50, 0];
export const PIANOLB = [55, 59, 62, 67, 62, 59, 55, 0];

// ── Layer presets ───────────────────────────────────────────
export const LP: Record<string, string[]> = {
  silent: ["pad"],
  whisper: ["pad", "melody"],
  gentle: ["pad", "melody", "piano"],
  deep: ["pad", "melody", "piano", "bass"],
  groove: ["pad", "melody", "bass", "piano", "kick"],
  drive: ["pad", "melody", "bass", "piano", "kick", "beast"],
  full: ["pad", "melody", "bass", "piano", "pianoL", "kick", "hat"],
  beast: ["pad", "padDbl", "melody", "bass", "piano", "kick", "hat", "beast"],
  peak: ["pad", "padDbl", "melody", "bass", "piano", "pianoL", "kick", "hat", "beast", "air"],
  air: ["pad", "melody", "piano", "air"],
  strip: ["pad", "melody"],
};

export const ARC_LAYERS = [
  "silent",
  "whisper",
  "gentle",
  "deep",
  "groove",
  "drive",
  "full",
  "beast",
  "peak",
  "peak",
  "peak",
  "peak",
  "air",
  "strip",
  "gentle",
  "deep",
  "groove",
  "drive",
  "full",
  "beast",
  "peak",
  "peak",
  "strip",
];

export const ARC_PERSONAS = [
  [
    "radix",
    "radix",
    "zoltan",
    "zoltan",
    "jobs",
    "beast",
    "radix",
    "beast",
    "beast",
    "zoltan",
    "radix",
    "beast",
    "jobs",
    "zoltan",
    "jobs",
    "radix",
    "beast",
    "jobs",
    "zoltan",
    "beast",
    "radix",
    "zoltan",
    "zoltan",
  ],
  [
    "jobs",
    "radix",
    "jobs",
    "zoltan",
    "beast",
    "radix",
    "beast",
    "zoltan",
    "radix",
    "beast",
    "zoltan",
    "jobs",
    "zoltan",
    "radix",
    "beast",
    "beast",
    "jobs",
    "radix",
    "beast",
    "jobs",
    "radix",
    "beast",
    "jobs",
  ],
  [
    "beast",
    "radix",
    "zoltan",
    "jobs",
    "beast",
    "radix",
    "zoltan",
    "beast",
    "radix",
    "zoltan",
    "jobs",
    "beast",
    "zoltan",
    "radix",
    "zoltan",
    "beast",
    "radix",
    "jobs",
    "zoltan",
    "beast",
    "radix",
    "zoltan",
    "radix",
  ],
];

export const INTENSITY = Array.from({ length: 69 }, (_, i) => {
  const arcPos = i % 23;
  const wave = [
    0.1, 0.18, 0.3, 0.42, 0.55, 0.68, 0.82, 0.95, 1, 1, 1, 1, 0.25, 0.15, 0.35, 0.45, 0.6, 0.72,
    0.85, 0.95, 1, 1, 0.15,
  ][arcPos]!;
  const arcFade = i >= 64 ? Math.max(0.15, 1 - ((i - 64) / 5) * 0.7) : 1;
  return wave * arcFade;
});

// ── Radix Agent System ──────────────────────────────────────

export interface RadixAgent {
  id: number;
  name: string;
  family: "drift" | "sharp" | "deep" | "wild";
  // Pad
  padDetuneCents: number;
  padFilterOffset: number;
  padAttackScale: number;
  padWaveform: "sine" | "triangle";
  // Melody
  melodyVibratoRate: number;
  melodyVibratoDepth: number;
  melodyFmIndex: number;
  melodyFilterCutoff: number;
  // Bass
  bassFilterCutoff: number;
  bassSubMix: number;
  bassDetune: number;
  // Beast stab
  beastSpread: number;
  beastDecay: number;
  beastFilterStart: number;
  // Global
  delayFeedbackBias: number;
  masterGainScale: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function buildAgents(): RadixAgent[] {
  const agents: RadixAgent[] = [];

  // Family 0-7: "Drift" — high detuning, slow attacks, sine pads. Ambient, spacious.
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    agents.push({
      id: i,
      name: `drift-${i}`,
      family: "drift",
      padDetuneCents: lerp(5, 15, t),
      padFilterOffset: lerp(-400, -100, t),
      padAttackScale: lerp(2.0, 3.0, t),
      padWaveform: "sine",
      melodyVibratoRate: lerp(2.0, 3.5, t),
      melodyVibratoDepth: lerp(1.0, 2.5, t),
      melodyFmIndex: lerp(0.05, 0.12, t),
      melodyFilterCutoff: lerp(2000, 3500, t),
      bassFilterCutoff: lerp(200, 300, t),
      bassSubMix: lerp(0.6, 0.9, t),
      bassDetune: lerp(1.001, 1.003, t),
      beastSpread: lerp(0.004, 0.008, t),
      beastDecay: lerp(0.05, 0.08, t),
      beastFilterStart: lerp(3000, 5000, t),
      delayFeedbackBias: lerp(0.05, 0.15, t),
      masterGainScale: lerp(0.85, 0.95, t),
    });
  }

  // Family 8-15: "Sharp" — fast attacks, high filter cutoffs, triangle pads. Crisp, present.
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    agents.push({
      id: 8 + i,
      name: `sharp-${i}`,
      family: "sharp",
      padDetuneCents: lerp(0.5, 3, t),
      padFilterOffset: lerp(200, 600, t),
      padAttackScale: lerp(0.3, 0.6, t),
      padWaveform: "triangle",
      melodyVibratoRate: lerp(4.5, 6.0, t),
      melodyVibratoDepth: lerp(0.5, 1.5, t),
      melodyFmIndex: lerp(0.15, 0.25, t),
      melodyFilterCutoff: lerp(4500, 6000, t),
      bassFilterCutoff: lerp(300, 450, t),
      bassSubMix: lerp(0.2, 0.5, t),
      bassDetune: lerp(1.004, 1.008, t),
      beastSpread: lerp(0.008, 0.012, t),
      beastDecay: lerp(0.02, 0.04, t),
      beastFilterStart: lerp(6000, 9000, t),
      delayFeedbackBias: lerp(-0.05, 0.05, t),
      masterGainScale: lerp(1.0, 1.15, t),
    });
  }

  // Family 16-23: "Deep" — low filters, heavy sub bass, low FM. Warm, subby.
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    agents.push({
      id: 16 + i,
      name: `deep-${i}`,
      family: "deep",
      padDetuneCents: lerp(1, 6, t),
      padFilterOffset: lerp(-300, -50, t),
      padAttackScale: lerp(1.0, 1.8, t),
      padWaveform: "sine",
      melodyVibratoRate: lerp(3.0, 4.5, t),
      melodyVibratoDepth: lerp(1.5, 3.0, t),
      melodyFmIndex: lerp(0.05, 0.1, t),
      melodyFilterCutoff: lerp(2500, 3500, t),
      bassFilterCutoff: lerp(150, 250, t),
      bassSubMix: lerp(0.8, 1.0, t),
      bassDetune: lerp(1.002, 1.005, t),
      beastSpread: lerp(0.005, 0.009, t),
      beastDecay: lerp(0.04, 0.06, t),
      beastFilterStart: lerp(3500, 5500, t),
      delayFeedbackBias: lerp(0.0, 0.1, t),
      masterGainScale: lerp(0.9, 1.05, t),
    });
  }

  // Family 24-31: "Wild" — high vibrato, wide beast spread, varied decay. Expressive.
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    agents.push({
      id: 24 + i,
      name: `wild-${i}`,
      family: "wild",
      padDetuneCents: lerp(3, 12, t),
      padFilterOffset: lerp(-200, 400, t),
      padAttackScale: lerp(0.5, 2.0, t),
      padWaveform: i % 2 === 0 ? "sine" : "triangle",
      melodyVibratoRate: lerp(5.0, 7.0, t),
      melodyVibratoDepth: lerp(2.5, 4.0, t),
      melodyFmIndex: lerp(0.2, 0.3, t),
      melodyFilterCutoff: lerp(3000, 5500, t),
      bassFilterCutoff: lerp(200, 500, t),
      bassSubMix: lerp(0.3, 0.7, t),
      bassDetune: lerp(1.006, 1.01, t),
      beastSpread: lerp(0.01, 0.015, t),
      beastDecay: lerp(0.02, 0.07, t),
      beastFilterStart: lerp(5000, 9000, t),
      delayFeedbackBias: lerp(-0.1, 0.15, t),
      masterGainScale: lerp(0.85, 1.2, t),
    });
  }

  return agents;
}

export const RADIX_AGENTS: RadixAgent[] = buildAgents();

// Interleave families so consecutive radix rounds maximize sonic contrast
// 19 radix rounds across 69 total rounds
export const RADIX_AGENT_MAP = [
  0, 24, 8, 16, 4, 28, 12, 20, 2, 26, 10, 18, 6, 30, 14, 22, 1, 25, 9,
];

// ── Round configuration ─────────────────────────────────────

export interface RoundCfg {
  p: string;
  layers: string[];
  radixAgent: RadixAgent | null;
}

export function buildRoundCfgs(): RoundCfg[] {
  const cfgs: RoundCfg[] = [];
  let radixCounter = 0;
  for (let arc = 0; arc < 3; arc++) {
    for (let pos = 0; pos < 23 && cfgs.length < 69; pos++) {
      const persona = ARC_PERSONAS[arc]![pos]!;
      const isRadix = persona === "radix";
      cfgs.push({
        p: persona,
        layers: LP[ARC_LAYERS[pos]!]!,
        radixAgent: isRadix
          ? RADIX_AGENTS[RADIX_AGENT_MAP[radixCounter++ % RADIX_AGENT_MAP.length]!]!
          : null,
      });
    }
  }
  return cfgs;
}

export const roundCfgs: RoundCfg[] = buildRoundCfgs();

// ── Phrase stepper ──────────────────────────────────────────

export function phraseSteps(phrase: Phrase): { n: number; d: number; s: number }[] {
  const steps: { n: number; d: number; s: number }[] = [];
  let cum = 0;
  for (const [n, d] of phrase) {
    steps.push({ n, d, s: cum });
    cum += d;
  }
  return steps;
}

// ── Seeded PRNG (mulberry32) ────────────────────────────────

export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
