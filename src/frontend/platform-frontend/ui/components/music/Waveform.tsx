/**
 * Waveform — canvas-based waveform visualization with seek support.
 * Renders real-time waveform data from an AnalyserNode at 60fps,
 * or a static overview waveform from an AudioBuffer.
 */
import { memo, useCallback, useEffect, useRef, useState } from "react";

interface WaveformProps {
  /** Get live time-domain data (Float32Array) — called every frame while playing */
  getWaveformData: () => Float32Array;
  /** Current playback position 0–1 */
  progress: number;
  /** Whether audio is currently playing */
  playing: boolean;
  /** Called with normalized 0–1 position when user clicks/drags */
  onSeek: (position: number) => void;
  /** Loop region start/end as 0–1 fractions, or null */
  loopRegion?: { start: number; end: number } | null;
  /** Optional CSS class */
  className?: string;
  /** Static peaks for overview (if available) */
  staticPeaks?: Float32Array | null;
}

export const Waveform = memo(function Waveform({
  getWaveformData,
  progress,
  playing,
  onSeek,
  loopRegion,
  className = "",
  staticPeaks,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const draggingRef = useRef(false);
  const [hovering, setHovering] = useState(false);
  const [hoverX, setHoverX] = useState(0);

  // Draw waveform
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const midY = h / 2;

    // Background
    ctx.clearRect(0, 0, w, h);

    // Loop region highlight
    if (loopRegion) {
      ctx.fillStyle = "rgba(var(--color-primary-rgb, 99, 102, 241), 0.08)";
      const lx = loopRegion.start * w;
      const lw = (loopRegion.end - loopRegion.start) * w;
      ctx.fillRect(lx, 0, lw, h);

      // Loop boundary lines
      ctx.strokeStyle = "rgba(var(--color-primary-rgb, 99, 102, 241), 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, h);
      ctx.moveTo(lx + lw, 0);
      ctx.lineTo(lx + lw, h);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Waveform
    const data = staticPeaks ?? getWaveformData();
    if (data.length > 0) {
      const playedX = progress * w;

      // Played portion (primary color)
      ctx.beginPath();
      ctx.strokeStyle = "hsl(var(--primary, 221.2 83.2% 53.3%))";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < w; i++) {
        const dataIdx = Math.floor((i / w) * data.length);
        const v = data[dataIdx] ?? 0;
        const y = midY + v * midY * 0.9;
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.stroke();

      // Dim the unplayed portion by drawing a semi-transparent overlay
      if (playedX < w) {
        ctx.fillStyle = "rgba(var(--color-background-rgb, 255, 255, 255), 0.5)";
        ctx.fillRect(playedX, 0, w - playedX, h);
      }
    } else {
      // No data — draw center line
      ctx.strokeStyle = "hsl(var(--muted-foreground, 215.4 16.3% 46.9%) / 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();
    }

    // Playhead
    const px = progress * w;
    ctx.strokeStyle = "hsl(var(--primary, 221.2 83.2% 53.3%))";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, h);
    ctx.stroke();

    // Playhead dot
    ctx.fillStyle = "hsl(var(--primary, 221.2 83.2% 53.3%))";
    ctx.beginPath();
    ctx.arc(px, midY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Hover indicator
    if (hovering) {
      ctx.strokeStyle = "hsl(var(--muted-foreground, 215.4 16.3% 46.9%) / 0.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, h);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (playing) {
      rafRef.current = requestAnimationFrame(draw);
    }
  }, [getWaveformData, progress, playing, loopRegion, hovering, hoverX, staticPeaks]);

  // Start/stop animation loop
  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // Redraw on progress change even when paused
  useEffect(() => {
    if (!playing) {
      rafRef.current = requestAnimationFrame(draw);
    }
  }, [progress, playing, draw]);

  // Seek handlers
  const getPosition = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      draggingRef.current = true;
      onSeek(getPosition(e));
    },
    [onSeek, getPosition],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoverX(e.clientX - rect.left);
      if (draggingRef.current) {
        onSeek(getPosition(e));
      }
    },
    [onSeek, getPosition],
  );

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full cursor-pointer rounded-lg ${className}`}
      style={{ height: 64 }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        draggingRef.current = false;
        setHovering(false);
      }}
      onMouseEnter={() => setHovering(true)}
      role="slider"
      aria-label="Audio waveform — click or drag to seek"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      tabIndex={0}
    />
  );
});
