/** Shared types for the inline music player/editor system. */

export type MusicFormat = "abc" | "tone" | "midi" | "audio" | "youtube" | "spotify";

export interface TrackMeta {
  title?: string;
  artist?: string;
  album?: string;
  bpm?: number;
  key?: string;
  duration?: number;
  format?: string;
}

export interface WaveformData {
  peaks: Float32Array;
  duration: number;
  sampleRate: number;
}

export interface LoopRegion {
  start: number;
  end: number;
  count: number; // 0 = infinite
}

export interface EffectNode {
  id: string;
  type: EffectType;
  enabled: boolean;
  wetDry: number; // 0–1
  params: Record<string, number>;
}

export type EffectType = "eq" | "reverb" | "delay" | "compressor" | "distortion" | "chorus";

export interface Track {
  id: string;
  name: string;
  source: AudioBuffer | null;
  volume: number; // 0–1
  pan: number; // -1 to 1
  mute: boolean;
  solo: boolean;
  offset: number; // seconds from timeline start
  effects: EffectNode[];
}

export interface PlayerState {
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  speed: number;
  loop: LoopRegion | null;
}

export interface MusicDetectionResult {
  format: MusicFormat;
  content: string;
  meta?: TrackMeta;
}

/** MIDI note on a piano roll */
export interface MidiNote {
  id: string;
  pitch: number; // 0–127
  startTime: number; // beats
  duration: number; // beats
  velocity: number; // 0–127
  channel: number;
}

export interface MidiTrack {
  name: string;
  notes: MidiNote[];
  instrument: number; // GM program number
}

/** ABC notation parse result */
export interface AbcTune {
  title: string;
  meter: string;
  key: string;
  tempo: number;
  body: string;
}
