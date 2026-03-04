import { useState, useEffect } from "react";
import type { BlogPost } from "../../core/generated-posts";

type BlogMeta = Omit<BlogPost, "content">;

export function BlogListView() {
  const [posts, setPosts] = useState<BlogMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json() as Promise<BlogMeta[]>)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h1 className="text-5xl font-display font-extrabold text-[#F3F2EE] tracking-tight sm:text-6xl mb-6 drop-shadow-sm">
            The Spike.land Blog
          </h1>
          <p className="text-2xl text-[#A3A19C] font-light">
            Thoughts on AI agents, Cloudflare Workers, and the future of coding.
          </p>
        </div>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-16">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-[#1C1C1A] p-8 rounded-3xl border border-[#2A2A28]">
              <div className="h-4 bg-[#2A2A28] rounded w-1/4 mb-6" />
              <div className="h-8 bg-[#2A2A28] rounded w-3/4 mb-6" />
              <div className="h-5 bg-[#2A2A28] rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="text-center max-w-2xl mx-auto mb-20">
        <h1 className="text-5xl font-display font-extrabold text-[#F3F2EE] tracking-tight sm:text-6xl mb-6 drop-shadow-sm">
          The Spike.land Blog
        </h1>
        <p className="text-2xl text-[#A3A19C] font-light">
          Thoughts on AI agents, Cloudflare Workers, and the future of coding.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-16">
        {posts.map((post) => (
          <article key={post.slug} className="flex flex-col items-start justify-between bg-[#1C1C1A] p-8 rounded-3xl shadow-lg border border-[#2A2A28] hover:border-[#D6FF38]/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-x-4 text-sm font-medium tracking-wider uppercase mb-4">
              <time dateTime={post.date} className="text-[#8A8883]">
                {new Date(post.date).toLocaleDateString()}
              </time>
              {post.category && (
                <>
                  <span className="text-[#444]">•</span>
                  <span className="text-[#D6FF38]">
                    {post.category}
                  </span>
                </>
              )}
            </div>
            <div className="group relative">
              <h3 className="text-3xl font-display font-bold leading-tight text-[#F3F2EE] group-hover:text-[#D6FF38] transition-colors mb-4">
                <a href={`/blog/${post.slug}`}>
                  <span className="absolute inset-0" />
                  {post.title}
                </a>
              </h3>
              <p className="line-clamp-3 text-lg leading-relaxed text-[#A3A19C] font-light">
                {post.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
