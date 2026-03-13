import { Link } from "@tanstack/react-router";

export function CTASection() {
  return (
    <section
      className="rubik-panel-strong space-y-6 p-6 text-center sm:p-10"
      aria-labelledby="cta-heading"
    >
      <h2 id="cta-heading" className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
        Ready to build with discipline?
      </h2>
      <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground">
        spike.land is built entirely using the BAZDMEG method. 108 MCP tools, 865 tests, zero{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">any</code> types, zero{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">eslint-disable</code>. The method
        works. The code proves it.
      </p>

      <div className="grid gap-3 sm:grid-cols-3 max-w-xl mx-auto">
        <div className="rubik-panel p-4 text-center">
          <p className="text-2xl font-semibold text-foreground">108</p>
          <p className="text-xs text-muted-foreground">MCP tools</p>
        </div>
        <div className="rubik-panel p-4 text-center">
          <p className="text-2xl font-semibold text-foreground">865</p>
          <p className="text-xs text-muted-foreground">Tests passing</p>
        </div>
        <div className="rubik-panel p-4 text-center">
          <p className="text-2xl font-semibold text-foreground">0</p>
          <p className="text-xs text-muted-foreground">any types</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          to="/apps"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all duration-200"
        >
          Explore the platform
        </Link>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-7 py-3 text-sm font-semibold text-foreground hover:border-primary/24 hover:text-primary transition-colors"
        >
          Read the blog
        </Link>
        <Link
          to="/support"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-7 py-3 text-sm font-semibold text-foreground hover:border-primary/24 hover:text-primary transition-colors"
        >
          Support the project
        </Link>
      </div>
    </section>
  );
}
