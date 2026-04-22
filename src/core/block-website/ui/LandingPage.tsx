import { LandingHero } from "./LandingHero";
import { LandingQuiz } from "./LandingQuiz";
import { AppShowcase } from "../core-logic/AppShowcase";
import { TryItNow } from "./TryItNow";
import { BlogListView } from "./BlogList";
import { Link } from "../lazy-imports/link";
import { ArrowRight, Zap, Layers3, Globe } from "lucide-react";

export function LandingPage() {
  return (
    <div className="font-sans text-foreground selection:bg-primary selection:text-primary-foreground dark:selection:bg-primary/40 dark:selection:text-primary-light">
      <LandingHero />

      <LandingQuiz />

      {/* Section 1: What is spike.land? */}
      <section aria-labelledby="what-is-heading" className="rubik-section rubik-container-wide">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2
            id="what-is-heading"
            className="text-balance text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl"
          >
            What is spike.land?
          </h2>
          <p className="mt-4 text-lg font-medium leading-8 text-muted-foreground">
            An open platform for discovering, composing, and shipping AI tools — built on the edge.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Layers3,
              title: "80+ AI Tools",
              desc: "Discover and compose verified MCP tools for any workflow.",
            },
            {
              icon: Zap,
              title: "Edge-Native Runtime",
              desc: "Every call runs on Cloudflare Workers. Zero cold starts, global distribution.",
            },
            {
              icon: Globe,
              title: "Open Platform",
              desc: "Build your own tools, publish to the store, monetize your expertise.",
            },
          ].map((card) => (
            <div key={card.title} className="rubik-panel rubik-panel-muted p-8">
              <div className="rubik-icon-badge size-12 rounded-2xl">
                <card.icon className="size-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em]">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="rubik-stack pb-24 sm:pb-32">
        {/* Section 2: Interactive demo */}
        <section className="relative">
          <TryItNow />
        </section>

        {/* Section 3: Featured Apps */}
        <section aria-labelledby="featured-apps-heading" className="relative overflow-hidden">
          <div className="rubik-container-wide mb-10">
            <h2
              id="featured-apps-heading"
              className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl"
            >
              Featured Apps
            </h2>
            <p className="mt-2 text-base font-medium text-muted-foreground">
              A curated selection of apps built on the spike.land runtime.
            </p>
          </div>
          <AppShowcase />
        </section>

        {/* Section 4: Blog */}
        <section
          aria-labelledby="blog-heading"
          className="rubik-container-wide rubik-section-compact"
        >
          <header className="mb-12 flex items-end justify-between border-b border-border/50 pb-8">
            <div className="space-y-2">
              <h2
                id="blog-heading"
                className="text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl"
              >
                From the Blog
              </h2>
              <p className="text-lg font-medium text-muted-foreground">
                Thinking out loud on AI, edge computing, and building in public.
              </p>
            </div>
            <Link
              href="/blog"
              className="rubik-kicker-link hidden items-center text-[0.76rem] font-semibold uppercase tracking-[0.16em] sm:inline-flex"
            >
              View all posts
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </header>

          <BlogListView limit={3} showHeader={false} />

          <div className="mt-12 sm:hidden">
            <Link
              href="/blog"
              className="rubik-panel rubik-panel-muted flex items-center justify-center gap-2 p-4 text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-foreground"
            >
              View all posts
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
