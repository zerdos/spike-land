import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { SONG_CATALOG, type Song } from "./song-format";

function formatDuration(seconds: number): string {
  if (seconds === 0) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const TYPE_LABELS: Record<Song["type"], string> = {
  karaoke: "karaoke",
  arena: "arena",
  sequencer: "sequencer",
  interactive: "interactive",
};

const TYPE_COLORS: Record<Song["type"], string> = {
  karaoke: "#FFD700",
  arena: "#ff6b6b",
  sequencer: "#4ecdc4",
  interactive: "#00d2ff",
};

function SongCard({ song }: { song: Song }) {
  const [from, to] = song.gradient ?? ["#333", "#08080f"];
  const typeColor = TYPE_COLORS[song.type];

  return (
    <Link
      to="/music/$songId"
      params={{ songId: song.id }}
      style={{
        display: "block",
        textDecoration: "none",
        borderRadius: "12px",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
        border: "1px solid rgba(255,255,255,0.08)",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-3px)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.5)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
      }}
    >
      {/* Card inner */}
      <div style={{ padding: "20px" }}>
        {/* Type badge */}
        <div style={{ marginBottom: "12px" }}>
          <span
            style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#08080f",
              background: typeColor,
            }}
          >
            {TYPE_LABELS[song.type]}
          </span>
        </div>

        {/* Title & artist */}
        <h3
          style={{
            margin: "0 0 4px",
            fontSize: "18px",
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.2,
            textShadow: "0 1px 4px rgba(0,0,0,0.6)",
          }}
        >
          {song.title}
        </h3>
        <p
          style={{
            margin: "0 0 4px",
            fontSize: "13px",
            color: "rgba(255,255,255,0.75)",
          }}
        >
          {song.artist}
        </p>

        {/* Year + duration */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "12px",
            fontSize: "12px",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          <span>{song.year}</span>
          {song.bpm && <span>{song.bpm} bpm</span>}
          <span style={{ marginLeft: "auto" }}>{formatDuration(song.duration)}</span>
        </div>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {song.tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: "2px 7px",
                borderRadius: "3px",
                fontSize: "10px",
                background: "rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function MusicIndexPage() {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Collect all unique tags from the catalog
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const song of SONG_CATALOG) {
      for (const tag of song.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, []);

  const filtered = useMemo(() => {
    if (!activeTag) return SONG_CATALOG;
    return SONG_CATALOG.filter((s) => s.tags.includes(activeTag));
  }, [activeTag]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08080f",
        color: "#eee",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "0 0 60px",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "48px 24px 32px",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#fff",
          }}
        >
          spike.land <span style={{ color: "#FFD700" }}>music</span>
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: "16px",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          karaoke, arenas, and interactive instruments
        </p>
      </header>

      {/* Filter chips */}
      <div
        style={{
          padding: "0 24px 28px",
          maxWidth: "1100px",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => setActiveTag(null)}
          style={{
            padding: "5px 14px",
            borderRadius: "20px",
            border: "1px solid",
            fontSize: "13px",
            cursor: "pointer",
            transition: "all 0.15s",
            borderColor: activeTag === null ? "#FFD700" : "rgba(255,255,255,0.2)",
            background: activeTag === null ? "#FFD700" : "transparent",
            color: activeTag === null ? "#08080f" : "rgba(255,255,255,0.6)",
            fontWeight: activeTag === null ? 700 : 400,
          }}
        >
          all
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            style={{
              padding: "5px 14px",
              borderRadius: "20px",
              border: "1px solid",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.15s",
              borderColor: activeTag === tag ? "#FFD700" : "rgba(255,255,255,0.2)",
              background: activeTag === tag ? "#FFD700" : "transparent",
              color: activeTag === tag ? "#08080f" : "rgba(255,255,255,0.6)",
              fontWeight: activeTag === tag ? 700 : 400,
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Song grid */}
      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 24px",
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
        }}
      >
        {filtered.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
        {filtered.length === 0 && (
          <p
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              color: "rgba(255,255,255,0.3)",
              padding: "48px 0",
              fontSize: "15px",
            }}
          >
            No songs match that tag.
          </p>
        )}
      </main>
    </div>
  );
}
