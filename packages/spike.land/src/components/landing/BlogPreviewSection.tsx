"use client";

import { Link } from "@/components/ui/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";

interface BlogPost {
  title: string;
  description: string;
  category?: string;
  date: string;
  readTime: string;
  href: string;
}

const posts: BlogPost[] = [
  {
    title: "How AI Agents Build Production Apps",
    description:
      "A deep dive into how recursive AI agents generate, test, and deploy full-stack applications on the spike.land platform.",
    category: "Engineering",
    date: "Feb 10, 2026",
    readTime: "6 min read",
    href: "/blog/ai-agents-production-apps",
  },
  {
    title: "Getting Started with MCP on Spike Land",
    description:
      "Connect Claude, Cursor, or any MCP client to spike.land and unlock database, AI, testing, and file system tools in minutes.",
    category: "Tutorial",
    date: "Feb 5, 2026",
    readTime: "4 min read",
    href: "/blog/getting-started-mcp",
  },
  {
    title: "From Prompt to Production in 30 Seconds",
    description:
      "Watch an AI agent turn a single sentence into a deployed app with routing, state management, and live preview.",
    category: "Guide",
    date: "Jan 28, 2026",
    readTime: "5 min read",
    href: "/blog/prompt-to-production",
  },
];

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={post.href} className="block h-full group">
      <article className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4 h-full group-hover:bg-accent/50 transition-colors">
        <div className="flex items-start justify-between gap-3">
          {post.category && (
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
              {post.category}
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <h3 className="font-heading text-lg font-semibold text-foreground leading-snug">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {post.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {post.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime}
            </span>
          </div>

          <span
            className="inline-flex items-center gap-1 min-h-[44px] py-3 text-sm font-medium text-foreground group-hover:text-primary transition-colors"
            aria-hidden="true"
          >
            Read More
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </article>
    </Link>
  );
}

export function BlogPreviewSection() {
  return (
    <section className="py-24 sm:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <h2 className="font-heading text-3xl font-bold text-foreground">
                From the Blog
              </h2>
              <p className="mt-2 text-muted-foreground">
                Engineering deep-dives, tutorials, and platform updates.
              </p>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">No blog posts yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <BlogCard key={post.href} post={post} />
              ))}
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 min-h-[44px] py-3 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              View All Posts
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
