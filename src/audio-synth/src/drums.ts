/**
 * Synthesized drum sounds. No samples needed.
 * Each function returns a short Float32Array (one hit).
 */

import {
  SAMPLE_RATE,
  createBuffer,
  mixInto,
  pitchedSine,
  noise,
  expDecay,
  applyEnvelope,
  highPass,
  bandPass,
  sine,
} from "./dsp.js";

// ── Kick drum ────────────────────────────────────────────────
// Pitched sine sweep (150Hz -> 40Hz) + sub click

export function kick(gain = 0.9): Float32Array {
  const dur = 0.35;
  const body = pitchedSine(150, 40, dur, 0.07);
  const env = expDecay(dur, 0.12);
  const result = applyEnvelope(body, env);

  // Sub click at the start
  const click = pitchedSine(1000, 80, 0.01, 0.003);
  const clickEnv = expDecay(0.01, 0.003);
  const clickSig = applyEnvelope(click, clickEnv);
  mixInto(result, clickSig, 0, 0.3);

  for (let i = 0; i < result.length; i++) result[i] = (result[i] ?? 0) * gain;
  return result;
}

// ── Snare ────────────────────────────────────────────────────
// Noise burst (bandpassed) + pitched body

export function snare(gain = 0.7): Float32Array {
  const dur = 0.2;
  const buf = createBuffer(dur);

  // Body tone
  const body = sine(180, dur);
  const bodyEnv = expDecay(dur, 0.04);
  mixInto(buf, applyEnvelope(body, bodyEnv), 0, 0.5);

  // Noise
  const n = noise(dur);
  const filtered = bandPass(n, 1000, 8000);
  const noiseEnv = expDecay(dur, 0.06);
  mixInto(buf, applyEnvelope(filtered, noiseEnv), 0, 0.6);

  for (let i = 0; i < buf.length; i++) buf[i] = (buf[i] ?? 0) * gain;
  return buf;
}

// ── Hi-hat (closed) ─────────────────────────────────────────
// Filtered noise, very short

export function hihatClosed(gain = 0.3): Float32Array {
  const dur = 0.05;
  const n = noise(dur);
  const filtered = highPass(n, 7000);
  const env = expDecay(dur, 0.015);
  const result = applyEnvelope(filtered, env);
  for (let i = 0; i < result.length; i++) result[i] = (result[i] ?? 0) * gain;
  return result;
}

// ── Hi-hat (open) ───────────────────────────────────────────

export function hihatOpen(gain = 0.25): Float32Array {
  const dur = 0.2;
  const n = noise(dur);
  const filtered = highPass(n, 6000);
  const env = expDecay(dur, 0.08);
  const result = applyEnvelope(filtered, env);
  for (let i = 0; i < result.length; i++) result[i] = (result[i] ?? 0) * gain;
  return result;
}

// ── Rimshot / sidestick ──────────────────────────────────────
// Short, sharp, high-pitched click

export function rimshot(gain = 0.4): Float32Array {
  const dur = 0.06;
  const body = sine(800, dur);
  const env = expDecay(dur, 0.01);
  const result = applyEnvelope(body, env);

  const click = noise(0.005);
  const clickFiltered = bandPass(click, 2000, 10000);
  mixInto(result, clickFiltered, 0, 0.5);

  for (let i = 0; i < result.length; i++) result[i] = (result[i] ?? 0) * gain;
  return result;
}

// ── Clap ─────────────────────────────────────────────────────
// Multiple noise bursts with micro-delays (human feel)

export function clap(gain = 0.5): Float32Array {
  const dur = 0.15;
  const buf = createBuffer(dur);

  // 3-4 layered noise bursts, staggered
  const delays = [0, 0.008, 0.018, 0.025];
  for (const delay of delays) {
    const n = noise(0.04);
    const filtered = bandPass(n, 1000, 5000);
    const env = expDecay(0.04, 0.015);
    const hit = applyEnvelope(filtered, env);
    mixInto(buf, hit, Math.floor(delay * SAMPLE_RATE), 0.4);
  }

  // Tail
  const tail = noise(0.1);
  const tailFiltered = bandPass(tail, 800, 4000);
  const tailEnv = expDecay(0.1, 0.04);
  mixInto(buf, applyEnvelope(tailFiltered, tailEnv), Math.floor(0.03 * SAMPLE_RATE), 0.3);

  for (let i = 0; i < buf.length; i++) buf[i] = (buf[i] ?? 0) * gain;
  return buf;
}

// ── Pattern sequencer ────────────────────────────────────────

export interface DrumPattern {
  /** Beats per minute */
  bpm: number;
  /** Duration in seconds */
  duration: number;
  /** Steps per bar (e.g. 16 for 16th notes) */
  stepsPerBar: number;
  /** Tracks: which steps to trigger */
  tracks: {
    name: string;
    sound: () => Float32Array;
    /** Array of step indices (0-based) where this sound triggers */
    steps: number[];
    /** Per-step velocity (0-1), defaults to 1 */
    velocities?: number[];
  }[];
}

export function renderPattern(pattern: DrumPattern): Float32Array {
  const totalSamples = Math.ceil(pattern.duration * SAMPLE_RATE);
  const buf = new Float32Array(totalSamples);

  const secondsPerBeat = 60 / pattern.bpm;
  const secondsPerStep = (secondsPerBeat * 4) / pattern.stepsPerBar; // 4 beats per bar
  const samplesPerStep = Math.floor(secondsPerStep * SAMPLE_RATE);
  const stepsTotal = Math.floor(pattern.duration / secondsPerStep);

  for (const track of pattern.tracks) {
    const hit = track.sound();
    for (let step = 0; step < stepsTotal; step++) {
      const stepInBar = step % pattern.stepsPerBar;
      const idx = track.steps.indexOf(stepInBar);
      if (idx === -1) continue;
      const velocity = track.velocities?.[idx] ?? 1;
      const offset = step * samplesPerStep;
      mixInto(buf, hit, offset, velocity);
    }
  }

  // Soft clip
  for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.tanh(buf[i] ?? 0);
  }

  return buf;
}
