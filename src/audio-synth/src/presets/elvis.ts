#!/usr/bin/env tsx
/**
 * Elvis Emotion — audio stem generator.
 *
 * Generates all 7 missing audio stems for the Elvis Emotion Remotion composition:
 *   - 5 percussion stems (progressive build, 110 BPM)
 *   - 1 synth pad (Fm7→Bbm7→Eb7→Ab, filter sweep, 5 min)
 *   - 1 vocoder hook ("Elvis, on t'aime" rhythm)
 *
 * Usage: npx tsx src/presets/elvis.ts
 * Output: packages/educational-videos/public/audio/elvis-*.mp3
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import { kick, snare, hihatClosed, hihatOpen, rimshot, clap, renderPattern } from "../drums.js";
import type { DrumPattern } from "../drums.js";
import { renderPad, renderVocoder } from "../synth.js";
import { fadeOut, fadeIn } from "../dsp.js";
import { writeWav } from "../wav.js";

// ── Config ───────────────────────────────────────────────────

const BPM = 110;
const OUTPUT_DIR = join(
  import.meta.dirname,
  "../../../../packages/educational-videos/public/audio",
);

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function wavToMp3(wavPath: string, mp3Path: string) {
  execSync(`ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -b:a 192k "${mp3Path}"`, {
    stdio: "pipe",
  });
  execSync(`rm "${wavPath}"`);
}

function generate(name: string, samples: Float32Array) {
  const wavPath = join(OUTPUT_DIR, `${name}.wav`);
  const mp3Path = join(OUTPUT_DIR, `${name}.mp3`);
  console.log(`  generating ${name} (${(samples.length / 44100).toFixed(1)}s)...`);
  writeWav(wavPath, samples);
  wavToMp3(wavPath, mp3Path);
  console.log(`  -> ${mp3Path}`);
}

// ── Act 1: Kick only (30s) ───────────────────────────────────

function generateAct1() {
  const pattern: DrumPattern = {
    bpm: BPM,
    duration: 30,
    stepsPerBar: 16,
    tracks: [
      {
        name: "kick",
        sound: () => kick(0.8),
        steps: [0, 8], // beats 1 and 3
      },
    ],
  };
  const buf = renderPattern(pattern);
  fadeIn(buf, 44100 * 2); // 2s fade in
  fadeOut(buf, 44100 * 1); // 1s fade out
  return buf;
}

// ── Act 2: Kick + hi-hat + sidestick (90s) ───────────────────

function generateAct2() {
  const pattern: DrumPattern = {
    bpm: BPM,
    duration: 90,
    stepsPerBar: 16,
    tracks: [
      {
        name: "kick",
        sound: () => kick(0.8),
        steps: [0, 8],
      },
      {
        name: "hihat",
        sound: () => hihatClosed(0.25),
        steps: [0, 4, 8, 12], // quarter notes
        velocities: [0.8, 0.5, 0.7, 0.5],
      },
      {
        name: "rimshot",
        sound: () => rimshot(0.3),
        steps: [4, 12], // beats 2 and 4 (off-beat sidestick)
      },
    ],
  };
  const buf = renderPattern(pattern);
  fadeIn(buf, 44100 * 1);
  fadeOut(buf, 44100 * 1);
  return buf;
}

// ── Act 3: Full kit groove (75s) ─────────────────────────────

function generateAct3() {
  const pattern: DrumPattern = {
    bpm: BPM,
    duration: 75,
    stepsPerBar: 16,
    tracks: [
      {
        name: "kick",
        sound: () => kick(0.85),
        steps: [0, 6, 8, 14], // syncopated kick pattern
      },
      {
        name: "snare",
        sound: () => snare(0.65),
        steps: [4, 12], // beats 2 and 4
      },
      {
        name: "hihat",
        sound: () => hihatClosed(0.2),
        steps: [0, 2, 4, 6, 8, 10, 12, 14], // 8th notes
        velocities: [0.9, 0.4, 0.7, 0.4, 0.8, 0.4, 0.7, 0.4],
      },
      {
        name: "rimshot",
        sound: () => rimshot(0.2),
        steps: [10], // ghost note
      },
    ],
  };
  const buf = renderPattern(pattern);
  fadeIn(buf, 44100 * 0.5);
  fadeOut(buf, 44100 * 1);
  return buf;
}

// ── Act 4: Double-time hi-hats (30s) ─────────────────────────

function generateAct4() {
  const pattern: DrumPattern = {
    bpm: BPM,
    duration: 30,
    stepsPerBar: 16,
    tracks: [
      {
        name: "kick",
        sound: () => kick(0.85),
        steps: [0, 3, 6, 8, 11, 14], // busy kick
      },
      {
        name: "snare",
        sound: () => snare(0.7),
        steps: [4, 12],
      },
      {
        name: "hihat",
        sound: () => hihatClosed(0.18),
        // 16th notes — every step
        steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        velocities: [
          0.9, 0.3, 0.5, 0.3, 0.8, 0.3, 0.5, 0.3, 0.9, 0.3, 0.5, 0.3, 0.8, 0.3, 0.5, 0.3,
        ],
      },
      {
        name: "open-hat",
        sound: () => hihatOpen(0.15),
        steps: [7, 15], // open hat on off-beats for energy
      },
    ],
  };
  const buf = renderPattern(pattern);
  fadeIn(buf, 44100 * 0.3);
  fadeOut(buf, 44100 * 0.5);
  return buf;
}

// ── Act 5: Peak + crowd claps (30s, fade out) ────────────────

function generateAct5() {
  const pattern: DrumPattern = {
    bpm: BPM,
    duration: 30,
    stepsPerBar: 16,
    tracks: [
      {
        name: "kick",
        sound: () => kick(0.9),
        steps: [0, 3, 6, 8, 11, 14],
      },
      {
        name: "snare",
        sound: () => snare(0.75),
        steps: [4, 12],
      },
      {
        name: "hihat",
        sound: () => hihatClosed(0.2),
        steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        velocities: [
          0.8, 0.3, 0.5, 0.3, 0.7, 0.3, 0.5, 0.3, 0.8, 0.3, 0.5, 0.3, 0.7, 0.3, 0.5, 0.3,
        ],
      },
      {
        name: "clap",
        sound: () => clap(0.45),
        steps: [4, 12], // claps on 2 and 4 (stacked with snare)
      },
      {
        name: "rimshot",
        sound: () => rimshot(0.25),
        steps: [2, 10], // ghost accents
      },
    ],
  };
  const buf = renderPattern(pattern);
  fadeIn(buf, 44100 * 0.3);
  fadeOut(buf, 44100 * 8); // long 8-second fade out for finale
  return buf;
}

// ── Synth pad: Fm7 → Bbm7 → Eb7 → Ab (5 min) ───────────────

function generateSynthPad() {
  return renderPad({
    chords: [
      // Fm7:  F3 Ab3 C4 Eb4
      ["F3", "Ab3", "C4", "Eb4"],
      // Bbm7: Bb3 Db4 F4 Ab4
      ["Bb3", "Db4", "F4", "Ab4"],
      // Eb7:  Eb3 G3 Bb3 Db4
      ["Eb3", "G3", "Bb3", "Db4"],
      // Ab:   Ab3 C4 Eb4
      ["Ab3", "C4", "Eb4"],
    ],
    bpm: BPM,
    beatsPerChord: 8, // 2 bars per chord
    duration: 300, // 5 minutes
    filterStart: 200, // starts dark
    filterEnd: 3000, // opens up gradually
    waveform: "saw",
    detune: 1.5, // Hz — subtle warmth
    gain: 0.6,
  });
}

// ── Vocoder hook: "Elvis, on t'aime" ─────────────────────────
// Syllable rhythm: EL-vis on t'AI-me
// Robotic chord burst per syllable

function generateVocoderHook() {
  return renderVocoder({
    baseFreq: 130.81, // C3
    duration: 3.5,
    syllables: [
      // "EL"  "vis"  (pause)  "on"   "t'AI"  "me"
      [0.1, 0.25],
      [0.4, 0.2],
      // pause
      [0.9, 0.15],
      [1.15, 0.35],
      [1.6, 0.3],
    ],
    intervals: [7, 12, 16], // fifth, octave, major third above = open voicing
    gain: 0.7,
  });
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  console.log("Elvis Emotion — Audio Stem Generator");
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`BPM: ${BPM}`);
  console.log("");

  ensureDir(OUTPUT_DIR);

  console.log("[1/7] Percussion Act 1 — kick only (30s)");
  generate("elvis-perc-act1", generateAct1());

  console.log("[2/7] Percussion Act 2 — kick + hi-hat + sidestick (90s)");
  generate("elvis-perc-act2", generateAct2());

  console.log("[3/7] Percussion Act 3 — full kit groove (75s)");
  generate("elvis-perc-act3", generateAct3());

  console.log("[4/7] Percussion Act 4 — double-time (30s)");
  generate("elvis-perc-act4", generateAct4());

  console.log("[5/7] Percussion Act 5 — peak + claps + fade (30s)");
  generate("elvis-perc-act5", generateAct5());

  console.log("[6/7] Synth pad — Fm7→Bbm7→Eb7→Ab (5 min)");
  generate("elvis-synth-pad", generateSynthPad());

  console.log("[7/7] Vocoder hook — 'Elvis, on t'aime' (3.5s)");
  generate("elvis-vocoder-hook", generateVocoderHook());

  console.log("");
  console.log("Done. All 7 stems generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
