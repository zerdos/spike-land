/**
 * Pure TypeScript DSP primitives.
 * No dependencies. Just math on Float32Arrays.
 */

export const SAMPLE_RATE = 44100;

// ── Buffer helpers ───────────────────────────────────────────

export function createBuffer(seconds: number): Float32Array {
  return new Float32Array(Math.ceil(seconds * SAMPLE_RATE));
}

export function mixInto(dest: Float32Array, src: Float32Array, offset = 0, gain = 1): void {
  for (let i = 0; i < src.length && offset + i < dest.length; i++) {
    dest[offset + i] = (dest[offset + i] ?? 0) + (src[i] ?? 0) * gain;
  }
}

export function applyGain(buf: Float32Array, gain: number): Float32Array {
  for (let i = 0; i < buf.length; i++) buf[i] = (buf[i] ?? 0) * gain;
  return buf;
}

export function fadeOut(buf: Float32Array, fadeSamples: number): Float32Array {
  const start = buf.length - fadeSamples;
  for (let i = 0; i < fadeSamples; i++) {
    buf[start + i] = (buf[start + i] ?? 0) * (1 - i / fadeSamples);
  }
  return buf;
}

export function fadeIn(buf: Float32Array, fadeSamples: number): Float32Array {
  for (let i = 0; i < fadeSamples && i < buf.length; i++) {
    buf[i] = (buf[i] ?? 0) * (i / fadeSamples);
  }
  return buf;
}

// ── Oscillators ──────────────────────────────────────────────

export function sine(freq: number, duration: number, phase = 0): Float32Array {
  const buf = createBuffer(duration);
  const step = (2 * Math.PI * freq) / SAMPLE_RATE;
  for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.sin(phase + i * step);
  }
  return buf;
}

export function saw(freq: number, duration: number): Float32Array {
  const buf = createBuffer(duration);
  const period = SAMPLE_RATE / freq;
  for (let i = 0; i < buf.length; i++) {
    buf[i] = 2 * ((i % period) / period) - 1;
  }
  return buf;
}

export function square(freq: number, duration: number): Float32Array {
  const buf = createBuffer(duration);
  const period = SAMPLE_RATE / freq;
  for (let i = 0; i < buf.length; i++) {
    buf[i] = i % period < period / 2 ? 1 : -1;
  }
  return buf;
}

export function noise(duration: number): Float32Array {
  const buf = createBuffer(duration);
  for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.random() * 2 - 1;
  }
  return buf;
}

// ── Envelopes ────────────────────────────────────────────────

export interface ADSRParams {
  attack: number; // seconds
  decay: number; // seconds
  sustain: number; // level 0-1
  release: number; // seconds
  hold?: number; // seconds (sustain duration)
}

export function adsr(params: ADSRParams, duration: number): Float32Array {
  const buf = createBuffer(duration);
  const a = Math.floor(params.attack * SAMPLE_RATE);
  const d = Math.floor(params.decay * SAMPLE_RATE);
  const hold = Math.floor((params.hold ?? 0) * SAMPLE_RATE);
  const r = Math.floor(params.release * SAMPLE_RATE);
  const sustainEnd = a + d + hold;

  for (let i = 0; i < buf.length; i++) {
    if (i < a) {
      buf[i] = i / a;
    } else if (i < a + d) {
      buf[i] = 1 - (1 - params.sustain) * ((i - a) / d);
    } else if (i < sustainEnd) {
      buf[i] = params.sustain;
    } else if (i < sustainEnd + r) {
      buf[i] = params.sustain * (1 - (i - sustainEnd) / r);
    } else {
      buf[i] = 0;
    }
  }
  return buf;
}

/** Simple exponential decay */
export function expDecay(duration: number, decayTime: number): Float32Array {
  const buf = createBuffer(duration);
  for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.exp(-i / (decayTime * SAMPLE_RATE));
  }
  return buf;
}

/** Apply envelope to signal (multiply) */
export function applyEnvelope(signal: Float32Array, env: Float32Array): Float32Array {
  const out = new Float32Array(signal.length);
  for (let i = 0; i < signal.length; i++) {
    out[i] = (signal[i] ?? 0) * (i < env.length ? (env[i] ?? 0) : 0);
  }
  return out;
}

// ── Filters ──────────────────────────────────────────────────

/** Simple one-pole low-pass filter */
export function lowPass(signal: Float32Array, cutoffHz: number): Float32Array {
  const out = new Float32Array(signal.length);
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const dt = 1 / SAMPLE_RATE;
  const alpha = dt / (rc + dt);
  out[0] = (signal[0] ?? 0) * alpha;
  for (let i = 1; i < signal.length; i++) {
    out[i] = (out[i - 1] ?? 0) + alpha * ((signal[i] ?? 0) - (out[i - 1] ?? 0));
  }
  return out;
}

/** Low-pass with time-varying cutoff (for filter sweeps) */
export function lowPassSweep(
  signal: Float32Array,
  cutoffStart: number,
  cutoffEnd: number,
): Float32Array {
  const out = new Float32Array(signal.length);
  out[0] = 0;
  for (let i = 1; i < signal.length; i++) {
    const t = i / signal.length;
    const cutoff = cutoffStart + (cutoffEnd - cutoffStart) * t;
    const rc = 1 / (2 * Math.PI * cutoff);
    const dt = 1 / SAMPLE_RATE;
    const alpha = dt / (rc + dt);
    out[i] = (out[i - 1] ?? 0) + alpha * ((signal[i] ?? 0) - (out[i - 1] ?? 0));
  }
  return out;
}

/** High-pass filter */
export function highPass(signal: Float32Array, cutoffHz: number): Float32Array {
  const out = new Float32Array(signal.length);
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const dt = 1 / SAMPLE_RATE;
  const alpha = rc / (rc + dt);
  out[0] = signal[0] ?? 0;
  for (let i = 1; i < signal.length; i++) {
    out[i] = alpha * ((out[i - 1] ?? 0) + (signal[i] ?? 0) - (signal[i - 1] ?? 0));
  }
  return out;
}

/** Bandpass = lowpass then highpass */
export function bandPass(signal: Float32Array, lowHz: number, highHz: number): Float32Array {
  return highPass(lowPass(signal, highHz), lowHz);
}

// ── Pitch helpers ────────────────────────────────────────────

/** Sine with pitch envelope (start freq -> end freq, exponential) */
export function pitchedSine(
  startFreq: number,
  endFreq: number,
  duration: number,
  decayTime: number,
): Float32Array {
  const buf = createBuffer(duration);
  let phase = 0;
  for (let i = 0; i < buf.length; i++) {
    const t = i / SAMPLE_RATE;
    const freq = endFreq + (startFreq - endFreq) * Math.exp(-t / decayTime);
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    buf[i] = Math.sin(phase);
  }
  return buf;
}

// ── Note/chord helpers ───────────────────────────────────────

/** MIDI note to frequency */
export function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

/** Note name to MIDI number */
const NOTE_MAP: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

export function noteToMidi(name: string): number {
  const match = name.match(/^([A-G][#b]?)(\d)$/);
  if (!match) throw new Error(`Invalid note: ${name}`);
  const octave = match[2];
  const noteName = match[1];
  if (octave === undefined || noteName === undefined) throw new Error(`Invalid note: ${name}`);
  return (parseInt(octave) + 1) * 12 + (NOTE_MAP[noteName] ?? 0);
}

export function noteToFreq(name: string): number {
  return midiToFreq(noteToMidi(name));
}

/** Chord as array of frequencies */
export function chordFreqs(notes: string[]): number[] {
  return notes.map(noteToFreq);
}
