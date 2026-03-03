"use client";

import { Link } from "@/components/ui/link";

const pillars = [
  {
    title: "MCP Tools",
    description:
      "80+ curated tools organized into on-demand toolsets. Your agent loads only what it needs — keeping your context window focused on signal.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="3" width="7" height="7" rx="1" />
        <rect x="15" y="3" width="7" height="7" rx="1" />
        <rect x="2" y="14" width="7" height="7" rx="1" />
        <rect x="15" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    href: "/mcp",
  },
  {
    title: "Developer Platform",
    description:
      "Deploy full-stack apps in seconds. Managed infrastructure, zero config, and a marketplace that grows with your team.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    href: "/create",
  },
  {
    title: "AI-Native",
    description:
      "An AI assistant that understands your codebase, writes its own tools, and ships production-ready code — not just boilerplate.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    ),
    href: "/chat",
  },
];

export function ThreePillarsSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
            Everything you need to build
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Deploy apps, connect tools, and build with AI — all from one platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pillars.map((pillar) => (
            <Link
              key={pillar.title}
              href={pillar.href}
              className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
            >
              <article className="h-full rounded-xl border border-border bg-card p-6 transition-all duration-200 group-hover:-translate-y-1 group-hover:border-foreground/20">
                <div className="mb-5 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-foreground">
                  {pillar.icon}
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2 tracking-tight">
                  {pillar.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
