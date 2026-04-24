import { requestInfo } from "rwsdk/worker";
import { getAllPosts } from "@/app/db";
import { PostCard } from "@/app/shared/post-card";

export async function HomePage() {
  const { request } = requestInfo;
  const url = new URL(request.url);
  const activeCategory = url.searchParams.get("category");

  const allPosts = await getAllPosts();
  const categories = [...new Set(allPosts.map((p) => p.category).filter(Boolean))];

  const posts = activeCategory ? allPosts.filter((p) => p.category === activeCategory) : allPosts;

  const featured = posts.filter((p) => p.featured);
  const rest = posts.filter((p) => !p.featured);

  return (
    <div className="blog-index">
      <header className="blog-header">
        <a href="https://spike.land" className="back-link">
          &larr; spike.land
        </a>
        <h1>Blog</h1>
        <p className="blog-subtitle">
          {activeCategory
            ? `Posts in ${activeCategory}.`
            : "Articles, tutorials, and engineering insights about AI, MCP, and edge computing."}
        </p>
        <nav className="category-nav">
          <a href="/" className={`category-pill${activeCategory ? "" : " category-pill-active"}`}>
            All
          </a>
          {categories.map((cat) => (
            <a
              key={cat}
              href={`?category=${encodeURIComponent(cat)}`}
              className={`category-pill${cat === activeCategory ? " category-pill-active" : ""}`}
            >
              {cat}
            </a>
          ))}
        </nav>
      </header>

      {featured.length > 0 && (
        <section className="featured-section">
          {featured.map((post) => (
            <PostCard key={post.slug} post={post} featured />
          ))}
        </section>
      )}

      <section className="posts-grid">
        {rest.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </section>

      {posts.length === 0 && (
        <p className="empty-state">
          {activeCategory ? `No posts in ${activeCategory} yet.` : "No posts yet. Check back soon."}
        </p>
      )}

      <footer className="blog-footer">
        <a href="/rss" className="rss-link">
          RSS Feed
        </a>
        <span className="separator">&middot;</span>
        <a href="https://spike.land">spike.land</a>
      </footer>
    </div>
  );
}
