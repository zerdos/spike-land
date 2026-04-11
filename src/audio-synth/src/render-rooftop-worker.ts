/**
 * Worker thread: renders a range of rounds into a local buffer.
 * Receives { startRound, endRound, seed } via workerData.
 * Posts back { buffer: Float32Array, offsetSamples: number }.
 */

import { workerData, parentPort } from "node:worker_threads";
import {
  SAMPLE_RATE,
  createBuffer,
  mixInto,
  sine,
  saw,
  noise,
  adsr,
  expDecay,
  applyEnvelope,
  lowPass,
  lowPassSweep,
  highPass,
  bandPass,
  midiToFreq,
} from "./dsp.js";
import {
  STEP,
  STEPS_BAR,
  BARS_ROUND,
  ROUNDS,
  AABA,
  CHORDS,
  PROG,
  HOOK,
  HOOKB,
  BASSA,
  BASSB,
  PIANOA,
  PIANOB,
  BEASTR,
  PIANOLA,
  PIANOLB,
  INTENSITY,
  roundCfgs,
  phraseSteps,
  mulberry32,
  type RadixAgent,
  type Phrase,
} from "./render-rooftop-shared.js";

const { startRound, endRound, seed } = workerData as {
  startRound: number;
  endRound: number;
  seed: number;
};

const rng = mulberry32(seed);

const STEPS_ROUND = STEPS_BAR * BARS_ROUND;
const startStep = startRound * STEPS_ROUND;
const endStep = endRound * STEPS_ROUND;
const startSec = startStep * STEP;
const endSec = endStep * STEP;
const OVERLAP_SEC = 2; // for release tails
const bufferDur = endSec - startSec + OVERLAP_SEC;

const local = createBuffer(bufferDur);
const localOffset = Math.floor(startSec * SAMPLE_RATE);

function m2f(n: number) {
  return midiToFreq(n);
}
function sAt(sec: number) {
  return Math.floor(sec * SAMPLE_RATE) - localOffset;
}

// ── Instrument renderers (with RadixAgent overrides) ────────

function renderPad(t: number, notes: number[], dur: number, lpF: number, agent: RadixAgent | null) {
  const detuneFactor = 1 + (agent?.padDetuneCents ?? 0.2) / 100;
  const attackScale = agent?.padAttackScale ?? 1;
  for (const n of notes) {
    if (n < 45) continue;
    const f = m2f(n);
    const s1 = sine(f, dur);
    const s2 = sine(f * detuneFactor, dur);
    const raw = createBuffer(dur);
    for (let i = 0; i < raw.length; i++) {
      const lfo = 1 + 0.015 * Math.sin((2 * Math.PI * 0.25 * i) / SAMPLE_RATE);
      raw[i] = (s1[i]! + s2[i]!) * 0.5 * lfo;
    }
    const env = adsr(
      {
        attack: 1.0 * attackScale,
        decay: 0.5,
        sustain: 0.8,
        release: 1.5,
        hold: dur - 3 * attackScale,
      },
      dur,
    );
    const sig = applyEnvelope(raw, env);
    const filtered = lowPass(sig, lpF + (agent?.padFilterOffset ?? 0));
    mixInto(local, filtered, sAt(t), 0.04);
  }
}

function renderMelody(t: number, note: number, dur: number, vol: number, agent: RadixAgent | null) {
  if (!note) return;
  const f = m2f(note);
  const vibratoRate = agent?.melodyVibratoRate ?? 4.5;
  const vibratoDepth = agent?.melodyVibratoDepth ?? 2;
  const fmIndex = agent?.melodyFmIndex ?? 0.15;
  const filterCutoff = agent?.melodyFilterCutoff ?? 4000;
  const buf = createBuffer(dur + 1.2);
  for (let i = 0; i < buf.length; i++) {
    const tm = i / SAMPLE_RATE;
    const mod = Math.sin(2 * Math.PI * f * 1.5 * tm) * f * fmIndex;
    const vibrato = Math.sin(2 * Math.PI * vibratoRate * tm) * vibratoDepth;
    buf[i] = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * (f + mod + vibrato) * tm));
  }
  const env = adsr(
    { attack: 0.06, decay: dur * 0.4, sustain: 0.6, release: 1.2, hold: dur * 0.3 },
    dur + 1.2,
  );
  const sig = applyEnvelope(buf, env);
  const filtered = lowPass(sig, filterCutoff);
  mixInto(local, filtered, sAt(t), vol * (agent?.masterGainScale ?? 1));
}

function renderBass(t: number, note: number, dur: number, agent: RadixAgent | null) {
  if (!note) return;
  if (rng() > 0.8) return;
  const f = m2f(note);
  const detune = agent?.bassDetune ?? 1.004;
  const subMix = agent?.bassSubMix ?? 0.5;
  const filterCut = agent?.bassFilterCutoff ?? 300;
  const s1 = saw(f, dur);
  const s2 = saw(f * detune, dur);
  const sub = sine(f * 0.5, dur);
  const raw = createBuffer(dur);
  for (let i = 0; i < raw.length; i++) {
    raw[i] =
      (s1[i]! * (1 - subMix * 0.3) + s2[i]! * (1 - subMix * 0.3) + sub[i]! * subMix) / (2 + subMix);
  }
  const env = adsr(
    { attack: 0.08, decay: dur * 0.3, sustain: 0.5, release: dur * 0.3, hold: dur * 0.2 },
    dur,
  );
  const sig = applyEnvelope(raw, env);
  const filtered = lowPass(sig, filterCut);
  mixInto(local, filtered, sAt(t), 0.2);
}

function renderPiano(t: number, note: number, dur: number, vol: number) {
  if (!note) return;
  const f = m2f(note);
  const s1 = sine(f, 1.5);
  const s2 = sine(f * 2, 1.5);
  const s3 = sine(f * 3, 1.5);
  const raw = createBuffer(1.5);
  for (let i = 0; i < raw.length; i++) raw[i] = s1[i]! + s2[i]! * 0.3 + s3[i]! * 0.08;
  const env = expDecay(1.5, 0.3);
  const sig = applyEnvelope(raw, env);
  const filtered = lowPass(sig, 3000 + f * 2);
  mixInto(local, filtered, sAt(t), vol);
}

function renderKick(t: number) {
  const dur = 0.4;
  const body = createBuffer(dur);
  let phase = 0;
  for (let i = 0; i < body.length; i++) {
    const tm = i / SAMPLE_RATE;
    const freq = 30 + 70 * Math.exp(-tm / 0.03);
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    body[i] = Math.sin(phase);
  }
  const env = expDecay(dur, 0.12);
  const sig = applyEnvelope(body, env);
  mixInto(local, sig, sAt(t), 0.4);
}

function renderHat(t: number) {
  const dur = 0.02;
  const n = noise(dur);
  const filtered = highPass(n, 7000);
  const env = expDecay(dur, 0.008);
  const sig = applyEnvelope(filtered, env);
  mixInto(local, sig, sAt(t), 0.08);
}

function renderBeastStab(t: number, note: number, dur: number, agent: RadixAgent | null) {
  if (!note) return;
  const f = m2f(note);
  const spread = agent?.beastSpread ?? 0.008;
  const decay = agent?.beastDecay ?? 0.04;
  const filterStart = agent?.beastFilterStart ?? 6000;
  for (let v = -1; v <= 1; v++) {
    const s = saw(f * (1 + v * spread), 0.25);
    const env = expDecay(0.25, decay);
    const sig = applyEnvelope(s, env);
    const filtered = lowPassSweep(sig, filterStart, 1500);
    mixInto(local, filtered, sAt(t), 0.04);
  }
}

function renderAir(t: number, dur: number) {
  const n = noise(dur);
  const filtered = bandPass(n, 200, 8000);
  const env = adsr({ attack: 2, decay: 0.5, sustain: 0.8, release: 2, hold: dur - 5 }, dur);
  const sig = applyEnvelope(filtered, env);
  mixInto(local, sig, sAt(t), 0.015);
}

// ── Render assigned rounds ──────────────────────────────────

for (let step = startStep; step < endStep; step++) {
  const t = step * STEP;
  const pos = step % STEPS_BAR;
  const bar = Math.floor(step / STEPS_BAR);
  const loopBar = bar % (ROUNDS * BARS_ROUND);
  const round = Math.floor(loopBar / BARS_ROUND);
  const barInRound = loopBar % BARS_ROUND;
  const fi = AABA[barInRound]!;
  const cfg = roundCfgs[round]!;
  const L = cfg.layers;
  const intens = INTENSITY[round]!;
  const chord = CHORDS[PROG[barInRound]!]!;
  const roundDur = STEP * STEPS_BAR * BARS_ROUND;
  const agent = cfg.radixAgent;

  // Pad
  if (L.includes("pad") && pos === 0 && barInRound === 0) {
    const lpF = L.length <= 4 ? 1000 : 900 + intens * 800;
    renderPad(
      t,
      chord.filter((n) => n >= 45),
      roundDur,
      lpF,
      agent,
    );
  }
  if (L.includes("padDbl") && pos === 0 && barInRound === 0) {
    renderPad(
      t,
      chord.filter((n) => n >= 45).map((n) => n + 0.12),
      roundDur,
      800 + intens * 800,
      agent,
    );
  }

  // Melody
  if (L.includes("melody")) {
    const ph = [HOOK, HOOKB][fi]!;
    for (const s of phraseSteps(ph)) {
      if (pos === s.s) renderMelody(t, s.n, STEP * s.d * 0.95, L.length > 6 ? 0.1 : 0.07, agent);
    }
  }

  // Bass
  if (L.includes("bass") && pos === 0) {
    const ph = [BASSA, BASSB][fi]!;
    for (const s of phraseSteps(ph)) {
      if (s.n) renderBass(t + s.s * STEP, s.n, STEP * s.d * 0.9, agent);
    }
  }

  // Piano
  if (L.includes("piano")) {
    const ph = [PIANOA, PIANOB][fi]!;
    for (const s of phraseSteps(ph)) {
      if (pos === s.s) renderPiano(t, s.n, STEP * s.d, intens > 0.5 ? 0.09 : 0.07);
    }
  }
  if (L.includes("pianoL")) {
    const arp = fi === 0 ? PIANOLA : PIANOLB;
    arp.forEach((n, i) => {
      if (pos === i * 2) renderPiano(t, n, STEP * 2, 0.04);
    });
  }

  // Kick + Hat
  if (L.includes("kick") && (pos === 0 || pos === 8)) renderKick(t);
  if (L.includes("hat")) {
    if (pos % 4 === 2) renderHat(t);
    if (pos % 2 === 0 && rng() < 0.3) renderHat(t);
  }

  // Beast stab
  if (L.includes("beast")) {
    for (const s of phraseSteps(BEASTR)) {
      if (pos === s.s && s.n) renderBeastStab(t, s.n + 12, STEP * s.d, agent);
    }
  }

  // Air
  if (L.includes("air") && pos === 0 && barInRound === 0) renderAir(t, roundDur);
}

// ── Post result ─────────────────────────────────────────────

parentPort!.postMessage({ buffer: local, offsetSamples: localOffset }, [
  local.buffer as ArrayBuffer,
]);
