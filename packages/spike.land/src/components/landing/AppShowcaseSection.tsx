"use client";

import { Link } from "@/components/ui/link";
import type { ShowcaseApp } from "@/lib/landing/showcase-feed";
import { ArrowRight } from "lucide-react";

interface AppShowcaseSectionProps {
  apps: ShowcaseApp[];
}

const CATEGORY_LABELS: Record<ShowcaseApp["source"], string> = {
  app: "App",
  "created-app": "Created",
};

function AppCard({ app }: { app: ShowcaseApp }) {
  return (
    <Link
      href={`/apps/${app.slug}`}
      className="block rounded-xl border border-border bg-card p-5 hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-medium text-foreground text-sm leading-snug line-clamp-1">
          {app.title}
        </h3>
        <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {CATEGORY_LABELS[app.source]}
        </span>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
        {app.description || "No description provided."}
      </p>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full text-center py-16 text-muted-foreground">
      <p className="text-sm">No apps to showcase yet. Check back soon.</p>
    </div>
  );
}

export function AppShowcaseSection({ apps }: AppShowcaseSectionProps) {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <h2 className="font-heading text-3xl font-bold text-foreground tracking-tight mb-2">
            Built on Spike Land
          </h2>
          <p className="text-muted-foreground text-base max-w-xl">
            Full-stack apps deployed from prompts. See what developers are shipping.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.length === 0 ? (
            <EmptyState />
          ) : (
            apps.map((app) => <AppCard key={app.id} app={app} />)
          )}
        </div>

        {apps.length > 0 && (
          <div className="mt-8">
            <Link
              href="/store"
              className="inline-flex items-center gap-1.5 min-h-[44px] py-3 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              View All Apps
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
