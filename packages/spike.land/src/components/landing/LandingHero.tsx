import { TOTAL_TOOL_COUNT } from "@/components/mcp/mcp-tool-registry";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";

export function LandingHero() {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary/50 text-xs font-medium text-muted-foreground mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {TOTAL_TOOL_COUNT}+ MCP tools available
        </div>

        {/* Headline */}
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.05] mb-6">
          AI-Powered Development Platform
        </h1>

        {/* Value proposition */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Lazy-load MCP tools on demand. Your AI sees only what it needs —
          less context waste, sharper responses.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="w-full sm:w-auto px-8">
            <Link href="/create">Get Started</Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto px-8 text-muted-foreground hover:text-foreground">
            <Link href="/mcp">View Tools</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
