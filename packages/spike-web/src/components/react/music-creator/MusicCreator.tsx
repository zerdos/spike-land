import { useState, useCallback, useRef, useEffect } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Pattern = boolean[][];

interface TrackConfig {
  name: string;
  color: string;
  group: "drums" | "bass" | "synth";
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TRACK_CONFIGS: TrackConfig[] = [
  { name: "KICK", color: "#ff6b6b", group: "drums" },
  { name: "SNARE", color: "#ff6b6b", group: "drums" },
  { name: "HH CL", color: "#ffd93d", group: "drums" },
  { name: "HH OP", color: "#ffd93d", group: "drums" },
  { name: "CLAP", color: "#ffd93d", group: "drums" },
  { name: "BASS", color: "#06d6a0", group: "bass" },
  { name: "LEAD", color: "#a855f7", group: "synth" },
  { name: "STAB", color: "#00b4d8", group: "synth" },
];

const NUM_TRACKS = 8;
const NUM_STEPS = 16;

const emptyPattern = (): Pattern =>
  Array.from({ length: NUM_TRACKS }, () => Array(NUM_STEPS).fill(false));

// ─── Preset patterns ─────────────────────────────────────────────────────────

const PRESETS: { name: string; pattern: Pattern }[] = [
  {
    name: "Da Funk",
    pattern: [
      // KICK:  1   .   .   .   .   .   1   .   1   .   .   .   .   .   1   .
      [true, false, false, false, false, false, true, false, true, false, false, false, false, false, true, false],
      // SNARE: .   .   .   .   1   .   .   .   .   .   .   .   1   .   .   .
      [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      // HH CL: 1   .   1   .   1   .   1   .   1   .   1   .   1   .   1   .
      [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      // HH OP: .   .   .   .   .   .   .   1   .   .   .   .   .   .   .   1
      [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, true],
      // CLAP:  .   .   .   .   1   .   .   .   .   .   .   .   1   .   .   .
      [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      // BASS:  1   .   .   1   .   .   1   .   .   1   .   .   1   .   .   .
      [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, false],
      // LEAD:  .   .   1   .   .   .   .   .   .   .   1   .   .   .   .   1
      [false, false, true, false, false, false, false, false, false, false, true, false, false, false, false, true],
      // STAB:  .   .   .   .   .   1   .   .   .   .   .   .   .   1   .   .
      [false, false, false, false, false, true, false, false, false, false, false, false, false, true, false, false],
    ],
  },
  {
    name: "Around the World",
    pattern: [
      // KICK
      [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      // SNARE
      [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, true],
      // HH CL — 16th note drive
      [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      // HH OP
      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false],
      // CLAP
      [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      // BASS
      [true, false, true, false, false, true, false, false, true, false, true, false, false, true, false, false],
      // LEAD
      [false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, true],
      // STAB
      [true, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false],
    ],
  },
  {
    name: "Harder Better",
    pattern: [
      // KICK
      [true, false, false, false, false, false, false, true, false, false, true, false, false, false, false, false],
      // SNARE
      [false, false, false, false, true, false, false, false, false, false, false, false, true, false, true, false],
      // HH CL
      [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      // HH OP
      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true],
      // CLAP
      [false, false, false, false, true, false, false, true, false, false, false, false, true, false, false, false],
      // BASS
      [true, true, false, false, true, false, true, false, false, true, false, false, true, true, false, false],
      // LEAD
      [false, false, false, false, false, false, true, false, false, false, true, false, false, false, false, true],
      // STAB
      [false, false, true, false, false, false, false, false, false, false, true, false, false, false, false, false],
    ],
  },
];

// ─── Web Audio synthesis helpers ─────────────────────────────────────────────

function triggerKick(
  ctx: AudioContext,
  masterGain: GainNode,
  volume: number,
  time: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor();

  osc.type = "sine";
  osc.frequency.setValueAtTime(160, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.08);

  gain.gain.setValueAtTime(volume * 1.2, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

  osc.connect(gain);
  gain.connect(compressor);
  compressor.connect(masterGain);

  osc.start(time);
  osc.stop(time + 0.42);
}

function triggerSnare(
  ctx: AudioContext,
  masterGain: GainNode,
  volume: number,
  time: number,
): void {
  // Noise layer
  const bufferSize = ctx.sampleRate * 0.2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "highpass";
  noiseFilter.frequency.value = 800;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(volume * 0.8, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

  // Body oscillator
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(230, time);
  osc.frequency.exponentialRampToValueAtTime(100, time + 0.08);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(volume * 0.6, time);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);

  osc.connect(oscGain);
  oscGain.connect(masterGain);

  noise.start(time);
  noise.stop(time + 0.2);
  osc.start(time);
  osc.stop(time + 0.12);
}

function triggerHatClosed(
  ctx: AudioContext,
  masterGain: GainNode,
  volume: number,
  time: number,
): void {
  const bufferSize = ctx.sampleRate * 0.05;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 8000;
  filter.Q.value = 0.8;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume * 0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  noise.start(time);
  noise.stop(time + 0.06);
}

function triggerHatOpen(
  ctx: AudioContext,
  masterGain: GainNode,
  volume: number,
  time: number,
): void {
  const bufferSize = ctx.sampleRate * 0.4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 7000;
  filter.Q.value = 0.5;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume * 0.45, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  noise.start(time);
  noise.stop(time + 0.4);
}

function triggerClap(
  ctx: AudioContext,
  masterGain: GainNode,
  volume: number,
  time: number,
): void {
  const makeLayer = (offset: number, decay: number): void => {
    const bufferSize = ctx.sampleRate * decay;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1200;
    filter.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.6, time + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, time + offset + decay);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(time + offset);
    noise.stop(time + offset + decay + 0.01);
  };

  makeLayer(0, 0.02);
  makeLayer(0.012, 0.018);
  makeLayer(0.025, 0.05);
}

function triggerBass(
  ctx: AudioContext,
  masterGain: GainNode,
  volume: number,
  time: number,
  note: number = 55, // A1
): void {
  // Sub-oscillator (one octave below)
  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.value = note * 0.5;

  // Sawtooth main
  const saw = ctx.createOscillator();
  saw.type = "sawtooth";
  saw.frequency.value = note;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(800, time);
  filter.frequency.exponentialRampToValueAtTime(200, time + 0.25);
  filter.Q.value = 3;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume * 0.9, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

  const subGain = ctx.createGain();
  subGain.gain.value = 0.6;

  sub.connect(subGain);
  subGain.connect(filter);
  saw.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  sub.start(time);
  sub.stop(time + 0.32);
  saw.start(time);
  saw.stop(time + 0.32);
}

function triggerLead(
  ctx: AudioContext,
  masterGain: GainNode,
  volume: number,
  time: number,
  note: number = 880, // A5
): void {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  osc1.type = "sawtooth";
  osc2.type = "sawtooth";
  osc1.frequency.value = note;
  osc2.frequency.value = note * 1.008; // slight detune for thickness

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(4000, time);
  filter.frequency.exponentialRampToValueAtTime(500, time + 0.18);
  filter.Q.value = 2;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume * 0.5, time);
  gain.gain.setValueAtTime(volume * 0.4, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  osc1.start(time);
  osc1.stop(time + 0.24);
  osc2.start(time);
  osc2.stop(time + 0.24);
}

function triggerStab(
  ctx: AudioContext,
  masterGain: GainNode,
  volume: number,
  time: number,
): void {
  // Chord: root + major third + fifth (E minor-ish, French house vibe)
  const rootFreq = 164.81; // E3
  const thirdFreq = 196.0; // G3
  const fifthFreq = 246.94; // B3

  const makeStabOsc = (freq: number, detune: number): OscillatorNode => {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    osc.detune.value = detune;
    return osc;
  };

  const oscs = [
    makeStabOsc(rootFreq, -6),
    makeStabOsc(rootFreq, 6),
    makeStabOsc(thirdFreq, -4),
    makeStabOsc(thirdFreq, 4),
    makeStabOsc(fifthFreq, 0),
  ];

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(2500, time);
  filter.frequency.exponentialRampToValueAtTime(600, time + 0.12);
  filter.Q.value = 1.5;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume * 0.55, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

  for (const osc of oscs) {
    osc.connect(filter);
    osc.start(time);
    osc.stop(time + 0.17);
  }
  filter.connect(gain);
  gain.connect(masterGain);
}

// ─── Note sequences for melodic tracks ───────────────────────────────────────

const BASS_NOTES = [55, 55, 55, 73.4, 55, 55, 49, 55, 55, 55, 55, 61.7, 55, 55, 41.2, 55];
const LEAD_NOTES = [880, 1046.5, 880, 784, 880, 1046.5, 1174.7, 880, 880, 1046.5, 880, 784, 1046.5, 880, 784, 1174.7];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MusicCreator() {
  const [pattern, setPattern] = useState<Pattern>(PRESETS[0].pattern);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(124);
  const [currentStep, setCurrentStep] = useState(-1);
  const [masterVolume, setMasterVolume] = useState(0.75);
  const [trackVolumes, setTrackVolumes] = useState<number[]>(
    Array(NUM_TRACKS).fill(0.85),
  );
  const [filterCutoff, setFilterCutoff] = useState(18000);
  const [sidechainOn, setSidechainOn] = useState(true);
  const [activePreset, setActivePreset] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const masterFilterRef = useRef<BiquadFilterNode | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const nextStepTimeRef = useRef(0);
  const currentStepRef = useRef(0);
  const patternRef = useRef<Pattern>(pattern);
  const bpmRef = useRef(bpm);
  const trackVolumesRef = useRef(trackVolumes);
  const masterVolumeRef = useRef(masterVolume);
  const sidechainOnRef = useRef(sidechainOn);

  // Keep refs in sync
  useEffect(() => { patternRef.current = pattern; }, [pattern]);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { trackVolumesRef.current = trackVolumes; }, [trackVolumes]);
  useEffect(() => { sidechainOnRef.current = sidechainOn; }, [sidechainOn]);
  useEffect(() => {
    masterVolumeRef.current = masterVolume;
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(masterVolume, audioCtxRef.current!.currentTime, 0.01);
    }
  }, [masterVolume]);
  useEffect(() => {
    if (masterFilterRef.current) {
      masterFilterRef.current.frequency.setTargetAtTime(filterCutoff, audioCtxRef.current!.currentTime, 0.01);
    }
  }, [filterCutoff]);

  const initAudio = useCallback((): AudioContext => {
    if (audioCtxRef.current) return audioCtxRef.current;

    const ctx = new AudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.value = masterVolumeRef.current;

    const masterFilter = ctx.createBiquadFilter();
    masterFilter.type = "lowpass";
    masterFilter.frequency.value = filterCutoff;
    masterFilter.Q.value = 0.7;

    masterGain.connect(masterFilter);
    masterFilter.connect(ctx.destination);

    audioCtxRef.current = ctx;
    masterGainRef.current = masterGain;
    masterFilterRef.current = masterFilter;

    return ctx;
  }, [filterCutoff]);

  const applySidechain = useCallback((ctx: AudioContext, time: number): void => {
    if (!masterGainRef.current || !sidechainOnRef.current) return;
    const g = masterGainRef.current.gain;
    g.cancelScheduledValues(time);
    // Duck on beat
    g.setValueAtTime(masterVolumeRef.current * 0.25, time);
    g.setTargetAtTime(masterVolumeRef.current, time + 0.01, 0.08);
  }, []);

  const scheduleStep = useCallback((ctx: AudioContext, step: number, time: number): void => {
    const pat = patternRef.current;
    const vols = trackVolumesRef.current;
    const mg = masterGainRef.current!;

    if (pat[0][step]) {
      triggerKick(ctx, mg, vols[0], time);
      applySidechain(ctx, time);
    }
    if (pat[1][step]) triggerSnare(ctx, mg, vols[1], time);
    if (pat[2][step]) triggerHatClosed(ctx, mg, vols[2], time);
    if (pat[3][step]) triggerHatOpen(ctx, mg, vols[3], time);
    if (pat[4][step]) triggerClap(ctx, mg, vols[4], time);
    if (pat[5][step]) triggerBass(ctx, mg, vols[5], time, BASS_NOTES[step]);
    if (pat[6][step]) triggerLead(ctx, mg, vols[6], time, LEAD_NOTES[step]);
    if (pat[7][step]) triggerStab(ctx, mg, vols[7], time);
  }, [applySidechain]);

  const runScheduler = useCallback((): void => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const LOOKAHEAD = 0.1; // seconds ahead to schedule
    const SCHEDULE_INTERVAL = 25; // ms between scheduler runs

    const schedule = (): void => {
      const stepDuration = 60 / bpmRef.current / 4; // 16th note duration

      while (nextStepTimeRef.current < ctx.currentTime + LOOKAHEAD) {
        const step = currentStepRef.current % NUM_STEPS;
        scheduleStep(ctx, step, nextStepTimeRef.current);

        // Update visual indicator - schedule it close to the actual audio time
        const capturedStep = step;
        const capturedTime = nextStepTimeRef.current;
        const delay = Math.max(0, (capturedTime - ctx.currentTime) * 1000);
        setTimeout(() => {
          setCurrentStep(capturedStep);
        }, delay);

        nextStepTimeRef.current += stepDuration;
        currentStepRef.current += 1;
      }

      schedulerRef.current = window.setTimeout(schedule, SCHEDULE_INTERVAL);
    };

    schedule();
  }, [scheduleStep]);

  const handlePlay = useCallback((): void => {
    const ctx = initAudio();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    currentStepRef.current = 0;
    nextStepTimeRef.current = ctx.currentTime + 0.05;
    setCurrentStep(-1);
    setIsPlaying(true);
    runScheduler();
  }, [initAudio, runScheduler]);

  const handleStop = useCallback((): void => {
    if (schedulerRef.current !== null) {
      clearTimeout(schedulerRef.current);
      schedulerRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStep(-1);
  }, []);

  const toggleStep = useCallback((track: number, step: number): void => {
    setPattern((prev) => {
      const next = prev.map((row) => [...row]);
      next[track][step] = !next[track][step];
      return next;
    });
  }, []);

  const loadPreset = useCallback((index: number): void => {
    setActivePreset(index);
    setPattern(PRESETS[index].pattern);
  }, []);

  const clearPattern = useCallback((): void => {
    setPattern(emptyPattern());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (schedulerRef.current !== null) clearTimeout(schedulerRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  // ─── Styles ─────────────────────────────────────────────────────────────────

  const S = {
    root: {
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#e5e5e5",
      fontFamily: "'Courier New', Courier, monospace",
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      padding: "16px",
      userSelect: "none" as const,
    },
    header: {
      textAlign: "center" as const,
      marginBottom: "20px",
    },
    title: {
      fontSize: "clamp(18px, 4vw, 28px)",
      fontWeight: 700,
      letterSpacing: "0.15em",
      background: "linear-gradient(135deg, #00b4d8, #a855f7, #ff6b6b)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      marginBottom: "4px",
    },
    subtitle: {
      fontSize: "11px",
      color: "#555",
      letterSpacing: "0.2em",
      textTransform: "uppercase" as const,
    },
    panel: {
      background: "#111",
      border: "1px solid #222",
      borderRadius: "8px",
      padding: "14px 16px",
      marginBottom: "12px",
      width: "100%",
      maxWidth: "900px",
    },
    panelLabel: {
      fontSize: "10px",
      color: "#555",
      letterSpacing: "0.2em",
      textTransform: "uppercase" as const,
      marginBottom: "10px",
    },
    transportRow: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap" as const,
    },
    btn: (active: boolean, color: string = "#00b4d8"): React.CSSProperties => ({
      background: active ? color : "transparent",
      color: active ? "#000" : color,
      border: `1px solid ${color}`,
      borderRadius: "4px",
      padding: "8px 18px",
      cursor: "pointer",
      fontSize: "12px",
      fontFamily: "'Courier New', Courier, monospace",
      fontWeight: 700,
      letterSpacing: "0.1em",
      transition: "all 0.1s",
      minWidth: "70px",
    }),
    presetBtn: (active: boolean): React.CSSProperties => ({
      background: active ? "#a855f7" : "transparent",
      color: active ? "#000" : "#a855f7",
      border: "1px solid #a855f7",
      borderRadius: "4px",
      padding: "6px 12px",
      cursor: "pointer",
      fontSize: "11px",
      fontFamily: "'Courier New', Courier, monospace",
      fontWeight: 600,
      letterSpacing: "0.05em",
      transition: "all 0.1s",
    }),
    bpmDisplay: {
      fontSize: "20px",
      fontWeight: 700,
      color: "#ffd93d",
      minWidth: "56px",
      textAlign: "center" as const,
    },
    slider: {
      WebkitAppearance: "none" as const,
      appearance: "none" as const,
      height: "4px",
      borderRadius: "2px",
      background: "#333",
      outline: "none",
      cursor: "pointer",
    },
    sequencerWrapper: {
      overflowX: "auto" as const,
      width: "100%",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "60px repeat(16, 1fr)",
      gap: "3px",
      minWidth: "580px",
    },
    trackLabel: (color: string): React.CSSProperties => ({
      fontSize: "10px",
      color,
      fontWeight: 700,
      letterSpacing: "0.1em",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      paddingRight: "8px",
      height: "32px",
    }),
    stepBtn: (
      active: boolean,
      isCurrent: boolean,
      color: string,
      beatGroup: number,
    ): React.CSSProperties => ({
      height: "32px",
      borderRadius: "3px",
      border: isCurrent
        ? `2px solid #fff`
        : active
        ? "none"
        : `1px solid ${beatGroup % 2 === 0 ? "#1e1e1e" : "#1a1a1a"}`,
      background: active
        ? isCurrent
          ? "#fff"
          : color
        : isCurrent
        ? "#2a2a2a"
        : beatGroup % 2 === 0
        ? "#161616"
        : "#131313",
      cursor: "pointer",
      transition: "background 0.05s, transform 0.05s",
      transform: active && isCurrent ? "scale(0.95)" : "scale(1)",
      boxShadow: active ? `0 0 6px ${color}88` : "none",
    }),
    stepIndicatorRow: {
      display: "grid",
      gridTemplateColumns: "60px repeat(16, 1fr)",
      gap: "3px",
      minWidth: "580px",
      marginBottom: "4px",
    },
    stepNum: (isCurrent: boolean, i: number): React.CSSProperties => ({
      height: "12px",
      fontSize: "8px",
      color: isCurrent ? "#fff" : (i + 1) % 4 === 1 ? "#444" : "#252525",
      textAlign: "center" as const,
      fontWeight: isCurrent ? 700 : 400,
    }),
    volumeRow: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      height: "20px",
      marginTop: "1px",
    },
    controlRow: {
      display: "flex",
      alignItems: "center",
      gap: "20px",
      flexWrap: "wrap" as const,
    },
    controlGroup: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "4px",
    },
    controlLabel: {
      fontSize: "9px",
      color: "#555",
      letterSpacing: "0.15em",
      textTransform: "uppercase" as const,
    },
    controlValue: {
      fontSize: "13px",
      color: "#06d6a0",
      fontWeight: 700,
    },
    sidechainIndicator: (on: boolean): React.CSSProperties => ({
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      background: on ? "#06d6a0" : "#333",
      boxShadow: on ? "0 0 6px #06d6a0" : "none",
      display: "inline-block",
      marginRight: "6px",
      transition: "all 0.15s",
    }),
  };

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.title}>MUSIC CREATOR</div>
        <div style={S.subtitle}>French House Sequencer — Web Audio API</div>
      </div>

      {/* Transport Panel */}
      <div style={S.panel}>
        <div style={S.panelLabel}>Transport</div>
        <div style={S.transportRow}>
          {!isPlaying ? (
            <button style={S.btn(false, "#06d6a0")} onClick={handlePlay}>
              &#9654; PLAY
            </button>
          ) : (
            <button style={S.btn(true, "#ff6b6b")} onClick={handleStop}>
              &#9646;&#9646; STOP
            </button>
          )}

          <div style={S.bpmDisplay}>{bpm}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: "120px" }}>
            <div style={S.controlLabel}>BPM</div>
            <input
              type="range"
              min={80}
              max={160}
              value={bpm}
              style={{ ...S.slider, width: "100%" }}
              onChange={(e) => setBpm(Number(e.target.value))}
            />
          </div>

          <button
            style={S.btn(sidechainOn, "#06d6a0")}
            onClick={() => setSidechainOn((v) => !v)}
          >
            <span style={S.sidechainIndicator(sidechainOn)} />
            PUMP
          </button>

          <button style={S.btn(false, "#555")} onClick={clearPattern}>
            CLR
          </button>
        </div>
      </div>

      {/* Presets Panel */}
      <div style={S.panel}>
        <div style={S.panelLabel}>Presets</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" as const }}>
          {PRESETS.map((preset, i) => (
            <button
              key={preset.name}
              style={S.presetBtn(activePreset === i)}
              onClick={() => loadPreset(i)}
            >
              {preset.name.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Sequencer Grid */}
      <div style={S.panel}>
        <div style={S.panelLabel}>Sequencer</div>
        <div style={S.sequencerWrapper}>
          {/* Step number indicators */}
          <div style={S.stepIndicatorRow}>
            <div />
            {Array.from({ length: NUM_STEPS }, (_, i) => (
              <div key={i} style={S.stepNum(currentStep === i, i)}>
                {(i + 1) % 4 === 1 ? i + 1 : "·"}
              </div>
            ))}
          </div>

          {/* Tracks */}
          {TRACK_CONFIGS.map((track, t) => (
            <div key={track.name}>
              <div style={S.grid}>
                <div style={S.trackLabel(track.color)}>{track.name}</div>
                {Array.from({ length: NUM_STEPS }, (_, s) => {
                  const beatGroup = Math.floor(s / 4);
                  return (
                    <button
                      key={s}
                      style={S.stepBtn(pattern[t][s], currentStep === s, track.color, beatGroup)}
                      onClick={() => toggleStep(t, s)}
                      aria-label={`${track.name} step ${s + 1} ${pattern[t][s] ? "on" : "off"}`}
                      aria-pressed={pattern[t][s]}
                    />
                  );
                })}
              </div>
              {/* Per-track volume slider */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "580px", marginTop: "1px", marginBottom: "3px" }}>
                <div style={{ width: "60px", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "8px" }}>
                  <div style={{ ...S.controlLabel, fontSize: "8px" }}>VOL</div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={trackVolumes[t]}
                  style={{ ...S.slider, flex: 1, accentColor: track.color }}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTrackVolumes((prev) => {
                      const next = [...prev];
                      next[t] = val;
                      return next;
                    });
                  }}
                />
                <div style={{ fontSize: "10px", color: "#444", width: "28px", textAlign: "right" as const }}>
                  {Math.round(trackVolumes[t] * 100)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Master Controls */}
      <div style={S.panel}>
        <div style={S.panelLabel}>Master</div>
        <div style={S.controlRow}>
          <div style={S.controlGroup}>
            <div style={S.controlLabel}>Master Volume</div>
            <div style={S.controlValue}>{Math.round(masterVolume * 100)}%</div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={masterVolume}
              style={{ ...S.slider, width: "140px", accentColor: "#00b4d8" }}
              onChange={(e) => setMasterVolume(Number(e.target.value))}
            />
          </div>

          <div style={S.controlGroup}>
            <div style={S.controlLabel}>Filter Cutoff</div>
            <div style={{ ...S.controlValue, color: "#a855f7" }}>
              {filterCutoff >= 1000
                ? `${(filterCutoff / 1000).toFixed(1)}k`
                : filterCutoff}
              Hz
            </div>
            <input
              type="range"
              min={200}
              max={18000}
              step={100}
              value={filterCutoff}
              style={{ ...S.slider, width: "140px", accentColor: "#a855f7" }}
              onChange={(e) => setFilterCutoff(Number(e.target.value))}
            />
          </div>

          <div style={S.controlGroup}>
            <div style={S.controlLabel}>Tempo</div>
            <div style={{ ...S.controlValue, color: "#ffd93d" }}>{bpm} BPM</div>
            <div style={{ fontSize: "10px", color: "#444", marginTop: "2px" }}>
              {(60000 / bpm / 4).toFixed(1)}ms / 16th
            </div>
          </div>

          <div style={S.controlGroup}>
            <div style={S.controlLabel}>Sidechain Pump</div>
            <div style={{ display: "flex", alignItems: "center", marginTop: "4px" }}>
              <span style={S.sidechainIndicator(sidechainOn)} />
              <span style={{ fontSize: "12px", color: sidechainOn ? "#06d6a0" : "#555" }}>
                {sidechainOn ? "ON" : "OFF"}
              </span>
            </div>
            <div style={{ fontSize: "10px", color: "#444", marginTop: "2px" }}>
              Classic Daft Punk ducking
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center" as const, color: "#333", fontSize: "10px", letterSpacing: "0.15em", marginTop: "8px" }}>
        SPIKE.LAND — MUSIC CREATOR — WEB AUDIO API
      </div>
    </div>
  );
}
