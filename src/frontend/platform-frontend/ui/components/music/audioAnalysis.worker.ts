/**
 * Audio analysis Web Worker — runs beat detection, BPM calculation,
 * key detection, and mood tagging off the main thread.
 */

// ── Types ─────────────────────────────────────────────────────────────────

interface AnalysisRequest {
  type: "analyze";
  channelData: Float32Array;
  sampleRate: number;
}

interface AnalysisResult {
  type: "result";
  bpm: number;
  key: string;
  keyConfidence: number;
  beats: number[];
  mood: string[];
  energy: number;
  spectralCentroid: number;
}

// ── Beat Detection (onset-based) ──────────────────────────────────────────

function detectBeats(data: Float32Array, sampleRate: number): { bpm: number; beats: number[] } {
  const windowSize = 1024;
  const hopSize = 512;
  const energies: number[] = [];

  // Calculate energy per window
  for (let i = 0; i + windowSize <= data.length; i += hopSize) {
    let energy = 0;
    for (let j = 0; j < windowSize; j++) {
      energy += data[i + j] * data[i + j];
    }
    energies.push(energy / windowSize);
  }

  // Onset detection: find energy peaks
  const beats: number[] = [];
  const threshold = 1.5;
  const localWindow = 8;

  for (let i = localWindow; i < energies.length - localWindow; i++) {
    let localMean = 0;
    for (let j = i - localWindow; j < i + localWindow; j++) {
      localMean += energies[j];
    }
    localMean /= localWindow * 2;

    if (
      energies[i] > localMean * threshold &&
      energies[i] > energies[i - 1] &&
      energies[i] > energies[i + 1]
    ) {
      const timeInSeconds = (i * hopSize) / sampleRate;
      // Minimum 0.2s between beats (300 BPM max)
      if (beats.length === 0 || timeInSeconds - beats[beats.length - 1] > 0.2) {
        beats.push(timeInSeconds);
      }
    }
  }

  // Calculate BPM from inter-beat intervals
  if (beats.length < 2) {
    return { bpm: 0, beats };
  }

  const intervals: number[] = [];
  for (let i = 1; i < beats.length; i++) {
    intervals.push(beats[i] - beats[i - 1]);
  }

  // Find most common interval (histogram approach)
  const histogram = new Map<number, number>();
  for (const interval of intervals) {
    // Quantize to 5ms bins
    const bin = Math.round(interval * 200) / 200;
    histogram.set(bin, (histogram.get(bin) ?? 0) + 1);
  }

  let bestBin = 0.5;
  let bestCount = 0;
  for (const [bin, count] of histogram) {
    if (count > bestCount) {
      bestBin = bin;
      bestCount = count;
    }
  }

  const bpm = Math.round(60 / bestBin);
  // Clamp to reasonable range
  const clampedBpm = bpm < 60 ? bpm * 2 : bpm > 200 ? bpm / 2 : bpm;

  return { bpm: clampedBpm, beats };
}

// ── Key Detection (Krumhansl-Schmuckler) ──────────────────────────────────

const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function detectKey(data: Float32Array, sampleRate: number): { key: string; confidence: number } {
  // Compute chromagram using DFT at specific frequencies
  const chromagram = new Float32Array(12);
  const windowSize = 4096;
  const numWindows = Math.floor(data.length / windowSize);

  for (let w = 0; w < numWindows; w++) {
    const offset = w * windowSize;
    for (let chroma = 0; chroma < 12; chroma++) {
      // Check multiple octaves
      for (let octave = 2; octave <= 6; octave++) {
        const freq = 440 * Math.pow(2, (chroma - 9 + (octave - 4) * 12) / 12);
        const period = sampleRate / freq;

        let realPart = 0;
        let imagPart = 0;
        for (let i = 0; i < windowSize; i++) {
          const angle = (2 * Math.PI * i) / period;
          realPart += data[offset + i] * Math.cos(angle);
          imagPart += data[offset + i] * Math.sin(angle);
        }
        chromagram[chroma] += Math.sqrt(realPart * realPart + imagPart * imagPart);
      }
    }
  }

  // Normalize
  let maxChroma = 0;
  for (let i = 0; i < 12; i++) {
    if (chromagram[i] > maxChroma) maxChroma = chromagram[i];
  }
  if (maxChroma > 0) {
    for (let i = 0; i < 12; i++) chromagram[i] /= maxChroma;
  }

  // Correlate with key profiles
  let bestKey = "C major";
  let bestCorr = -Infinity;

  for (let root = 0; root < 12; root++) {
    // Rotate chromagram
    const rotated = new Float32Array(12);
    for (let i = 0; i < 12; i++) {
      rotated[i] = chromagram[(i + root) % 12];
    }

    // Major correlation
    const majorCorr = pearsonCorrelation(rotated, MAJOR_PROFILE);
    if (majorCorr > bestCorr) {
      bestCorr = majorCorr;
      bestKey = `${NOTE_NAMES[root]} major`;
    }

    // Minor correlation
    const minorCorr = pearsonCorrelation(rotated, MINOR_PROFILE);
    if (minorCorr > bestCorr) {
      bestCorr = minorCorr;
      bestKey = `${NOTE_NAMES[root]} minor`;
    }
  }

  return {
    key: bestKey,
    confidence: Math.max(0, Math.min(1, (bestCorr + 1) / 2)),
  };
}

function pearsonCorrelation(a: Float32Array, b: number[]): number {
  const n = a.length;
  let sumA = 0,
    sumB = 0,
    sumAB = 0,
    sumA2 = 0,
    sumB2 = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i];
    sumB += b[i];
    sumAB += a[i] * b[i];
    sumA2 += a[i] * a[i];
    sumB2 += b[i] * b[i];
  }
  const num = n * sumAB - sumA * sumB;
  const den = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));
  return den === 0 ? 0 : num / den;
}

// ── Energy and mood analysis ──────────────────────────────────────────────

function analyzeEnergy(data: Float32Array): number {
  let rms = 0;
  for (let i = 0; i < data.length; i++) {
    rms += data[i] * data[i];
  }
  return Math.sqrt(rms / data.length);
}

function analyzeSpectralCentroid(data: Float32Array, sampleRate: number): number {
  const fftSize = 2048;
  let weightedSum = 0;
  let totalMagnitude = 0;

  // Simple DFT for spectral centroid
  for (let k = 0; k < fftSize / 2; k++) {
    const freq = (k * sampleRate) / fftSize;
    let real = 0;
    let imag = 0;
    for (let n = 0; n < Math.min(fftSize, data.length); n++) {
      const angle = (2 * Math.PI * k * n) / fftSize;
      real += data[n] * Math.cos(angle);
      imag += data[n] * Math.sin(angle);
    }
    const magnitude = Math.sqrt(real * real + imag * imag);
    weightedSum += freq * magnitude;
    totalMagnitude += magnitude;
  }

  return totalMagnitude > 0 ? weightedSum / totalMagnitude : 0;
}

function deriveMood(energy: number, spectralCentroid: number, bpm: number): string[] {
  const moods: string[] = [];

  if (energy > 0.15) moods.push("energetic");
  else if (energy < 0.05) moods.push("calm");

  if (bpm > 140) moods.push("upbeat");
  else if (bpm < 80) moods.push("relaxed");

  if (spectralCentroid > 3000) moods.push("bright");
  else if (spectralCentroid < 800) moods.push("dark");

  if (energy > 0.1 && bpm > 120) moods.push("danceable");
  if (energy < 0.08 && bpm < 90) moods.push("dreamy");
  if (energy > 0.2 && spectralCentroid > 2000) moods.push("aggressive");
  if (energy < 0.06 && spectralCentroid < 1500) moods.push("melancholic");

  return moods.length > 0 ? moods : ["neutral"];
}

// ── Worker message handler ────────────────────────────────────────────────

self.onmessage = (event: MessageEvent<AnalysisRequest>) => {
  const { channelData, sampleRate } = event.data;

  const { bpm, beats } = detectBeats(channelData, sampleRate);
  const { key, confidence: keyConfidence } = detectKey(channelData, sampleRate);
  const energy = analyzeEnergy(channelData);
  const spectralCentroid = analyzeSpectralCentroid(channelData, sampleRate);
  const mood = deriveMood(energy, spectralCentroid, bpm);

  const result: AnalysisResult = {
    type: "result",
    bpm,
    key,
    keyConfidence,
    beats,
    mood,
    energy,
    spectralCentroid,
  };

  self.postMessage(result);
};
