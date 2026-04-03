/**
 * useAudioAnalysis — hook that runs audio analysis in a Web Worker.
 *
 * Provides BPM, key detection, beat positions, mood tags, and
 * spectral analysis for any AudioBuffer.
 */
import { useCallback, useRef, useState } from "react";

export interface AudioAnalysisResult {
  bpm: number;
  key: string;
  keyConfidence: number;
  beats: number[];
  mood: string[];
  energy: number;
  spectralCentroid: number;
}

export function useAudioAnalysis() {
  const workerRef = useRef<Worker | null>(null);
  const [result, setResult] = useState<AudioAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback((buffer: AudioBuffer) => {
    setAnalyzing(true);
    setError(null);

    try {
      // Terminate any previous worker
      workerRef.current?.terminate();

      const worker = new Worker(new URL("./audioAnalysis.worker.ts", import.meta.url), {
        type: "module",
      });
      workerRef.current = worker;

      worker.onmessage = (event: MessageEvent<AudioAnalysisResult & { type: string }>) => {
        if (event.data.type === "result") {
          setResult({
            bpm: event.data.bpm,
            key: event.data.key,
            keyConfidence: event.data.keyConfidence,
            beats: event.data.beats,
            mood: event.data.mood,
            energy: event.data.energy,
            spectralCentroid: event.data.spectralCentroid,
          });
          setAnalyzing(false);
        }
      };

      worker.onerror = (e) => {
        setError(e.message || "Analysis failed");
        setAnalyzing(false);
      };

      // Send channel data to worker (transfer the buffer for performance)
      const channelData = buffer.getChannelData(0);
      const copy = new Float32Array(channelData);
      worker.postMessage(
        {
          type: "analyze",
          channelData: copy,
          sampleRate: buffer.sampleRate,
        },
        [copy.buffer],
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start analysis");
      setAnalyzing(false);
    }
  }, []);

  const dispose = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  return { result, analyzing, error, analyze, dispose };
}
