/**
 * detectMusic — utilities for detecting music-related content in chat messages.
 *
 * Used by ChatMarkdown to decide when to render a MusicPlayer inline.
 */
import type { MusicDetectionResult, MusicFormat } from "./types";

// ── ABC Notation Detection ────────────────────────────────────────────────

const ABC_HEADER_RE = /^X:\s*\d+/m;
const ABC_KEY_RE = /^K:\s*\w/m;

export function isAbcNotation(code: string): boolean {
  return ABC_HEADER_RE.test(code) && ABC_KEY_RE.test(code);
}

export function parseAbcMeta(code: string): {
  title?: string;
  meter?: string;
  key?: string;
  tempo?: number;
} {
  const meta: { title?: string; meter?: string; key?: string; tempo?: number } = {};
  for (const line of code.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("T:")) meta.title = trimmed.slice(2).trim();
    if (trimmed.startsWith("M:")) meta.meter = trimmed.slice(2).trim();
    if (trimmed.startsWith("K:")) meta.key = trimmed.slice(2).trim();
    if (trimmed.startsWith("Q:")) {
      const match = trimmed.match(/(\d+)/);
      if (match) meta.tempo = Number(match[1]);
    }
  }
  return meta;
}

// ── Tone.js / Web Audio Detection ─────────────────────────────────────────

const TONE_PATTERNS = [
  /new\s+Tone\./,
  /Tone\.(?:Synth|Sampler|Player|Transport|Sequence|Loop|Part|Pattern)/,
  /\.toDestination\(\)/,
  /\.triggerAttackRelease\(/,
  /new\s+AudioContext/,
  /createOscillator|createGain|createAnalyser|createBiquadFilter/,
  /\.connect\(\s*(?:ctx|audioCtx|context)\s*\.destination\)/,
];

export function isToneCode(code: string): boolean {
  let matches = 0;
  for (const pattern of TONE_PATTERNS) {
    if (pattern.test(code)) matches++;
    if (matches >= 2) return true;
  }
  return false;
}

// ── MIDI Detection ────────────────────────────────────────────────────────

const MIDI_HEADER = new Uint8Array([0x4d, 0x54, 0x68, 0x64]); // "MThd"

export function isMidiData(data: Uint8Array): boolean {
  if (data.length < 4) return false;
  return (
    data[0] === MIDI_HEADER[0] &&
    data[1] === MIDI_HEADER[1] &&
    data[2] === MIDI_HEADER[2] &&
    data[3] === MIDI_HEADER[3]
  );
}

// ── URL Detection ─────────────────────────────────────────────────────────

const YOUTUBE_RE =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;
const SPOTIFY_RE = /(?:https?:\/\/)?(?:open\.)?spotify\.com\/(track|album|playlist)\/([\w]+)/;
const AUDIO_URL_RE = /https?:\/\/[^\s]+\.(?:mp3|wav|ogg|flac|aac|webm|m4a)(?:\?[^\s]*)?/i;

export function detectYouTubeUrl(text: string): { videoId: string } | null {
  const match = text.match(YOUTUBE_RE);
  return match ? { videoId: match[1] } : null;
}

export function detectSpotifyUrl(text: string): { type: string; id: string } | null {
  const match = text.match(SPOTIFY_RE);
  return match ? { type: match[1], id: match[2] } : null;
}

export function detectAudioUrl(text: string): string | null {
  const match = text.match(AUDIO_URL_RE);
  return match ? match[0] : null;
}

// ── Code Block Language Detection ─────────────────────────────────────────

const MUSIC_LANGUAGES = new Set(["abc", "tone", "tonejs", "webaudio", "midi", "music"]);

export function isMusicLanguage(lang: string): boolean {
  return MUSIC_LANGUAGES.has(lang.toLowerCase());
}

export function detectMusicFormat(lang: string, code: string): MusicFormat | null {
  const lower = lang.toLowerCase();

  if (lower === "abc" || isAbcNotation(code)) return "abc";
  if (lower === "tone" || lower === "tonejs" || lower === "webaudio" || isToneCode(code))
    return "tone";
  if (lower === "midi" || lower === "music") return "midi";

  return null;
}

// ── Full message detection ────────────────────────────────────────────────

/**
 * Detect all music-related content in a chat message text.
 * Returns an array of detected music items (could be multiple per message).
 */
export function detectMusicInMessage(text: string): MusicDetectionResult[] {
  const results: MusicDetectionResult[] = [];

  // Check for YouTube URLs
  const yt = detectYouTubeUrl(text);
  if (yt) {
    results.push({
      format: "youtube",
      content: yt.videoId,
    });
  }

  // Check for Spotify URLs
  const sp = detectSpotifyUrl(text);
  if (sp) {
    results.push({
      format: "spotify",
      content: `${sp.type}/${sp.id}`,
    });
  }

  // Check for direct audio URLs
  const audioUrl = detectAudioUrl(text);
  if (audioUrl) {
    results.push({
      format: "audio",
      content: audioUrl,
    });
  }

  return results;
}
