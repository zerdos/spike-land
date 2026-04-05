/**
 * useAudioEngine — core Web Audio API hook powering all music playback.
 *
 * Manages AudioContext lifecycle, source nodes, gain/panning, analyser for
 * waveform data, and global singleton enforcement (only one player at a time).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { LoopRegion, PlayerState } from "./types";

// Global singleton — only one player active at a time
let activeEngineId: string | null = null;
const stopCallbacks = new Map<string, () => void>();

function generateId(): string {
  return `engine-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface AudioEngine {
  state: PlayerState;
  analyserNode: AnalyserNode | null;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setSpeed: (s: number) => void;
  setLoop: (loop: LoopRegion | null) => void;
  loadBuffer: (buffer: AudioBuffer) => void;
  loadUrl: (url: string) => Promise<void>;
  getWaveformData: () => Float32Array;
  getFrequencyData: () => Uint8Array;
  dispose: () => void;
}

export function useAudioEngine(): AudioEngine {
  const idRef = useRef(generateId());
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const startOffsetRef = useRef(0);
  const startTimeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const loopRef = useRef<LoopRegion | null>(null);
  const preMuteVolumeRef = useRef(1);

  const [state, setState] = useState<PlayerState>({
    playing: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    speed: 1,
    loop: null,
  });

  // Ensure AudioContext exists
  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
      gainRef.current = ctxRef.current.createGain();
      analyserRef.current = ctxRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      gainRef.current.connect(analyserRef.current);
      analyserRef.current.connect(ctxRef.current.destination);
    }
    return ctxRef.current;
  }, []);

  // Animation frame loop for currentTime updates
  const tick = useCallback(() => {
    if (!ctxRef.current || !bufferRef.current) return;
    const elapsed = ctxRef.current.currentTime - startTimeRef.current;
    const current = startOffsetRef.current + elapsed * state.speed;
    const duration = bufferRef.current.duration;

    // Loop handling
    const loop = loopRef.current;
    if (loop && current >= loop.end) {
      if (loop.count === 0 || loop.count > 1) {
        seek(loop.start);
        if (loop.count > 1) {
          loopRef.current = { ...loop, count: loop.count - 1 };
        }
        return;
      }
    }

    if (current >= duration) {
      setState((s) => ({ ...s, playing: false, currentTime: duration }));
      sourceRef.current?.stop();
      sourceRef.current = null;
      return;
    }

    setState((s) => ({ ...s, currentTime: Math.min(current, duration) }));
    rafRef.current = requestAnimationFrame(tick);
  }, [state.speed]);

  // Stop the current source without changing state
  const stopSource = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    try {
      sourceRef.current?.stop();
    } catch {
      // already stopped
    }
    sourceRef.current = null;
  }, []);

  // Start playback from startOffsetRef
  const startPlayback = useCallback(() => {
    const ctx = getCtx();
    const buffer = bufferRef.current;
    if (!buffer || !gainRef.current) return;

    stopSource();

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = state.speed;
    source.connect(gainRef.current);

    const loop = loopRef.current;
    if (loop) {
      source.loopStart = loop.start;
      source.loopEnd = loop.end;
      source.loop = loop.count === 0; // infinite loop via native API
    }

    source.start(0, startOffsetRef.current);
    sourceRef.current = source;
    startTimeRef.current = ctx.currentTime;
    rafRef.current = requestAnimationFrame(tick);

    // Register as active engine
    if (activeEngineId && activeEngineId !== idRef.current) {
      const stopOther = stopCallbacks.get(activeEngineId);
      stopOther?.();
    }
    activeEngineId = idRef.current;
  }, [getCtx, stopSource, tick, state.speed]);

  const play = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    startPlayback();
    setState((s) => ({ ...s, playing: true }));
  }, [getCtx, startPlayback]);

  const pause = useCallback(() => {
    if (!ctxRef.current) return;
    const elapsed = ctxRef.current.currentTime - startTimeRef.current;
    startOffsetRef.current += elapsed * state.speed;
    stopSource();
    setState((s) => ({ ...s, playing: false }));
  }, [stopSource, state.speed]);

  const togglePlay = useCallback(() => {
    if (state.playing) {
      pause();
    } else {
      play();
    }
  }, [state.playing, play, pause]);

  const seek = useCallback(
    (time: number) => {
      startOffsetRef.current = Math.max(0, Math.min(time, bufferRef.current?.duration ?? 0));
      setState((s) => ({ ...s, currentTime: startOffsetRef.current }));
      if (state.playing) {
        startPlayback();
      }
    },
    [state.playing, startPlayback],
  );

  const setVolume = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      if (gainRef.current) {
        gainRef.current.gain.value = state.muted ? 0 : clamped;
      }
      setState((s) => ({ ...s, volume: clamped }));
    },
    [state.muted],
  );

  const toggleMute = useCallback(() => {
    setState((s) => {
      const newMuted = !s.muted;
      if (gainRef.current) {
        if (newMuted) {
          preMuteVolumeRef.current = s.volume;
          gainRef.current.gain.value = 0;
        } else {
          gainRef.current.gain.value = preMuteVolumeRef.current;
        }
      }
      return { ...s, muted: newMuted };
    });
  }, []);

  const setSpeed = useCallback((s: number) => {
    const clamped = Math.max(0.1, Math.min(4, s));
    if (sourceRef.current) {
      sourceRef.current.playbackRate.value = clamped;
    }
    setState((prev) => ({ ...prev, speed: clamped }));
  }, []);

  const setLoop = useCallback((loop: LoopRegion | null) => {
    loopRef.current = loop;
    setState((s) => ({ ...s, loop }));
  }, []);

  const loadBuffer = useCallback(
    (buffer: AudioBuffer) => {
      getCtx(); // ensure ctx
      bufferRef.current = buffer;
      startOffsetRef.current = 0;
      setState((s) => ({ ...s, duration: buffer.duration, currentTime: 0, playing: false }));
    },
    [getCtx],
  );

  const loadUrl = useCallback(
    async (url: string) => {
      const ctx = getCtx();
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      loadBuffer(audioBuffer);
    },
    [getCtx, loadBuffer],
  );

  const getWaveformData = useCallback((): Float32Array => {
    if (!analyserRef.current) return new Float32Array(0);
    const data = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(data);
    return data;
  }, []);

  const getFrequencyData = useCallback((): Uint8Array => {
    if (!analyserRef.current) return new Uint8Array(0);
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    return data;
  }, []);

  const dispose = useCallback(() => {
    stopSource();
    if (activeEngineId === idRef.current) {
      activeEngineId = null;
    }
    stopCallbacks.delete(idRef.current);
    void ctxRef.current?.close();
    ctxRef.current = null;
  }, [stopSource]);

  // Register stop callback for singleton enforcement
  useEffect(() => {
    stopCallbacks.set(idRef.current, () => {
      pause();
    });
    return () => {
      stopCallbacks.delete(idRef.current);
      dispose();
    };
  }, [pause, dispose]);

  return {
    state,
    analyserNode: analyserRef.current,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    setSpeed,
    setLoop,
    loadBuffer,
    loadUrl,
    getWaveformData,
    getFrequencyData,
    dispose,
  };
}
