/**
 * Synthesizer: chord pads, filter sweeps, vocoder effects.
 */

import {
  SAMPLE_RATE,
  createBuffer,
  mixInto,
  saw,
  sine,
  noise,
  lowPassSweep,
  lowPass,
  adsr,
  applyEnvelope,
  chordFreqs,
  applyGain,
  fadeIn,
  fadeOut,
} from "./dsp.js";

// ── Chord pad synthesizer ────────────────────────────────────

export interface PadConfig {
  /** Array of chord definitions, each is an array of note names e.g. ["F3","Ab3","C4","Eb4"] */
  chords: string[][];
  /** BPM for chord changes */
  bpm: number;
  /** Beats per chord */
  beatsPerChord: number;
  /** Total duration in seconds */
  duration: number;
  /** Filter sweep: start cutoff Hz */
  filterStart: number;
  /** Filter sweep: end cutoff Hz */
  filterEnd: number;
  /** Oscillator type per voice */
  waveform: "saw" | "sine";
  /** Detune amount in Hz (creates warmth) */
  detune: number;
  /** Output gain */
  gain: number;
}

export function renderPad(config: PadConfig): Float32Array {
  const buf = createBuffer(config.duration);
  const secondsPerBeat = 60 / config.bpm;
  const chordDuration = secondsPerBeat * config.beatsPerChord;
  const totalChordSlots = Math.ceil(config.duration / chordDuration);

  const osc = config.waveform === "saw" ? saw : sine;

  for (let slot = 0; slot < totalChordSlots; slot++) {
    const chordIdx = slot % config.chords.length;
    const chord = config.chords[chordIdx];
    if (!chord) continue;
    const freqs = chordFreqs(chord);
    const startSample = Math.floor(slot * chordDuration * SAMPLE_RATE);
    const slotDur = Math.min(chordDuration + 0.1, config.duration - slot * chordDuration);
    if (slotDur <= 0) break;

    // ADSR per chord change
    const env = adsr(
      { attack: 0.08, decay: 0.15, sustain: 0.7, release: 0.1, hold: slotDur - 0.33 },
      slotDur,
    );

    for (const freq of freqs) {
      // Main oscillator
      const wave = osc(freq, slotDur);
      // Detuned copy for warmth
      const detuned = osc(freq + config.detune, slotDur);

      const mixed = new Float32Array(wave.length);
      for (let i = 0; i < mixed.length; i++) {
        mixed[i] = (wave[i] ?? 0) * 0.5 + (detuned[i] ?? 0) * 0.5;
      }

      const shaped = applyEnvelope(mixed, env);
      const voiceGain = 0.15 / freqs.length; // normalize by chord size
      mixInto(buf, shaped, startSample, voiceGain);
    }
  }

  // Apply filter sweep across entire duration
  const filtered = lowPassSweep(buf, config.filterStart, config.filterEnd);

  // Fade in/out
  fadeIn(filtered, Math.floor(0.5 * SAMPLE_RATE));
  fadeOut(filtered, Math.floor(2 * SAMPLE_RATE));

  return applyGain(filtered, config.gain);
}

// ── Vocoder-style robotic voice effect ───────────────────────
// Creates a robotic chord tone that pulses in a speech-like rhythm

export interface VocoderConfig {
  /** Fundamental frequency */
  baseFreq: number;
  /** Duration in seconds */
  duration: number;
  /** Syllable pattern: array of [onset_sec, duration_sec] */
  syllables: [number, number][];
  /** Chord intervals above base (in semitones) */
  intervals: number[];
  /** Output gain */
  gain: number;
}

export function renderVocoder(config: VocoderConfig): Float32Array {
  const buf = createBuffer(config.duration);

  // Build chord tones
  const allFreqs = [config.baseFreq];
  for (const interval of config.intervals) {
    allFreqs.push(config.baseFreq * Math.pow(2, interval / 12));
  }

  // For each syllable, create a burst of the chord
  for (const [onset, dur] of config.syllables) {
    const syllableBuf = createBuffer(dur);

    for (const freq of allFreqs) {
      // Use square wave for that classic vocoder buzz
      const wave = new Float32Array(syllableBuf.length);
      let phase = 0;
      for (let i = 0; i < wave.length; i++) {
        phase += (2 * Math.PI * freq) / SAMPLE_RATE;
        // Pulse wave with slight harmonic content
        wave[i] = Math.sin(phase) * 0.4 + Math.sin(phase * 2) * 0.2 + Math.sin(phase * 3) * 0.1;
      }

      const env = adsr(
        { attack: 0.01, decay: 0.02, sustain: 0.8, release: 0.03, hold: dur - 0.06 },
        dur,
      );

      mixInto(syllableBuf, applyEnvelope(wave, env), 0, 0.3 / allFreqs.length);
    }

    // Add noise modulation for consonant-like texture
    const n = noise(dur);
    const nFiltered = lowPass(n, 3000);
    const nEnv = adsr(
      { attack: 0.005, decay: 0.01, sustain: 0.1, release: 0.01, hold: dur * 0.3 },
      dur,
    );
    mixInto(syllableBuf, applyEnvelope(nFiltered, nEnv), 0, 0.05);

    mixInto(buf, syllableBuf, Math.floor(onset * SAMPLE_RATE), 1);
  }

  // Low-pass the whole thing for warmth
  const filtered = lowPass(buf, 4000);
  fadeIn(filtered, Math.floor(0.02 * SAMPLE_RATE));
  fadeOut(filtered, Math.floor(0.1 * SAMPLE_RATE));

  return applyGain(filtered, config.gain);
}
