import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SPRING = { type: "spring" as const, stiffness: 400, damping: 30 };
const BPM = 120;
const STEP_TIME = 60 / BPM / 4; // 16th note duration
const STEPS = 64; // 4 bars of 16 steps

const STORAGE_KEY_VOLUME = "moonshot-music-volume";

function readStorage(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota exceeded or blocked */
  }
}

// ─── Synth Engine ───────────────────────────────────────────────

interface SynthEngine {
  ctx: AudioContext;
  masterGain: GainNode;
  filterNode: BiquadFilterNode;
  analyser: AnalyserNode;
  schedulerTimer: number | null;
  currentStep: number;
  nextStepTime: number;
  section: number;
  totalBeats: number;
}

// Kick pattern: hit on 1, 5, 9, 13 (4-on-floor)
const KICK_PATTERN = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
// Hi-hat: offbeats
const HAT_PATTERN = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0];
// Snare: 5, 13
const SNARE_PATTERN = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
// Bass: two-note pattern
const BASS_PATTERN = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0];
const BASS_NOTES = [55, 55, 55, 65.41, 55, 55, 55, 55, 55, 55, 55, 65.41, 55, 55, 55, 55]; // A1, C2

// Arpeggio notes (Am pentatonic)
const ARP_NOTES = [220, 261.63, 329.63, 392, 440, 523.25, 659.25, 783.99];

function createKick(ctx: AudioContext, time: number, gain: GainNode) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(30, time + 0.12);
  g.gain.setValueAtTime(0.8, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
  osc.connect(g).connect(gain);
  osc.start(time);
  osc.stop(time + 0.3);
}

function createHiHat(ctx: AudioContext, time: number, gain: GainNode) {
  const bufferSize = ctx.sampleRate * 0.05;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 7000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.15, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
  source.connect(filter).connect(g).connect(gain);
  source.start(time);
}

function createSnare(ctx: AudioContext, time: number, gain: GainNode) {
  // Noise component
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 3000;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.4, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
  noise.connect(noiseFilter).connect(noiseGain).connect(gain);
  noise.start(time);
  // Tonal body
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(180, time);
  osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.3, time);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
  osc.connect(oscGain).connect(gain);
  osc.start(time);
  osc.stop(time + 0.15);
}

function createBass(ctx: AudioContext, time: number, freq: number, gain: GainNode) {
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(300, time);
  filter.Q.value = 8;
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.35, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + STEP_TIME * 1.8);
  osc.connect(filter).connect(g).connect(gain);
  osc.start(time);
  osc.stop(time + STEP_TIME * 2);
}

function createArp(
  ctx: AudioContext,
  time: number,
  freq: number,
  filterNode: BiquadFilterNode,
  gain: GainNode,
) {
  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.08, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + STEP_TIME * 1.5);
  osc.connect(filterNode).connect(g).connect(gain);
  osc.start(time);
  osc.stop(time + STEP_TIME * 2);
}

function createPad(ctx: AudioContext, time: number, gain: GainNode, section: number) {
  const freqs = section < 2 ? [130.81, 164.81, 196] : [146.83, 174.61, 220]; // Cm → Dm
  for (const freq of freqs) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq + (Math.random() - 0.5) * 2; // slight detune
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400 + section * 200;
    filter.Q.value = 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(0.04, time + 0.5);
    g.gain.linearRampToValueAtTime(0.04, time + STEP_TIME * STEPS - 0.5);
    g.gain.linearRampToValueAtTime(0, time + STEP_TIME * STEPS);
    osc.connect(filter).connect(g).connect(gain);
    osc.start(time);
    osc.stop(time + STEP_TIME * STEPS + 0.1);
  }
}

function scheduleStep(engine: SynthEngine) {
  const { ctx, masterGain, filterNode, currentStep, nextStepTime, section } = engine;
  const step = currentStep % 16;

  // Section-aware scheduling
  // 0: intro (kick + hat + pad)
  // 1: verse (+ bass + filter sweep)
  // 2: buildup (+ snare + arp)
  // 3: drop (everything, open filter)
  // 4: breakdown (pad only)
  // 5: outro (kick + bass + closing filter)

  // Pad at start of each 4-bar loop
  if (currentStep % STEPS === 0) {
    createPad(ctx, nextStepTime, masterGain, section);
  }

  // Kick
  if (section !== 4 && KICK_PATTERN[step]) {
    createKick(ctx, nextStepTime, masterGain);
  }

  // Hi-hat
  if (section >= 0 && section <= 3 && HAT_PATTERN[step]) {
    createHiHat(ctx, nextStepTime, masterGain);
  }

  // Snare
  if (section >= 2 && section <= 3 && SNARE_PATTERN[step]) {
    createSnare(ctx, nextStepTime, masterGain);
  }

  // Bass
  if (section >= 1 && section !== 4 && BASS_PATTERN[step]) {
    createBass(ctx, nextStepTime, BASS_NOTES[step]!, masterGain);
  }

  // Arpeggio
  if (section >= 2 && section <= 3 && step % 2 === 0) {
    const noteIdx = (currentStep / 2) % ARP_NOTES.length;
    createArp(ctx, nextStepTime, ARP_NOTES[noteIdx]!, filterNode, masterGain);
  }

  // Filter sweep: slowly open over sections
  const filterTarget =
    section === 0
      ? 800
      : section === 1
        ? 1500
        : section === 2
          ? 3000
          : section === 3
            ? 8000
            : section === 4
              ? 600
              : 1200;
  filterNode.frequency.linearRampToValueAtTime(filterTarget, nextStepTime + STEP_TIME);
}

// ─── Sections (matching the track concept) ──────────────────────
const SECTIONS = [
  { name: "Intro", bars: 4 },
  { name: "Minden összefügg", bars: 8 },
  { name: "Build-up", bars: 4 },
  { name: "Összefüggés", bars: 8 },
  { name: "Breakdown", bars: 4 },
  { name: "Outro", bars: 4 },
];

const SECTION_STEPS = SECTIONS.map((s) => s.bars * 16);
const TOTAL_STEPS = SECTION_STEPS.reduce((a, b) => a + b, 0);

function getSectionForStep(step: number): number {
  let acc = 0;
  for (let i = 0; i < SECTION_STEPS.length; i++) {
    acc += SECTION_STEPS[i]!;
    if (step < acc) return i;
  }
  return 0;
}

function getSectionProgress(step: number): number {
  let acc = 0;
  for (let i = 0; i < SECTION_STEPS.length; i++) {
    const sLen = SECTION_STEPS[i]!;
    if (step < acc + sLen) return (step - acc) / sLen;
    acc += sLen;
  }
  return 0;
}

// ─── Visualizer ─────────────────────────────────────────────────

function drawVisualizer(canvas: HTMLCanvasElement, analyser: AnalyserNode, section: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, w, h);

  // Section colors
  const colors = [
    "rgba(139, 92, 246, ", // violet - intro
    "rgba(6, 182, 212, ", // cyan - verse
    "rgba(245, 158, 11, ", // amber - buildup
    "rgba(239, 68, 68, ", // red - drop
    "rgba(99, 102, 241, ", // indigo - breakdown
    "rgba(16, 185, 129, ", // emerald - outro
  ];
  const color = colors[section] ?? colors[0]!;

  const barCount = 32;
  const barWidth = w / barCount - 2;
  const step = Math.floor(bufferLength / barCount);

  for (let i = 0; i < barCount; i++) {
    const value = dataArray[i * step]! / 255;
    const barHeight = value * h * 0.9;
    const x = i * (barWidth + 2);
    const y = h - barHeight;

    ctx.fillStyle = `${color}${(0.4 + value * 0.6).toFixed(2)})`;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, 2);
    ctx.fill();
  }
}

// ─── EQ Bars (mini indicator) ───────────────────────────────────

function EqBars({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-primary"
          animate={playing ? { height: [4, 14, 6, 12, 4] } : { height: 4 }}
          transition={
            playing
              ? {
                  duration: 0.8 + i * 0.15,
                  repeat: Infinity,
                  repeatType: "reverse" as const,
                  ease: "easeInOut",
                  delay: i * 0.1,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────

export function MusicWidget() {
  const engineRef = useRef<SynthEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [section, setSection] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(() => parseFloat(readStorage(STORAGE_KEY_VOLUME, "0.4")));

  const sectionInfo = SECTIONS[section] ?? SECTIONS[0]!;

  const initEngine = useCallback((): SynthEngine => {
    const ctx = new AudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.value = volume;
    const filterNode = ctx.createBiquadFilter();
    filterNode.type = "lowpass";
    filterNode.frequency.value = 800;
    filterNode.Q.value = 4;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    masterGain.connect(analyser).connect(ctx.destination);
    return {
      ctx,
      masterGain,
      filterNode,
      analyser,
      schedulerTimer: null,
      currentStep: 0,
      nextStepTime: 0,
      section: 0,
      totalBeats: 0,
    };
  }, [volume]);

  const startPlayback = useCallback(() => {
    let engine = engineRef.current;
    if (!engine) {
      engine = initEngine();
      engineRef.current = engine;
    }

    if (engine.ctx.state === "suspended") {
      engine.ctx.resume();
    }

    engine.nextStepTime = engine.ctx.currentTime + 0.05;
    engine.currentStep = 0;

    const scheduler = () => {
      const eng = engineRef.current;
      if (!eng) return;

      while (eng.nextStepTime < eng.ctx.currentTime + 0.1) {
        const sec = getSectionForStep(eng.currentStep % TOTAL_STEPS);
        eng.section = sec;
        scheduleStep(eng);
        eng.nextStepTime += STEP_TIME;
        eng.currentStep = (eng.currentStep + 1) % TOTAL_STEPS;

        // Update UI state (throttled)
        if (eng.currentStep % 4 === 0) {
          setSection(sec);
          setProgress(getSectionProgress(eng.currentStep % TOTAL_STEPS));
        }
      }
    };

    engine.schedulerTimer = window.setInterval(scheduler, 25);
    setIsPlaying(true);

    // Visualizer loop
    const drawLoop = () => {
      const eng = engineRef.current;
      const canvas = canvasRef.current;
      if (eng && canvas) {
        drawVisualizer(canvas, eng.analyser, eng.section);
      }
      animFrameRef.current = requestAnimationFrame(drawLoop);
    };
    animFrameRef.current = requestAnimationFrame(drawLoop);
  }, [initEngine]);

  const stopPlayback = useCallback(() => {
    const engine = engineRef.current;
    if (engine) {
      if (engine.schedulerTimer !== null) {
        clearInterval(engine.schedulerTimer);
        engine.schedulerTimer = null;
      }
      engine.ctx.close();
      engineRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);
    setIsPlaying(false);
    setSection(0);
    setProgress(0);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [isPlaying, startPlayback, stopPlayback]);

  // Sync volume
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.masterGain.gain.value = volume;
    }
    writeStorage(STORAGE_KEY_VOLUME, String(volume));
  }, [volume]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  }, []);

  const sectionColors = [
    "bg-violet-500",
    "bg-cyan-500",
    "bg-amber-500",
    "bg-red-500",
    "bg-indigo-500",
    "bg-emerald-500",
  ];

  return (
    <motion.div layout transition={SPRING} className="fixed bottom-6 right-6 z-50">
      <AnimatePresence mode="wait">
        {collapsed ? (
          <motion.button
            key="pill"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={SPRING}
            onClick={() => setCollapsed(false)}
            className="flex items-center gap-2 rounded-full border border-border bg-card/95 backdrop-blur px-4 py-2 shadow-lg hover:border-primary/40 transition-colors"
            type="button"
            title="Expand music player"
          >
            <EqBars playing={isPlaying} />
            <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
              Összefüggés
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="full"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={SPRING}
            className="w-80 rounded-2xl border border-border bg-card/95 backdrop-blur shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <EqBars playing={isPlaying} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Összefüggés
                </span>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                type="button"
                title="Collapse"
              >
                <svg
                  className="size-4"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 10l4 -4 4 4" />
                </svg>
              </button>
            </div>

            {/* Visualizer */}
            <div className="px-4 pt-3">
              <canvas
                ref={canvasRef}
                width={280}
                height={60}
                className="w-full h-[60px] rounded-lg bg-background/50"
              />
            </div>

            {/* Track info */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className={`size-10 rounded-xl ${sectionColors[section] ?? "bg-violet-500"} flex items-center justify-center shrink-0 transition-colors duration-500`}
                >
                  <svg className="size-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {sectionInfo.name}
                  </p>
                  <p className="text-xs text-muted-foreground">Web Audio Synth — 120 BPM</p>
                  {/* Section progress */}
                  {isPlaying && (
                    <div className="mt-1.5 h-1 rounded-full bg-border overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${sectionColors[section] ?? "bg-violet-500"}`}
                        style={{ width: `${progress * 100}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {!isPlaying && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-xs text-primary font-medium"
                >
                  Tap play — generated live in your browser.
                </motion.p>
              )}
            </div>

            {/* Controls */}
            <div className="px-4 pb-3 flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="flex size-9 items-center justify-center rounded-full bg-foreground text-background hover:opacity-90 transition-opacity shrink-0"
                type="button"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Volume slider */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <svg
                  className="size-3.5 text-muted-foreground shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolume}
                  className="w-full h-1.5 rounded-full appearance-none bg-border cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm"
                />
              </div>

              {/* Section indicators */}
              <div className="flex gap-1 shrink-0">
                {SECTIONS.map((_, i) => (
                  <div
                    key={i}
                    className={`size-1.5 rounded-full transition-colors duration-300 ${
                      i === section && isPlaying
                        ? (sectionColors[i] ?? "bg-violet-500")
                        : i < section && isPlaying
                          ? "bg-muted-foreground/50"
                          : "bg-border"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
