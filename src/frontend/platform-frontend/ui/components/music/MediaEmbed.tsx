/**
 * MediaEmbed — YouTube and Spotify inline embed players for chat messages.
 */
import { memo, useState } from "react";
import { ExternalLink, Play } from "lucide-react";

// ── YouTube Embed ─────────────────────────────────────────────────────────

interface YouTubeEmbedProps {
  videoId: string;
}

export const YouTubeEmbed = memo(function YouTubeEmbed({ videoId }: YouTubeEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <div className="my-2 overflow-hidden rounded-xl border border-border bg-card/80">
      <div className="relative aspect-video bg-black">
        {loaded ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="YouTube video"
          />
        ) : (
          <button
            type="button"
            onClick={() => setLoaded(true)}
            className="absolute inset-0 flex items-center justify-center group"
          >
            <img
              src={thumbnailUrl}
              alt="Video thumbnail"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
            <div className="relative flex size-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg group-hover:scale-110 transition-transform">
              <Play className="size-6 ml-1" fill="currentColor" />
            </div>
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="rounded-full bg-red-600/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-600">
          YouTube
        </span>
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
        >
          Open on YouTube
          <ExternalLink className="size-2.5" />
        </a>
      </div>
    </div>
  );
});

// ── Spotify Embed ─────────────────────────────────────────────────────────

interface SpotifyEmbedProps {
  type: string; // "track" | "album" | "playlist"
  id: string;
}

export const SpotifyEmbed = memo(function SpotifyEmbed({ type, id }: SpotifyEmbedProps) {
  const height = type === "track" ? 152 : 352;

  return (
    <div className="my-2 overflow-hidden rounded-xl border border-border bg-card/80">
      <iframe
        src={`https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`}
        className="w-full border-0"
        style={{ height }}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title={`Spotify ${type}`}
      />
      <div className="flex items-center gap-2 px-3 py-1.5 border-t border-border/50">
        <span className="rounded-full bg-green-600/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green-600">
          Spotify
        </span>
        <a
          href={`https://open.spotify.com/${type}/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
        >
          Listen on Spotify
          <ExternalLink className="size-2.5" />
        </a>
      </div>
    </div>
  );
});
