/**
 * MidiEditor — piano roll editor for MIDI data with playback.
 *
 * Renders a piano roll visualization, supports basic note editing
 * (click to add/remove), and plays back via Web Audio synthesis.
 */
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Plus, Trash2, Download, Music2 } from "lucide-react";
import type { MidiNote } from "./types";

interface MidiEditorProps {
  /** Initial MIDI notes (if parsing from a .mid file, convert first) */
  initialNotes?: MidiNote[];
  /** Number of beats visible in the piano roll */
  totalBeats?: number;
  /** BPM for playback */
  bpm?: number;
}

// ── Constants ─────────────────────────────────────────────────────────────

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const MIN_PITCH = 48; // C3
const MAX_PITCH = 84; // C6
const PITCH_RANGE = MAX_PITCH - MIN_PITCH;
const CELL_HEIGHT = 12;
const BEAT_WIDTH = 40;
const KEY_WIDTH = 40;

function noteName(pitch: number): string {
  return `${NOTE_NAMES[pitch % 12]}${Math.floor(pitch / 12) - 1}`;
}

function isBlackKey(pitch: number): boolean {
  const n = pitch % 12;
  return n === 1 || n === 3 || n === 6 || n === 8 || n === 10;
}

function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function generateNoteId(): string {
  return `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── GM Instruments (simplified — just a few timbres via oscillator types) ─

const INSTRUMENTS: { name: string; oscType: OscillatorType }[] = [
  { name: "Piano", oscType: "triangle" },
  { name: "Organ", oscType: "sine" },
  { name: "Guitar", oscType: "sawtooth" },
  { name: "Synth Lead", oscType: "square" },
];

// ── Component ─────────────────────────────────────────────────────────────

export const MidiEditor = memo(function MidiEditor({
  initialNotes = [],
  totalBeats = 16,
  bpm = 120,
}: MidiEditorProps) {
  const [notes, setNotes] = useState<MidiNote[]>(initialNotes);
  const [playing, setPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [instrument, setInstrument] = useState(0);
  const [tool, setTool] = useState<"draw" | "erase">("draw");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(0);

  const gridWidth = totalBeats * BEAT_WIDTH;
  const gridHeight = PITCH_RANGE * CELL_HEIGHT;
  const beatDuration = 60 / bpm;

  // Draw piano roll
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const totalWidth = KEY_WIDTH + gridWidth;
    canvas.width = totalWidth * dpr;
    canvas.height = gridHeight * dpr;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = "hsl(var(--muted, 210 40% 96.1%))";
    ctx.fillRect(0, 0, totalWidth, gridHeight);

    // Piano keys on the left
    for (let p = MAX_PITCH - 1; p >= MIN_PITCH; p--) {
      const y = (MAX_PITCH - 1 - p) * CELL_HEIGHT;
      const black = isBlackKey(p);

      // Key background
      ctx.fillStyle = black
        ? "hsl(var(--foreground, 222.2 84% 4.9%))"
        : "hsl(var(--background, 0 0% 100%))";
      ctx.fillRect(0, y, KEY_WIDTH, CELL_HEIGHT);

      // Key border
      ctx.strokeStyle = "hsl(var(--border, 214.3 31.8% 91.4%))";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(0, y, KEY_WIDTH, CELL_HEIGHT);

      // Note name (only for C notes and when row is tall enough)
      if (p % 12 === 0) {
        ctx.fillStyle = black
          ? "hsl(var(--background, 0 0% 100%))"
          : "hsl(var(--foreground, 222.2 84% 4.9%))";
        ctx.font = "8px monospace";
        ctx.textBaseline = "middle";
        ctx.fillText(noteName(p), 3, y + CELL_HEIGHT / 2);
      }
    }

    // Grid
    for (let p = MAX_PITCH - 1; p >= MIN_PITCH; p--) {
      const y = (MAX_PITCH - 1 - p) * CELL_HEIGHT;
      const black = isBlackKey(p);

      // Row background
      ctx.fillStyle = black ? "rgba(0, 0, 0, 0.05)" : "transparent";
      if (black) {
        ctx.fillRect(KEY_WIDTH, y, gridWidth, CELL_HEIGHT);
      }

      // Row line
      ctx.strokeStyle = "hsl(var(--border, 214.3 31.8% 91.4%) / 0.3)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(KEY_WIDTH, y + CELL_HEIGHT);
      ctx.lineTo(KEY_WIDTH + gridWidth, y + CELL_HEIGHT);
      ctx.stroke();
    }

    // Beat lines
    for (let b = 0; b <= totalBeats; b++) {
      const x = KEY_WIDTH + b * BEAT_WIDTH;
      ctx.strokeStyle =
        b % 4 === 0
          ? "hsl(var(--border, 214.3 31.8% 91.4%))"
          : "hsl(var(--border, 214.3 31.8% 91.4%) / 0.3)";
      ctx.lineWidth = b % 4 === 0 ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, gridHeight);
      ctx.stroke();
    }

    // Notes
    for (const note of notes) {
      const x = KEY_WIDTH + note.startTime * BEAT_WIDTH;
      const y = (MAX_PITCH - 1 - note.pitch) * CELL_HEIGHT;
      const w = note.duration * BEAT_WIDTH;

      // Note rectangle
      const alpha = 0.5 + (note.velocity / 127) * 0.5;
      ctx.fillStyle = `hsl(var(--primary, 221.2 83.2% 53.3%) / ${alpha})`;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, Math.max(w - 2, 4), CELL_HEIGHT - 2, 2);
      ctx.fill();

      // Note border
      ctx.strokeStyle = "hsl(var(--primary, 221.2 83.2% 53.3%))";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, Math.max(w - 2, 4), CELL_HEIGHT - 2, 2);
      ctx.stroke();
    }

    // Playhead
    if (playing || currentBeat > 0) {
      const px = KEY_WIDTH + currentBeat * BEAT_WIDTH;
      ctx.strokeStyle = "hsl(var(--destructive, 0 84.2% 60.2%))";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, gridHeight);
      ctx.stroke();
    }
  }, [notes, totalBeats, gridWidth, gridHeight, playing, currentBeat]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Click to add/remove notes
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const x = ((e.clientX - rect.left) * dpr) / (rect.width / (KEY_WIDTH + gridWidth));
      const y = ((e.clientY - rect.top) * dpr) / (rect.height / gridHeight);

      if (x < KEY_WIDTH) return; // clicked on piano keys

      const beat = Math.floor((x - KEY_WIDTH) / BEAT_WIDTH);
      const pitch = MAX_PITCH - 1 - Math.floor(y / CELL_HEIGHT);

      if (pitch < MIN_PITCH || pitch >= MAX_PITCH || beat < 0 || beat >= totalBeats) return;

      if (tool === "erase") {
        // Remove any note at this position
        setNotes((prev) =>
          prev.filter(
            (n) => !(n.pitch === pitch && n.startTime <= beat && n.startTime + n.duration > beat),
          ),
        );
      } else {
        // Check if there's already a note here
        const existing = notes.find(
          (n) => n.pitch === pitch && n.startTime <= beat && n.startTime + n.duration > beat,
        );
        if (existing) {
          // Remove it (toggle behavior)
          setNotes((prev) => prev.filter((n) => n.id !== existing.id));
        } else {
          // Add a new note
          setNotes((prev) => [
            ...prev,
            {
              id: generateNoteId(),
              pitch,
              startTime: beat,
              duration: 1,
              velocity: 100,
              channel: 0,
            },
          ]);
        }
      }
    },
    [notes, tool, totalBeats, gridWidth, gridHeight],
  );

  // Playback
  const playMidi = useCallback(() => {
    if (notes.length === 0) return;

    const audioCtx = new AudioContext();
    ctxRef.current = audioCtx;
    const inst = INSTRUMENTS[instrument];
    const startTime = audioCtx.currentTime;
    startTimeRef.current = startTime;

    for (const note of notes) {
      const noteStart = startTime + note.startTime * beatDuration;
      const noteDur = note.duration * beatDuration;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = inst.oscType;
      osc.frequency.value = midiToFreq(note.pitch);

      const vol = (note.velocity / 127) * 0.3;
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(vol, noteStart + 0.01);
      gain.gain.setTargetAtTime(vol * 0.7, noteStart + 0.01, noteDur * 0.3);
      gain.gain.setTargetAtTime(0.001, noteStart + noteDur * 0.8, 0.05);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(noteStart);
      osc.stop(noteStart + noteDur + 0.1);
    }

    setPlaying(true);
    setCurrentBeat(0);

    // Animate playhead
    const totalDur = Math.max(...notes.map((n) => n.startTime + n.duration)) * beatDuration;
    const animate = () => {
      const elapsed = audioCtx.currentTime - startTime;
      const beat = elapsed / beatDuration;
      setCurrentBeat(beat);

      if (elapsed < totalDur) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setPlaying(false);
        setCurrentBeat(0);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [notes, instrument, beatDuration]);

  const stopMidi = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    void ctxRef.current?.close();
    ctxRef.current = null;
    setPlaying(false);
    setCurrentBeat(0);
  }, []);

  // Export as basic MIDI-like JSON
  const handleExport = useCallback(() => {
    const data = JSON.stringify({ bpm, notes }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "composition.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [notes, bpm]);

  return (
    <div className="midi-editor my-2 overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/50 px-3 py-1.5">
        <Music2 className="size-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">MIDI Piano Roll</span>
        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
          midi
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">{bpm} BPM</span>
        <div className="flex-1" />

        {/* Instrument selector */}
        <select
          value={instrument}
          onChange={(e) => setInstrument(Number(e.target.value))}
          className="rounded border border-border bg-transparent px-1.5 py-0.5 text-[10px] text-foreground"
        >
          {INSTRUMENTS.map((inst, i) => (
            <option key={inst.name} value={i}>
              {inst.name}
            </option>
          ))}
        </select>
      </div>

      {/* Piano roll */}
      <div className="overflow-auto" style={{ maxHeight: gridHeight + 2 }}>
        <canvas
          ref={canvasRef}
          className="cursor-crosshair"
          style={{ width: KEY_WIDTH + gridWidth, height: gridHeight }}
          onClick={handleCanvasClick}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 border-t border-border/50 px-3 py-2">
        <button
          type="button"
          onClick={playing ? stopMidi : playMidi}
          disabled={notes.length === 0 && !playing}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
            playing
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          } disabled:opacity-40`}
        >
          {playing ? (
            <>
              <Pause className="size-3" />
              Stop
            </>
          ) : (
            <>
              <Play className="size-3 ml-0.5" />
              Play
            </>
          )}
        </button>

        {/* Tool selector */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setTool("draw")}
            className={`flex items-center gap-1 px-2 py-0.5 text-[10px] ${
              tool === "draw"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Plus className="size-3" />
            Draw
          </button>
          <button
            type="button"
            onClick={() => setTool("erase")}
            className={`flex items-center gap-1 px-2 py-0.5 text-[10px] ${
              tool === "erase"
                ? "bg-destructive/10 text-destructive"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Trash2 className="size-3" />
            Erase
          </button>
        </div>

        <div className="flex-1" />

        <span className="text-[10px] text-muted-foreground">
          {notes.length} note{notes.length !== 1 ? "s" : ""}
        </span>

        <button
          type="button"
          onClick={handleExport}
          disabled={notes.length === 0}
          className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <Download className="size-3" />
          Export
        </button>
      </div>
    </div>
  );
});
