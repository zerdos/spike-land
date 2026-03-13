export function HeroSection() {
  return (
    <section
      className="rubik-panel-strong space-y-6 p-6 text-center sm:p-10"
      aria-labelledby="bazdmeg-hero-heading"
    >
      <div className="space-y-4">
        <span className="rubik-eyebrow">
          <span className="h-2 w-2 rounded-full bg-primary" />
          AI-Assisted Development
        </span>

        <div className="space-y-3">
          <h1
            id="bazdmeg-hero-heading"
            className="text-4xl font-semibold tracking-[-0.06em] text-foreground sm:text-5xl"
          >
            The BAZDMEG Method
          </h1>
          <p className="rubik-lede mx-auto">
            Eight principles for AI-assisted development. Born from pain. Tested in production. The
            code is just the output — requirements, discipline, and testing are the product.
          </p>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm font-medium text-primary">
        30% planning · 50% testing · 20% quality · ~0% coding
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a
          href="#principles"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all duration-200"
        >
          See the principles
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </a>
        <a
          href="https://github.com/spike-land-ai/spike-land"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-7 py-3 text-sm font-semibold text-foreground hover:border-primary/24 hover:text-primary transition-colors"
        >
          View on GitHub
        </a>
      </div>
    </section>
  );
}
