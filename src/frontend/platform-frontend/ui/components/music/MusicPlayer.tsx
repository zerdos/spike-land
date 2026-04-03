/**
 * MusicPlayer — core inline music player component for chat messages.
 *
 * Renders a compact waveform player with play/pause, seek, volume, speed
 * controls, and keyboard shortcuts. Designed to render inline inside chat
 * message bubbles like an interactive code block.
 */
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Repeat, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useAudioEngine } from "./useAudioEngine";
import { Waveform } from "./Waveform";
import type { MusicFormat, TrackMeta } from "./types";

interface MusicPlayerProps {
  /** Audio source — URL, data URI, or blob URL */
  src?: string;
  /** Audio buffer (if already decoded) */
  buffer?: AudioBuffer;
  /** Format hint */
  format?: MusicFormat;
  /** Track metadata */
  meta?: TrackMeta;
  /** Whether to show the expanded DAW view toggle */
  expandable?: boolean;
  /** Child content to render below the player (e.g., editor panel) */
  children?: React.ReactNode;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const MusicPlayer = memo(function MusicPlayer({
  src,
  buffer,
  format,
  meta,
  expandable = false,
  children,
}: MusicPlayerProps) {
  const engine = useAudioEngine();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showVolume, setShowVolume] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load audio on mount or when src/buffer changes
  useEffect(() => {
    if (buffer) {
      engine.loadBuffer(buffer);
      setLoaded(true);
      return;
    }
    if (src && !loaded && !loading) {
      setLoading(true);
      setError(null);
      engine
        .loadUrl(src)
        .then(() => {
          setLoaded(true);
          setLoading(false);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Failed to load audio");
          setLoading(false);
        });
    }
  }, [src, buffer, engine, loaded, loading]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Only handle if this player is focused or contains the active element
      if (
        !containerRef.current?.contains(document.activeElement) &&
        document.activeElement !== containerRef.current
      ) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          engine.togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          engine.seek(Math.max(0, engine.state.currentTime - 5));
          break;
        case "ArrowRight":
          e.preventDefault();
          engine.seek(Math.min(engine.state.duration, engine.state.currentTime + 5));
          break;
        case "m":
          e.preventDefault();
          engine.toggleMute();
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [engine]);

  const handleSeek = useCallback(
    (position: number) => {
      engine.seek(position * engine.state.duration);
    },
    [engine],
  );

  const progress = engine.state.duration > 0 ? engine.state.currentTime / engine.state.duration : 0;

  return (
    <div
      ref={containerRef}
      className="music-player my-2 overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-sm"
      tabIndex={0}
      role="region"
      aria-label={`Music player${meta?.title ? `: ${meta.title}` : ""}`}
    >
      {/* Header with metadata */}
      {meta && (meta.title || meta.artist) && (
        <div className="flex items-center gap-2 border-b border-border/50 px-3 py-1.5">
          <div className="min-w-0 flex-1">
            {meta.title && (
              <p className="truncate text-xs font-semibold text-foreground">{meta.title}</p>
            )}
            {meta.artist && (
              <p className="truncate text-[10px] text-muted-foreground">{meta.artist}</p>
            )}
          </div>
          {format && (
            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
              {format}
            </span>
          )}
          {meta.bpm && (
            <span className="shrink-0 text-[10px] font-mono text-muted-foreground">
              {meta.bpm} BPM
            </span>
          )}
          {meta.key && (
            <span className="shrink-0 text-[10px] font-mono text-muted-foreground">{meta.key}</span>
          )}
        </div>
      )}

      {/* Waveform */}
      <div className="px-3 pt-2">
        {loading ? (
          <div className="flex h-16 items-center justify-center">
            <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="ml-2 text-xs text-muted-foreground">Loading audio...</span>
          </div>
        ) : error ? (
          <div className="flex h-16 items-center justify-center text-xs text-destructive">
            {error}
          </div>
        ) : (
          <Waveform
            getWaveformData={engine.getWaveformData}
            progress={progress}
            playing={engine.state.playing}
            onSeek={handleSeek}
            loopRegion={
              engine.state.loop
                ? {
                    start: engine.state.loop.start / engine.state.duration,
                    end: engine.state.loop.end / engine.state.duration,
                  }
                : null
            }
          />
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 px-3 py-2">
        {/* Play/Pause */}
        <button
          type="button"
          onClick={engine.togglePlay}
          disabled={!loaded}
          className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
          aria-label={engine.state.playing ? "Pause" : "Play"}
        >
          {engine.state.playing ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
        </button>

        {/* Skip -5s */}
        <button
          type="button"
          onClick={() => engine.seek(Math.max(0, engine.state.currentTime - 5))}
          disabled={!loaded}
          className="flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-40"
          aria-label="Skip back 5 seconds"
        >
          <SkipBack className="size-3.5" />
        </button>

        {/* Skip +5s */}
        <button
          type="button"
          onClick={() => engine.seek(Math.min(engine.state.duration, engine.state.currentTime + 5))}
          disabled={!loaded}
          className="flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-40"
          aria-label="Skip forward 5 seconds"
        >
          <SkipForward className="size-3.5" />
        </button>

        {/* Time display */}
        <span className="mx-1 min-w-[72px] text-center font-mono text-[10px] text-muted-foreground tabular-nums">
          {formatTime(engine.state.currentTime)} / {formatTime(engine.state.duration)}
        </span>

        <div className="flex-1" />

        {/* Loop toggle */}
        <button
          type="button"
          onClick={() => {
            if (engine.state.loop) {
              engine.setLoop(null);
            } else {
              engine.setLoop({ start: 0, end: engine.state.duration, count: 0 });
            }
          }}
          disabled={!loaded}
          className={`flex size-6 items-center justify-center rounded-lg transition ${
            engine.state.loop
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground"
          } disabled:opacity-40`}
          aria-label={engine.state.loop ? "Disable loop" : "Enable loop"}
        >
          <Repeat className="size-3.5" />
        </button>

        {/* Speed selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSpeed((v) => !v)}
            disabled={!loaded}
            className="flex h-6 items-center justify-center rounded-lg px-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground disabled:opacity-40"
            aria-label={`Playback speed: ${engine.state.speed}x`}
          >
            {engine.state.speed}x
          </button>
          {showSpeed && (
            <div className="absolute bottom-full right-0 mb-1 rounded-lg border border-border bg-card p-1 shadow-lg z-10">
              {SPEED_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    engine.setSpeed(s);
                    setShowSpeed(false);
                  }}
                  className={`block w-full rounded px-2 py-0.5 text-left text-[10px] ${
                    engine.state.speed === s
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Volume */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={engine.toggleMute}
            onMouseEnter={() => setShowVolume(true)}
            disabled={!loaded}
            className="flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-40"
            aria-label={engine.state.muted ? "Unmute" : "Mute"}
          >
            {engine.state.muted || engine.state.volume === 0 ? (
              <VolumeX className="size-3.5" />
            ) : (
              <Volume2 className="size-3.5" />
            )}
          </button>
          {showVolume && (
            <div
              className="absolute bottom-full right-0 mb-1 flex h-24 w-8 flex-col items-center rounded-lg border border-border bg-card py-2 shadow-lg z-10"
              onMouseLeave={() => setShowVolume(false)}
            >
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={engine.state.volume}
                onChange={(e) => engine.setVolume(Number(e.target.value))}
                className="h-16 w-2 cursor-pointer accent-primary"
                style={{
                  writingMode: "vertical-lr",
                  direction: "rtl",
                }}
                aria-label="Volume"
              />
            </div>
          )}
        </div>

        {/* Expand to DAW toggle */}
        {expandable && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
            aria-label={expanded ? "Collapse editor" : "Expand editor"}
          >
            <svg
              className="size-3.5"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              {expanded ? <path d="M4 10L8 6L12 10" /> : <path d="M4 6L8 10L12 6" />}
            </svg>
          </button>
        )}
      </div>

      {/* Expandable content (editor panels, DAW timeline, etc.) */}
      {expanded && children && <div className="border-t border-border">{children}</div>}
    </div>
  );
});
