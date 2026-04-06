/**
 * ABCEditor — inline ABC notation editor with sheet music rendering and playback.
 *
 * Uses a simple textarea for editing ABC notation, renders the notation as
 * sheet music on a canvas/SVG, and plays it back via Web Audio synthesis.
 */
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Edit3, RotateCcw } from "lucide-react";
import { MusicPlayer } from "./MusicPlayer";
import { parseAbcMeta } from "./detectMusic";

interface ABCEditorProps {
  /** Initial ABC notation source */
  initialCode: string;
}

// ── Simple ABC-to-Audio synthesis ─────────────────────────────────────────

interface ParsedNote {
  frequency: number;
  duration: number; // seconds
  startTime: number; // seconds
}

const NOTE_FREQS: Record<string, number> = {
  C: 261.63,
  D: 293.66,
  E: 329.63,
  F: 349.23,
  G: 392.0,
  A: 440.0,
  B: 493.88,
  c: 523.25,
  d: 587.33,
  e: 659.25,
  f: 698.46,
  g: 783.99,
  a: 880.0,
  b: 987.77,
};

function parseAbcToNotes(abc: string, tempo = 120): ParsedNote[] {
  const notes: ParsedNote[] = [];
  const beatDuration = 60 / tempo;
  let currentTime = 0;
  let inBody = false;

  for (const line of abc.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("K:")) {
      inBody = true;
      continue;
    }
    if (!inBody || trimmed.startsWith("%") || /^[A-Z]:/.test(trimmed)) continue;

    // Simple note parser — handles basic notes, rests, and durations
    let i = 0;
    while (i < trimmed.length) {
      const ch = trimmed[i];

      // Skip bar lines, spaces, decorations
      if (ch === "|" || ch === " " || ch === ":" || ch === "[" || ch === "]") {
        i++;
        continue;
      }

      // Rest
      if (ch === "z" || ch === "Z") {
        let dur = 1;
        if (i + 1 < trimmed.length && /\d/.test(trimmed[i + 1])) {
          dur = Number(trimmed[i + 1]);
          i++;
        }
        currentTime += beatDuration * dur;
        i++;
        continue;
      }

      // Accidentals
      let accidental = 0;
      if (ch === "^") {
        accidental = 1;
        i++;
      } else if (ch === "_") {
        accidental = -1;
        i++;
      } else if (ch === "=") {
        i++;
      }

      // Note letter
      const noteCh = trimmed[i];
      if (!noteCh || !NOTE_FREQS[noteCh]) {
        i++;
        continue;
      }

      let freq = NOTE_FREQS[noteCh];
      i++;

      // Octave modifiers
      while (i < trimmed.length && trimmed[i] === "'") {
        freq *= 2;
        i++;
      }
      while (i < trimmed.length && trimmed[i] === ",") {
        freq /= 2;
        i++;
      }

      // Apply accidental
      if (accidental !== 0) {
        freq *= Math.pow(2, accidental / 12);
      }

      // Duration modifier
      let dur = 1;
      if (i < trimmed.length && /\d/.test(trimmed[i])) {
        dur = Number(trimmed[i]);
        i++;
      }
      if (i < trimmed.length && trimmed[i] === "/") {
        i++;
        const divisor = i < trimmed.length && /\d/.test(trimmed[i]) ? Number(trimmed[i++]) : 2;
        dur = dur / divisor;
      }

      notes.push({
        frequency: freq,
        duration: beatDuration * dur * 0.9, // slight gap between notes
        startTime: currentTime,
      });
      currentTime += beatDuration * dur;
    }
  }

  return notes;
}

// ── Simple sheet music SVG renderer ───────────────────────────────────────

function renderAbcToSvg(abc: string): string {
  const notes = parseAbcToNotes(abc);
  if (notes.length === 0) {
    return `<svg viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg">
      <text x="200" y="45" text-anchor="middle" fill="currentColor" font-size="12" opacity="0.5">No notes to display</text>
    </svg>`;
  }

  const noteWidth = 24;
  const width = Math.max(400, notes.length * noteWidth + 60);
  const staffTop = 15;
  const lineSpacing = 10;

  // Staff lines
  let svg = `<svg viewBox="0 0 ${width} 80" xmlns="http://www.w3.org/2000/svg" class="text-foreground">`;

  // Five staff lines
  for (let i = 0; i < 5; i++) {
    const y = staffTop + i * lineSpacing;
    svg += `<line x1="10" y1="${y}" x2="${width - 10}" y2="${y}" stroke="currentColor" stroke-width="0.5" opacity="0.3"/>`;
  }

  // Treble clef placeholder
  svg += `<text x="15" y="${staffTop + 35}" font-size="32" fill="currentColor" opacity="0.6">𝄞</text>`;

  // Notes
  notes.forEach((note, i) => {
    const x = 55 + i * noteWidth;
    // Map frequency to staff position (simplified)
    const semitone = Math.round(12 * Math.log2(note.frequency / 261.63));
    const staffY = staffTop + 40 - semitone * 2.5;
    const clampedY = Math.max(5, Math.min(70, staffY));

    // Note head (filled oval)
    svg += `<ellipse cx="${x}" cy="${clampedY}" rx="5" ry="3.5" fill="currentColor" transform="rotate(-10 ${x} ${clampedY})"/>`;

    // Stem
    const stemUp = clampedY > staffTop + 20;
    if (stemUp) {
      svg += `<line x1="${x + 4.5}" y1="${clampedY}" x2="${x + 4.5}" y2="${clampedY - 25}" stroke="currentColor" stroke-width="1"/>`;
    } else {
      svg += `<line x1="${x - 4.5}" y1="${clampedY}" x2="${x - 4.5}" y2="${clampedY + 25}" stroke="currentColor" stroke-width="1"/>`;
    }

    // Ledger lines if needed
    if (clampedY > staffTop + 4 * lineSpacing) {
      for (let ly = staffTop + 5 * lineSpacing; ly <= clampedY + 2; ly += lineSpacing) {
        svg += `<line x1="${x - 8}" y1="${ly}" x2="${x + 8}" y2="${ly}" stroke="currentColor" stroke-width="0.5" opacity="0.3"/>`;
      }
    }
    if (clampedY < staffTop) {
      for (let ly = staffTop - lineSpacing; ly >= clampedY - 2; ly -= lineSpacing) {
        svg += `<line x1="${x - 8}" y1="${ly}" x2="${x + 8}" y2="${ly}" stroke="currentColor" stroke-width="0.5" opacity="0.3"/>`;
      }
    }
  });

  // Final barline
  const endX = width - 15;
  svg += `<line x1="${endX}" y1="${staffTop}" x2="${endX}" y2="${staffTop + 4 * lineSpacing}" stroke="currentColor" stroke-width="2"/>`;
  svg += `<line x1="${endX - 4}" y1="${staffTop}" x2="${endX - 4}" y2="${staffTop + 4 * lineSpacing}" stroke="currentColor" stroke-width="0.5"/>`;

  svg += "</svg>";
  return svg;
}

// ── Component ─────────────────────────────────────────────────────────────

export const ABCEditor = memo(function ABCEditor({ initialCode }: ABCEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [editing, setEditing] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [rendering, setRendering] = useState(false);
  const [sheetSvg, setSheetSvg] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const meta = parseAbcMeta(code);

  // Render sheet music whenever code changes
  useEffect(() => {
    setSheetSvg(renderAbcToSvg(code));
  }, [code]);

  // Synthesize audio from ABC
  const synthesize = useCallback(async () => {
    setRendering(true);
    try {
      const notes = parseAbcToNotes(code, meta.tempo ?? 120);
      if (notes.length === 0) {
        setRendering(false);
        return;
      }

      const sampleRate = 44100;
      const totalDuration =
        notes.reduce((max, n) => Math.max(max, n.startTime + n.duration), 0) + 0.5;
      const ctx = new OfflineAudioContext(1, Math.ceil(totalDuration * sampleRate), sampleRate);

      for (const note of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.value = note.frequency;

        gain.gain.setValueAtTime(0, note.startTime);
        gain.gain.linearRampToValueAtTime(0.3, note.startTime + 0.02);
        gain.gain.setTargetAtTime(0.15, note.startTime + 0.02, note.duration * 0.2);
        gain.gain.setTargetAtTime(0.001, note.startTime + note.duration * 0.8, 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(note.startTime);
        osc.stop(note.startTime + note.duration + 0.1);
      }

      const buffer = await ctx.startRendering();
      setAudioBuffer(buffer);
    } catch {
      // synthesis failed silently
    }
    setRendering(false);
  }, [code, meta.tempo]);

  // Auto-synthesize on first render
  useEffect(() => {
    void synthesize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="abc-editor">
      {/* Sheet music display */}
      <div className="overflow-x-auto border-b border-border/50 px-3 py-2">
        <div
          className="abc-sheet min-h-[80px]"
          // biome-ignore lint: dangerouslySetInnerHTML for SVG rendering
          dangerouslySetInnerHTML={{ __html: sheetSvg }}
        />
      </div>

      {/* Player */}
      <MusicPlayer
        buffer={audioBuffer ?? undefined}
        format="abc"
        meta={{
          title: meta.title,
          key: meta.key,
          bpm: meta.tempo,
        }}
        expandable
      >
        {/* Expandable ABC text editor */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              ABC Notation
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setEditing((v) => !v);
                  if (!editing) {
                    setTimeout(() => textareaRef.current?.focus(), 50);
                  }
                }}
                className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] ${
                  editing
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Edit3 className="size-3" />
                {editing ? "Done" : "Edit"}
              </button>
              <button
                type="button"
                onClick={synthesize}
                disabled={rendering}
                className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                <RotateCcw className={`size-3 ${rendering ? "animate-spin" : ""}`} />
                Re-render
              </button>
            </div>
          </div>

          {editing ? (
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onBlur={() => void synthesize()}
              className="w-full rounded-lg border border-border bg-muted/50 p-2 font-mono text-xs leading-relaxed text-foreground resize-y min-h-[120px] focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
          ) : (
            <pre className="rounded-lg border border-border bg-muted/50 p-2 font-mono text-xs leading-relaxed text-foreground overflow-x-auto">
              {code}
            </pre>
          )}
        </div>
      </MusicPlayer>
    </div>
  );
});
