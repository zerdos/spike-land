/**
 * Spectrogram — frequency-domain visualization using FFT data.
 * Toggle between waveform and spectrogram modes on the player.
 */
import { memo, useCallback, useEffect, useRef } from "react";

interface SpectrogramProps {
  getFrequencyData: () => Uint8Array;
  playing: boolean;
  className?: string;
}

// Magma-inspired color palette
function frequencyToColor(value: number): string {
  const t = value / 255;
  if (t < 0.25) {
    const s = t / 0.25;
    return `rgb(${Math.round(s * 80)}, ${Math.round(s * 18)}, ${Math.round(80 + s * 80)})`;
  }
  if (t < 0.5) {
    const s = (t - 0.25) / 0.25;
    return `rgb(${Math.round(80 + s * 140)}, ${Math.round(18 + s * 30)}, ${Math.round(160 - s * 40)})`;
  }
  if (t < 0.75) {
    const s = (t - 0.5) / 0.25;
    return `rgb(${Math.round(220 + s * 35)}, ${Math.round(48 + s * 120)}, ${Math.round(120 - s * 80)})`;
  }
  const s = (t - 0.75) / 0.25;
  return `rgb(${255}, ${Math.round(168 + s * 87)}, ${Math.round(40 + s * 100)})`;
}

export const Spectrogram = memo(function Spectrogram({
  getFrequencyData,
  playing,
  className = "",
}: SpectrogramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const columnRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Only set dimensions once to preserve drawn columns
    if (canvas.width !== rect.width * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      columnRef.current = 0;
    }

    const w = rect.width;
    const h = rect.height;
    const data = getFrequencyData();

    if (data.length === 0) {
      if (playing) rafRef.current = requestAnimationFrame(draw);
      return;
    }

    // Draw one column of spectrogram
    const x = columnRef.current % w;
    const binHeight = h / data.length;

    for (let i = 0; i < data.length; i++) {
      ctx.fillStyle = frequencyToColor(data[i]);
      // Flip vertically — low frequencies at bottom
      const y = h - (i + 1) * binHeight;
      ctx.fillRect(x, y, 2, binHeight + 1);
    }

    // Playhead
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillRect(x + 2, 0, 1, h);

    columnRef.current++;

    if (playing) {
      rafRef.current = requestAnimationFrame(draw);
    }
  }, [getFrequencyData, playing]);

  useEffect(() => {
    if (playing) {
      rafRef.current = requestAnimationFrame(draw);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, draw]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full rounded-lg bg-black ${className}`}
      style={{ height: 64 }}
      role="img"
      aria-label="Audio spectrogram"
    />
  );
});
