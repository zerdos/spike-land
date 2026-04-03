/**
 * DAWTimeline — multi-track mixer with effects chain.
 *
 * Provides up to 8 tracks with independent volume/pan/mute/solo,
 * per-track effects, and master bus mixdown.
 */
import { memo, useCallback, useState } from "react";
import {
  Volume2,
  VolumeX,
  Headphones,
  Plus,
  Trash2,
  GripVertical,
  Download,
  Sliders,
} from "lucide-react";
import type { Track, EffectNode, EffectType } from "./types";

interface DAWTimelineProps {
  initialTracks?: Track[];
  onMixdown?: (buffer: AudioBuffer) => void;
}

// ── Effect presets ────────────────────────────────────────────────────────

const EFFECT_TYPES: { type: EffectType; label: string; icon: string }[] = [
  { type: "eq", label: "EQ", icon: "≋" },
  { type: "reverb", label: "Reverb", icon: "◌" },
  { type: "delay", label: "Delay", icon: "⟩⟩" },
  { type: "compressor", label: "Compress", icon: "⊏" },
  { type: "distortion", label: "Distort", icon: "⚡" },
  { type: "chorus", label: "Chorus", icon: "≈" },
];

const PRESETS: Record<string, { name: string; effects: EffectNode[] }> = {
  lofi: {
    name: "Lo-Fi",
    effects: [
      { id: "eq1", type: "eq", enabled: true, wetDry: 1, params: { low: -3, mid: 2, high: -6 } },
      { id: "dist1", type: "distortion", enabled: true, wetDry: 0.2, params: { amount: 0.3 } },
      { id: "rev1", type: "reverb", enabled: true, wetDry: 0.3, params: { decay: 1.5 } },
    ],
  },
  concertHall: {
    name: "Concert Hall",
    effects: [
      { id: "eq2", type: "eq", enabled: true, wetDry: 1, params: { low: 1, mid: 0, high: -2 } },
      { id: "rev2", type: "reverb", enabled: true, wetDry: 0.6, params: { decay: 4 } },
    ],
  },
  radio: {
    name: "Radio Voice",
    effects: [
      { id: "eq3", type: "eq", enabled: true, wetDry: 1, params: { low: -8, mid: 4, high: -4 } },
      {
        id: "comp1",
        type: "compressor",
        enabled: true,
        wetDry: 1,
        params: { threshold: -20, ratio: 4 },
      },
    ],
  },
  telephone: {
    name: "Telephone",
    effects: [
      { id: "eq4", type: "eq", enabled: true, wetDry: 1, params: { low: -12, mid: 6, high: -10 } },
      { id: "dist2", type: "distortion", enabled: true, wetDry: 0.15, params: { amount: 0.1 } },
    ],
  },
  underwater: {
    name: "Underwater",
    effects: [
      { id: "eq5", type: "eq", enabled: true, wetDry: 1, params: { low: 4, mid: -2, high: -12 } },
      { id: "rev3", type: "reverb", enabled: true, wetDry: 0.8, params: { decay: 6 } },
      { id: "cho1", type: "chorus", enabled: true, wetDry: 0.5, params: { rate: 0.3, depth: 0.7 } },
    ],
  },
};

function createEmptyTrack(index: number): Track {
  return {
    id: `track-${Date.now()}-${index}`,
    name: `Track ${index + 1}`,
    source: null,
    volume: 0.8,
    pan: 0,
    mute: false,
    solo: false,
    offset: 0,
    effects: [],
  };
}

function generateEffectId(): string {
  return `fx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── Track row component ───────────────────────────────────────────────────

const TrackRow = memo(function TrackRow({
  track,
  hasSolo,
  onUpdate,
  onRemove,
}: {
  track: Track;
  hasSolo: boolean;
  onUpdate: (id: string, updates: Partial<Track>) => void;
  onRemove: (id: string) => void;
}) {
  const [showEffects, setShowEffects] = useState(false);
  const isActive = !track.mute && (!hasSolo || track.solo);

  return (
    <div className={`border-b border-border/50 transition-opacity ${isActive ? "" : "opacity-50"}`}>
      <div className="flex items-center gap-2 px-2 py-1.5">
        {/* Drag handle */}
        <GripVertical className="size-3 text-muted-foreground/40 cursor-grab" />

        {/* Track name */}
        <input
          type="text"
          value={track.name}
          onChange={(e) => onUpdate(track.id, { name: e.target.value })}
          className="w-20 bg-transparent text-[10px] font-semibold text-foreground truncate focus:outline-none focus:underline"
        />

        {/* Mute */}
        <button
          type="button"
          onClick={() => onUpdate(track.id, { mute: !track.mute })}
          className={`flex size-5 items-center justify-center rounded text-[9px] font-bold ${
            track.mute
              ? "bg-destructive/20 text-destructive"
              : "text-muted-foreground hover:bg-muted"
          }`}
          title="Mute"
        >
          M
        </button>

        {/* Solo */}
        <button
          type="button"
          onClick={() => onUpdate(track.id, { solo: !track.solo })}
          className={`flex size-5 items-center justify-center rounded text-[9px] font-bold ${
            track.solo ? "bg-amber-500/20 text-amber-600" : "text-muted-foreground hover:bg-muted"
          }`}
          title="Solo"
        >
          S
        </button>

        {/* Volume */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <Volume2 className="size-3 text-muted-foreground shrink-0" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={track.volume}
            onChange={(e) => onUpdate(track.id, { volume: Number(e.target.value) })}
            className="h-1 flex-1 accent-primary cursor-pointer"
          />
          <span className="text-[9px] font-mono text-muted-foreground w-6 text-right tabular-nums">
            {Math.round(track.volume * 100)}
          </span>
        </div>

        {/* Pan */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground">L</span>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={track.pan}
            onChange={(e) => onUpdate(track.id, { pan: Number(e.target.value) })}
            className="h-1 w-12 accent-primary cursor-pointer"
          />
          <span className="text-[9px] text-muted-foreground">R</span>
        </div>

        {/* Effects toggle */}
        <button
          type="button"
          onClick={() => setShowEffects((v) => !v)}
          className={`flex size-5 items-center justify-center rounded ${
            track.effects.length > 0
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted"
          }`}
          title="Effects"
        >
          <Sliders className="size-3" />
        </button>

        {/* Remove */}
        <button
          type="button"
          onClick={() => onRemove(track.id)}
          className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Remove track"
        >
          <Trash2 className="size-3" />
        </button>
      </div>

      {/* Effects chain */}
      {showEffects && (
        <div className="border-t border-border/30 bg-muted/20 px-3 py-2">
          <div className="flex flex-wrap gap-1 mb-2">
            {EFFECT_TYPES.map((et) => (
              <button
                key={et.type}
                type="button"
                onClick={() => {
                  const newEffect: EffectNode = {
                    id: generateEffectId(),
                    type: et.type,
                    enabled: true,
                    wetDry: 0.5,
                    params: {},
                  };
                  onUpdate(track.id, { effects: [...track.effects, newEffect] });
                }}
                className="rounded border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {et.icon} {et.label}
              </button>
            ))}
          </div>

          {track.effects.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {track.effects.map((fx, idx) => (
                <div
                  key={fx.id}
                  className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[9px] ${
                    fx.enabled
                      ? "border-primary/30 bg-primary/5 text-primary"
                      : "border-border bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...track.effects];
                      updated[idx] = { ...fx, enabled: !fx.enabled };
                      onUpdate(track.id, { effects: updated });
                    }}
                    className="font-bold"
                  >
                    {fx.enabled ? "●" : "○"}
                  </button>
                  <span className="font-semibold uppercase">{fx.type}</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={fx.wetDry}
                    onChange={(e) => {
                      const updated = [...track.effects];
                      updated[idx] = { ...fx, wetDry: Number(e.target.value) };
                      onUpdate(track.id, { effects: updated });
                    }}
                    className="h-1 w-10 accent-primary"
                    title="Wet/Dry"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onUpdate(track.id, {
                        effects: track.effects.filter((_, i) => i !== idx),
                      });
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Presets */}
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="text-[9px] text-muted-foreground self-center mr-1">Presets:</span>
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  onUpdate(track.id, {
                    effects: preset.effects.map((e) => ({ ...e, id: generateEffectId() })),
                  })
                }
                className="rounded border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// ── Main component ────────────────────────────────────────────────────────

export const DAWTimeline = memo(function DAWTimeline({
  initialTracks,
  onMixdown,
}: DAWTimelineProps) {
  const [tracks, setTracks] = useState<Track[]>(
    initialTracks ?? [createEmptyTrack(0), createEmptyTrack(1)],
  );
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [masterMute, setMasterMute] = useState(false);

  const hasSolo = tracks.some((t) => t.solo);

  const updateTrack = useCallback((id: string, updates: Partial<Track>) => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const removeTrack = useCallback((id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addTrack = useCallback(() => {
    if (tracks.length >= 8) return;
    setTracks((prev) => [...prev, createEmptyTrack(prev.length)]);
  }, [tracks.length]);

  const handleMixdown = useCallback(async () => {
    // In production, this would render all tracks through their effects chains
    // into a single stereo AudioBuffer using OfflineAudioContext
    // For now, signal the parent
    onMixdown?.(new AudioBuffer({ length: 1, sampleRate: 44100 }));
  }, [onMixdown]);

  return (
    <div className="daw-timeline my-2 overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/50 px-3 py-1.5">
        <Headphones className="size-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">Multi-Track Mixer</span>
        <span className="text-[10px] text-muted-foreground">{tracks.length}/8 tracks</span>
        <div className="flex-1" />

        {/* Add track */}
        <button
          type="button"
          onClick={addTrack}
          disabled={tracks.length >= 8}
          className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <Plus className="size-3" />
          Add Track
        </button>

        {/* Mixdown */}
        <button
          type="button"
          onClick={handleMixdown}
          disabled={tracks.length === 0}
          className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] text-primary hover:bg-primary/10 disabled:opacity-40"
        >
          <Download className="size-3" />
          Mixdown
        </button>
      </div>

      {/* Track list */}
      <div className="max-h-[400px] overflow-y-auto">
        {tracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            hasSolo={hasSolo}
            onUpdate={updateTrack}
            onRemove={removeTrack}
          />
        ))}

        {tracks.length === 0 && (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
            No tracks — click "Add Track" to begin
          </div>
        )}
      </div>

      {/* Master bus */}
      <div className="flex items-center gap-2 border-t border-border bg-muted/30 px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
          Master
        </span>

        <button
          type="button"
          onClick={() => setMasterMute((v) => !v)}
          className={`flex size-5 items-center justify-center rounded ${
            masterMute ? "text-destructive" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {masterMute ? <VolumeX className="size-3" /> : <Volume2 className="size-3" />}
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={masterVolume}
          onChange={(e) => setMasterVolume(Number(e.target.value))}
          className="h-1.5 flex-1 accent-primary cursor-pointer"
        />
        <span className="text-[10px] font-mono text-muted-foreground w-8 text-right tabular-nums">
          {Math.round(masterVolume * 100)}%
        </span>
      </div>
    </div>
  );
});
