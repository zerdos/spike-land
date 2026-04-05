// Universal song format for spike.land /music

export interface Song {
  id: string;
  title: string;
  artist: string;
  year: number;
  duration: number;
  audioSrc?: string;
  coverArt?: string;
  bpm?: number;
  musicalKey?: string;
  tags: string[];
  type: "karaoke" | "arena" | "sequencer" | "interactive";
  // For existing HTML arenas, this is the blog slug that serves the HTML
  blogSlug?: string;
  // Gradient colors for card when no cover art
  gradient?: [string, string];
}

// Song catalog - the initial registry
export const SONG_CATALOG: Song[] = [
  {
    id: "if-i-can-dream",
    title: "If I Can Dream",
    artist: "Elvis Presley",
    year: 1968,
    duration: 195,
    bpm: 72,
    musicalKey: "Bb major",
    tags: ["karaoke", "60s", "soul", "rock"],
    type: "karaoke",
    blogSlug: "if-i-can-dream-arena",
    gradient: ["#FFD700", "#08080f"],
  },
  {
    id: "vienna",
    title: "Vienna",
    artist: "Billy Joel",
    year: 1977,
    duration: 214,
    bpm: 98,
    musicalKey: "Bb major",
    tags: ["karaoke", "70s", "piano", "pop"],
    type: "karaoke",
    blogSlug: "vienna-arena",
    gradient: ["#4466cc", "#08080f"],
  },
  {
    id: "the-section-8",
    title: "Rooftop Paradise",
    artist: "Section 8 Arena",
    year: 2024,
    duration: 300,
    bpm: 120,
    tags: ["arena", "electronic", "multi-persona"],
    type: "arena",
    blogSlug: "the-section-8-arena",
    gradient: ["#ff6b6b", "#1a1a2e"],
  },
  {
    id: "mike-rooftop",
    title: "Rooftop Paradise (Mike)",
    artist: "Mike Arena",
    year: 2024,
    duration: 280,
    bpm: 120,
    tags: ["arena", "electronic", "personas"],
    type: "arena",
    blogSlug: "mike-rooftop-paradise",
    gradient: ["#e94560", "#0f3460"],
  },
  {
    id: "musical-hexagons",
    title: "Musical Hexagons",
    artist: "Interactive Instrument",
    year: 2024,
    duration: 0,
    tags: ["interactive", "instrument", "scales"],
    type: "interactive",
    blogSlug: "musical-hexagons",
    gradient: ["#00d2ff", "#3a7bd5"],
  },
  {
    id: "one-more-minute",
    title: "One More Minute",
    artist: "The Math Arena (Radix, Erdős, Zoltán, Daft Punk)",
    year: 2026,
    duration: 256,
    bpm: 120,
    musicalKey: "A minor",
    tags: [
      "arena",
      "music-therapy",
      "binaural-beats",
      "electronic",
      "interactive",
      "collaboration",
    ],
    type: "arena",
    blogSlug: "one-more-minute",
    coverArt: "/blog/one-more-minute/hero.png",
    gradient: ["#7c3aed", "#1e1b4b"],
  },
  {
    id: "take-on-me",
    title: "Take On Me",
    artist: "a-ha",
    year: 1985,
    duration: 225,
    bpm: 169,
    musicalKey: "A major",
    tags: ["karaoke", "80s", "synth-pop", "new-wave"],
    type: "karaoke",
    blogSlug: "take-on-me-arena",
    gradient: ["#ff9a9e", "#fecfef"],
  },
  {
    id: "smooth-operator",
    title: "Smooth Operator",
    artist: "Sade",
    year: 1984,
    duration: 258,
    bpm: 100,
    musicalKey: "B minor",
    tags: ["karaoke", "80s", "jazz", "smooth-jazz", "soul"],
    type: "karaoke",
    blogSlug: "smooth-operator-arena",
    gradient: ["#c471ed", "#12c2e9"],
  },
  {
    id: "forever-young",
    title: "Forever Young",
    artist: "Alphaville",
    year: 1984,
    duration: 224,
    bpm: 136,
    musicalKey: "G major",
    tags: ["karaoke", "80s", "synth-pop", "new-wave"],
    type: "karaoke",
    blogSlug: "forever-young-arena",
    gradient: ["#667eea", "#764ba2"],
  },
  {
    id: "smalltown-boy",
    title: "Smalltown Boy",
    artist: "Bronski Beat",
    year: 1984,
    duration: 295,
    bpm: 128,
    musicalKey: "G minor",
    tags: ["karaoke", "80s", "synth-pop", "hi-nrg"],
    type: "karaoke",
    blogSlug: "smalltown-boy-arena",
    gradient: ["#f093fb", "#f5576c"],
  },
];
