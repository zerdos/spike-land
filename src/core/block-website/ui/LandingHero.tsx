import { useState, useEffect } from "react";
import { Link } from "../lazy-imports/link";
import { apiUrl } from "../core-logic/api";

const fadeInStyle = `
@keyframes hero-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.hero-fade-in {
  animation: hero-fade-in 0.5s ease-out both;
}
`;

export const TOTAL_TOOL_COUNT = 80;

export function LandingHero() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    fetch(apiUrl("/github/stars"))
      .then((res) => res.json() as Promise<{ stars: number | null }>)
      .then((data) => {
        if (data.stars != null) setStars(data.stars);
      })
      .catch(() => {
        /* graceful fallback */
      });
  }, []);

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden py-32 sm:py-40 font-sans"
    >
      <style>{fadeInStyle}</style>
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute right-1/4 bottom-0 h-56 w-56 rounded-full bg-info/12 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        {/* GitHub stars badge */}
        {stars != null && (
          <div
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm hero-fade-in"
            style={{ animationDelay: "0ms" }}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z" />
            </svg>
            <span className="font-semibold text-foreground">{stars.toLocaleString()}</span>
            <span>stars on GitHub</span>
          </div>
        )}

        {/* Headline */}
        <h1
          id="hero-heading"
          className="text-fluid-h1 text-balance tracking-tight hero-fade-in"
          style={{
            fontVariationSettings: `"wght" 760`,
            letterSpacing: "-0.04em",
            animationDelay: "60ms",
          }}
        >
          The AI app store that runs on trust.
        </h1>

        {/* Subline */}
        <p
          className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-8 text-muted-foreground sm:text-xl hero-fade-in"
          style={{ animationDelay: "120ms" }}
        >
          {TOTAL_TOOL_COUNT}+ AI tools running on Cloudflare&apos;s edge. Build, discover, and ship
          AI-powered apps with typed contracts and zero cold starts.
        </p>

        {/* CTAs */}
        <div
          className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center hero-fade-in"
          role="group"
          aria-label="Primary actions"
          style={{ animationDelay: "180ms" }}
        >
          <Link
            href="/apps"
            className="inline-flex items-center justify-center rounded-[calc(var(--radius-control)-0.1rem)] bg-foreground px-8 py-3 text-base font-semibold text-background transition-colors duration-200 hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary-light dark:focus:ring-primary"
            style={{ fontVariationSettings: '"wght" 720' }}
          >
            Explore Apps
          </Link>
          <Link
            href="/vibe-code"
            className="inline-flex items-center justify-center rounded-[calc(var(--radius-control)-0.1rem)] border border-border bg-background px-8 py-3 text-base font-semibold text-foreground transition-all duration-200 hover:border-primary/30 hover:text-primary focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/15 dark:focus:ring-white/30"
          >
            Start Building
          </Link>
        </div>

        {/* Stats strip */}
        <dl
          className="mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground hero-fade-in"
          aria-label="Platform statistics"
          style={{ animationDelay: "240ms" }}
        >
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">Hosted tools</dt>
            <dd className="font-semibold text-foreground">{TOTAL_TOOL_COUNT}+</dd>
            <dd>hosted tools</dd>
          </div>
          <div className="hidden sm:block h-1 w-1 rounded-full bg-border" aria-hidden="true" />
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">Runtime</dt>
            <dd className="font-semibold text-foreground">Global</dd>
            <dd>edge runtime</dd>
          </div>
          <div className="hidden sm:block h-1 w-1 rounded-full bg-border" aria-hidden="true" />
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">Pricing</dt>
            <dd className="font-semibold text-foreground">Free</dd>
            <dd>
              <Link
                href="/pricing"
                className="hover:text-foreground hover:underline transition-colors"
              >
                to start
              </Link>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
