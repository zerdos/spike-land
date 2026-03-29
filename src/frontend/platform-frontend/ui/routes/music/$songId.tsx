import { Link, useParams } from "@tanstack/react-router";
import { SONG_CATALOG } from "./song-format";

export function MusicPlayerPage() {
  const { songId } = useParams({ strict: false }) as { songId?: string };
  const song = SONG_CATALOG.find((s) => s.id === songId);

  if (!song) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#08080f",
          color: "#eee",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          gap: "16px",
        }}
      >
        <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.5)" }}>
          Song not found: <code style={{ color: "#FFD700" }}>{songId}</code>
        </p>
        <Link to="/music" style={{ color: "#FFD700", textDecoration: "none", fontSize: "14px" }}>
          Back to music
        </Link>
      </div>
    );
  }

  const iframeSrc = song.blogSlug ? `/blog/${song.blogSlug}.html` : null;

  const [gradFrom] = song.gradient ?? ["#333", "#08080f"];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#08080f",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "0 16px",
          height: "48px",
          flexShrink: 0,
          background: `linear-gradient(90deg, ${gradFrom}22 0%, transparent 100%)`,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <Link
          to="/music"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.07)",
            color: "#eee",
            textDecoration: "none",
            fontSize: "18px",
            lineHeight: 1,
            flexShrink: 0,
          }}
          title="Back to music"
        >
          &#8592;
        </Link>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#fff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {song.title}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.45)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {song.artist} &middot; {song.year}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {iframeSrc ? (
          <iframe
            src={iframeSrc}
            title={song.title}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              display: "block",
            }}
            allow="autoplay; fullscreen"
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "rgba(255,255,255,0.3)",
              fontSize: "15px",
            }}
          >
            No player available for this song yet.
          </div>
        )}
      </div>
    </div>
  );
}
