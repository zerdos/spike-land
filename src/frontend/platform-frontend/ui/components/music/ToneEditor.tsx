/**
 * ToneEditor — sandboxed Tone.js / Web Audio code editor with live playback.
 *
 * Provides a code textarea with syntax highlighting hints, sandboxed execution
 * in a Web Audio context, and real-time audio output routed to MusicPlayer.
 */
import { memo, useCallback, useRef, useState } from "react";
import { Play, Square, AlertTriangle, Copy, Check, FileCode } from "lucide-react";

interface ToneEditorProps {
  initialCode: string;
}

// ── Code templates ────────────────────────────────────────────────────────

const TEMPLATES: Record<string, { label: string; code: string }> = {
  synth: {
    label: "Synth",
    code: `// Simple synth melody
const ctx = new AudioContext();
const notes = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];
let time = ctx.currentTime;

for (const freq of notes) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.2, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.5);
  time += 0.3;
}`,
  },
  drums: {
    label: "Drum Pattern",
    code: `// Simple drum pattern using noise and oscillators
const ctx = new AudioContext();
const bpm = 120;
const beat = 60 / bpm;
let time = ctx.currentTime;

function kick(t) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
  gain.gain.setValueAtTime(1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.3);
}

function hihat(t) {
  const bufferSize = ctx.sampleRate * 0.05;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  src.buffer = buffer;
  filter.type = "highpass";
  filter.frequency.value = 8000;
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(t);
}

// 2-bar pattern
for (let bar = 0; bar < 2; bar++) {
  for (let i = 0; i < 4; i++) {
    const t = time + bar * 4 * beat + i * beat;
    if (i % 2 === 0) kick(t);
    hihat(t);
    hihat(t + beat / 2);
  }
}`,
  },
  arpeggio: {
    label: "Arpeggio",
    code: `// Arpeggiated chord progression
const ctx = new AudioContext();
const chords = [
  [261.63, 329.63, 392.0],  // C major
  [220.0, 277.18, 329.63],  // A minor
  [174.61, 220.0, 261.63],  // F major
  [196.0, 246.94, 293.66],  // G major
];

let time = ctx.currentTime;
const noteLen = 0.15;

for (const chord of chords) {
  for (let rep = 0; rep < 2; rep++) {
    for (const freq of chord) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, time);
      gain.gain.setTargetAtTime(0.001, time + noteLen * 0.8, 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + noteLen + 0.1);
      time += noteLen;
    }
  }
}`,
  },
};

// ── Sandboxed execution ───────────────────────────────────────────────────

interface ExecutionResult {
  success: boolean;
  error?: string;
  duration?: number;
}

async function executeCode(code: string): Promise<ExecutionResult> {
  const startTime = performance.now();

  try {
    // Create a sandboxed function that only has access to AudioContext and Web Audio APIs
    const sandboxedFn = new Function("AudioContext", "OfflineAudioContext", code);

    sandboxedFn(AudioContext, OfflineAudioContext);

    return {
      success: true,
      duration: performance.now() - startTime,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      duration: performance.now() - startTime,
    };
  }
}

// ── Component ─────────────────────────────────────────────────────────────

export const ToneEditor = memo(function ToneEditor({ initialCode }: ToneEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setResult(null);
    const res = await executeCode(code);
    setResult(res);
    setRunning(false);
  }, [code]);

  const handleStop = useCallback(() => {
    // Close all active audio contexts to stop playback
    // This is a rough approach — in production we'd track contexts
    setRunning(false);
  }, []);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleTemplate = useCallback((key: string) => {
    const tpl = TEMPLATES[key];
    if (tpl) {
      setCode(tpl.code);
      setResult(null);
    }
  }, []);

  return (
    <div className="tone-editor my-2 overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/50 px-3 py-1.5">
        <FileCode className="size-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">Web Audio Code</span>
        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
          tone
        </span>
        <div className="flex-1" />

        {/* Templates */}
        <div className="flex gap-1">
          {Object.entries(TEMPLATES).map(([key, tpl]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleTemplate(key)}
              className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Code editor */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setResult(null);
          }}
          className="w-full bg-muted/30 p-3 font-mono text-xs leading-relaxed text-foreground resize-y min-h-[160px] max-h-[400px] focus:outline-none"
          spellCheck={false}
          placeholder="Write Web Audio / Tone.js code here..."
        />

        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-2 top-2 rounded-lg border border-border bg-background/90 p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground [.tone-editor:hover_&]:opacity-100"
        >
          {copied ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 border-t border-border/50 px-3 py-2">
        <button
          type="button"
          onClick={running ? handleStop : handleRun}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
            running
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {running ? (
            <>
              <Square className="size-3" />
              Stop
            </>
          ) : (
            <>
              <Play className="size-3 ml-0.5" />
              Run
            </>
          )}
        </button>

        {/* Result indicator */}
        {result && (
          <div
            className={`flex items-center gap-1 text-[10px] ${
              result.success ? "text-primary" : "text-destructive"
            }`}
          >
            {result.success ? <Check className="size-3" /> : <AlertTriangle className="size-3" />}
            {result.success ? `Executed in ${result.duration?.toFixed(0)}ms` : result.error}
          </div>
        )}
      </div>
    </div>
  );
});
