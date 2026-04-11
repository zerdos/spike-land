/**
 * Parallel offline render: Weval — Rooftop Paradise (synthesised)
 * D major, 110 BPM, 69 rounds — 32 Radix sub-agents
 *
 * Spawns worker threads to render round batches in parallel,
 * then merges, fades, clips, and writes WAV + Opus.
 *
 * Run: npx tsx src/render-rooftop.ts
 */

import { Worker } from "node:worker_threads";
import { cpus } from "node:os";
import { execSync } from "node:child_process";

import { SAMPLE_RATE, createBuffer, mixInto } from "./dsp.js";
import { writeWav } from "./wav.js";
import {
  ROUNDS,
  BARS_ROUND,
  STEPS_BAR,
  STEP,
  TOTAL_SEC,
  roundCfgs,
  RADIX_AGENTS,
} from "./render-rooftop-shared.js";

const NUM_WORKERS = Math.min(cpus().length, 8);
const roundsPerWorker = Math.ceil(ROUNDS / NUM_WORKERS);

console.log(`Rendering ${ROUNDS} rounds (${Math.round(TOTAL_SEC)}s) at ${SAMPLE_RATE}Hz`);
console.log(`  32 Radix sub-agents across 4 families`);

// Log which agents are active
const activeAgents = roundCfgs.filter((c) => c.radixAgent).map((c) => c.radixAgent!.name);
console.log(`  ${activeAgents.length} Radix rounds: ${activeAgents.join(", ")}`);

console.log(`  Parallelising across ${NUM_WORKERS} workers...\n`);

const t0 = Date.now();

// ── Spawn workers ───────────────────────────────────────────

interface WorkerResult {
  buffer: Float32Array;
  offsetSamples: number;
}

const workerPath = new URL("./render-rooftop-worker.ts", import.meta.url);

const tasks: Promise<WorkerResult>[] = [];
for (let w = 0; w < NUM_WORKERS; w++) {
  const startRound = w * roundsPerWorker;
  const endRound = Math.min(startRound + roundsPerWorker, ROUNDS);
  if (startRound >= ROUNDS) break;

  tasks.push(
    new Promise<WorkerResult>((resolve, reject) => {
      const worker = new Worker(workerPath, {
        workerData: { startRound, endRound, seed: w * 74531 },
      });

      console.log(`  Worker ${w}: rounds ${startRound + 1}–${endRound}`);

      worker.on("message", (msg: WorkerResult) => {
        console.log(`  Worker ${w}: done (${msg.buffer.length} samples)`);
        resolve(msg);
      });
      worker.on("error", reject);
      worker.on("exit", (code) => {
        if (code !== 0) reject(new Error(`Worker ${w} exited with code ${code}`));
      });
    }),
  );
}

// ── Merge ───────────────────────────────────────────────────

const results = await Promise.all(tasks);
const mergeT0 = Date.now();

const master = createBuffer(TOTAL_SEC + 2);
for (const { buffer, offsetSamples } of results) {
  mixInto(master, buffer, offsetSamples, 1.0);
}

console.log(`\n  Merged in ${Date.now() - mergeT0}ms`);

// ── Fade last 5 rounds ─────────────────────────────────────

const fadeStartSample = Math.floor((ROUNDS - 5) * BARS_ROUND * STEPS_BAR * STEP * SAMPLE_RATE);
const fadeLen = master.length - fadeStartSample;
for (let i = 0; i < fadeLen; i++) {
  master[fadeStartSample + i]! *= 1 - i / fadeLen;
}

// ── Soft clip ───────────────────────────────────────────────

for (let i = 0; i < master.length; i++) {
  master[i] = Math.tanh(master[i]! * 1.5);
}

const renderTime = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\nRendered in ${renderTime}s`);

// ── Write WAV ───────────────────────────────────────────────

const wavPath = "rooftop-paradise.wav";
console.log(`Writing ${wavPath}...`);
writeWav(wavPath, master);

// ── Convert to opus ─────────────────────────────────────────

const opusPath = "rooftop-paradise.opus";
console.log(`Encoding ${opusPath}...`);
try {
  execSync(`ffmpeg -y -i ${wavPath} -c:a libopus -b:a 96k ${opusPath}`, { stdio: "inherit" });
  console.log(`Done! ${opusPath}`);
} catch {
  console.log("ffmpeg opus failed, trying mp3...");
  const mp3Path = "rooftop-paradise.mp3";
  execSync(`ffmpeg -y -i ${wavPath} -c:a libmp3lame -b:a 192k ${mp3Path}`, { stdio: "inherit" });
  console.log(`Done! ${mp3Path}`);
}
