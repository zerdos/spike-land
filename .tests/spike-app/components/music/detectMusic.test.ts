import { describe, it, expect } from "vitest";
import {
  isAbcNotation,
  isToneCode,
  detectYouTubeUrl,
  detectSpotifyUrl,
  detectAudioUrl,
  detectMusicFormat,
  isMusicLanguage,
  detectMusicInMessage,
  parseAbcMeta,
} from "@/ui/components/music/detectMusic";

describe("isAbcNotation", () => {
  it("detects valid ABC notation", () => {
    const abc = `X:1
T:Twinkle Twinkle
M:4/4
K:C
CCGG|AAG2|`;
    expect(isAbcNotation(abc)).toBe(true);
  });

  it("rejects non-ABC code", () => {
    expect(isAbcNotation("const x = 1;")).toBe(false);
    expect(isAbcNotation("function foo() {}")).toBe(false);
  });

  it("requires both X: and K: headers", () => {
    expect(isAbcNotation("X:1\nT:Test")).toBe(false);
    expect(isAbcNotation("K:C\nCDEF")).toBe(false);
  });
});

describe("parseAbcMeta", () => {
  it("extracts title, meter, key, and tempo", () => {
    const abc = `X:1
T:My Song
M:3/4
Q:120
K:G`;
    const meta = parseAbcMeta(abc);
    expect(meta.title).toBe("My Song");
    expect(meta.meter).toBe("3/4");
    expect(meta.key).toBe("G");
    expect(meta.tempo).toBe(120);
  });

  it("handles missing fields", () => {
    const meta = parseAbcMeta("X:1\nK:C");
    expect(meta.title).toBeUndefined();
    expect(meta.meter).toBeUndefined();
    expect(meta.key).toBe("C");
  });
});

describe("isToneCode", () => {
  it("detects Tone.js code", () => {
    const code = `
const synth = new Tone.Synth().toDestination();
synth.triggerAttackRelease("C4", "8n");
`;
    expect(isToneCode(code)).toBe(true);
  });

  it("detects Web Audio API code", () => {
    const code = `
const ctx = new AudioContext();
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.connect(gain);
gain.connect(ctx.destination);
`;
    expect(isToneCode(code)).toBe(true);
  });

  it("rejects regular JavaScript", () => {
    expect(isToneCode("const x = 1; console.log(x);")).toBe(false);
    expect(isToneCode("function hello() { return 'world'; }")).toBe(false);
  });
});

describe("detectYouTubeUrl", () => {
  it("detects standard YouTube URLs", () => {
    const result = detectYouTubeUrl("Check this: https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(result).toEqual({ videoId: "dQw4w9WgXcQ" });
  });

  it("detects short YouTube URLs", () => {
    const result = detectYouTubeUrl("https://youtu.be/dQw4w9WgXcQ");
    expect(result).toEqual({ videoId: "dQw4w9WgXcQ" });
  });

  it("detects embed URLs", () => {
    const result = detectYouTubeUrl("https://www.youtube.com/embed/dQw4w9WgXcQ");
    expect(result).toEqual({ videoId: "dQw4w9WgXcQ" });
  });

  it("detects shorts URLs", () => {
    const result = detectYouTubeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ");
    expect(result).toEqual({ videoId: "dQw4w9WgXcQ" });
  });

  it("returns null for non-YouTube URLs", () => {
    expect(detectYouTubeUrl("https://example.com")).toBeNull();
    expect(detectYouTubeUrl("hello world")).toBeNull();
  });
});

describe("detectSpotifyUrl", () => {
  it("detects Spotify track URLs", () => {
    const result = detectSpotifyUrl("https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC");
    expect(result).toEqual({ type: "track", id: "4uLU6hMCjMI75M1A2tKUQC" });
  });

  it("detects Spotify album URLs", () => {
    const result = detectSpotifyUrl("https://open.spotify.com/album/4uLU6hMCjMI75M1A2tKUQC");
    expect(result).toEqual({ type: "album", id: "4uLU6hMCjMI75M1A2tKUQC" });
  });

  it("detects Spotify playlist URLs", () => {
    const result = detectSpotifyUrl("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M");
    expect(result).toEqual({ type: "playlist", id: "37i9dQZF1DXcBWIGoYBM5M" });
  });

  it("returns null for non-Spotify URLs", () => {
    expect(detectSpotifyUrl("https://example.com")).toBeNull();
  });
});

describe("detectAudioUrl", () => {
  it("detects MP3 URLs", () => {
    expect(detectAudioUrl("Get this: https://example.com/song.mp3")).toBe(
      "https://example.com/song.mp3",
    );
  });

  it("detects WAV URLs", () => {
    expect(detectAudioUrl("https://cdn.example.com/audio/track.wav")).toBe(
      "https://cdn.example.com/audio/track.wav",
    );
  });

  it("detects OGG URLs with query params", () => {
    expect(detectAudioUrl("https://example.com/file.ogg?token=abc")).toBe(
      "https://example.com/file.ogg?token=abc",
    );
  });

  it("returns null for non-audio URLs", () => {
    expect(detectAudioUrl("https://example.com/page.html")).toBeNull();
  });
});

describe("isMusicLanguage", () => {
  it("recognizes music language tags", () => {
    expect(isMusicLanguage("abc")).toBe(true);
    expect(isMusicLanguage("tone")).toBe(true);
    expect(isMusicLanguage("tonejs")).toBe(true);
    expect(isMusicLanguage("webaudio")).toBe(true);
    expect(isMusicLanguage("midi")).toBe(true);
    expect(isMusicLanguage("music")).toBe(true);
  });

  it("rejects non-music languages", () => {
    expect(isMusicLanguage("javascript")).toBe(false);
    expect(isMusicLanguage("python")).toBe(false);
    expect(isMusicLanguage("typescript")).toBe(false);
  });
});

describe("detectMusicFormat", () => {
  it("detects ABC format from language tag", () => {
    expect(detectMusicFormat("abc", "")).toBe("abc");
  });

  it("detects Tone format from language tag", () => {
    expect(detectMusicFormat("tone", "")).toBe("tone");
    expect(detectMusicFormat("tonejs", "")).toBe("tone");
    expect(detectMusicFormat("webaudio", "")).toBe("tone");
  });

  it("detects MIDI format from language tag", () => {
    expect(detectMusicFormat("midi", "")).toBe("midi");
    expect(detectMusicFormat("music", "")).toBe("midi");
  });

  it("detects ABC from content even with wrong tag", () => {
    const abc = "X:1\nT:Test\nK:C\nCDEF";
    expect(detectMusicFormat("text", abc)).toBe("abc");
  });

  it("detects Tone from content even with wrong tag", () => {
    const code = "new Tone.Synth().toDestination();\nsynth.triggerAttackRelease('C4', '8n');";
    expect(detectMusicFormat("js", code)).toBe("tone");
  });

  it("returns null for non-music content", () => {
    expect(detectMusicFormat("python", "print('hello')")).toBeNull();
  });
});

describe("detectMusicInMessage", () => {
  it("detects YouTube URLs in text", () => {
    const results = detectMusicInMessage("Check out https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(results).toHaveLength(1);
    expect(results[0].format).toBe("youtube");
    expect(results[0].content).toBe("dQw4w9WgXcQ");
  });

  it("detects Spotify URLs in text", () => {
    const results = detectMusicInMessage("Listen to https://open.spotify.com/track/abc123");
    expect(results).toHaveLength(1);
    expect(results[0].format).toBe("spotify");
    expect(results[0].content).toBe("track/abc123");
  });

  it("detects audio URLs in text", () => {
    const results = detectMusicInMessage("Download from https://example.com/song.mp3");
    expect(results).toHaveLength(1);
    expect(results[0].format).toBe("audio");
  });

  it("detects multiple music items", () => {
    const text = "YouTube: https://youtu.be/dQw4w9WgXcQ and audio: https://example.com/beat.mp3";
    const results = detectMusicInMessage(text);
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it("returns empty for non-music text", () => {
    expect(detectMusicInMessage("Hello, how are you?")).toEqual([]);
  });
});
