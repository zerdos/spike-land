import { getAllPosts } from "@/app/db";
import { PostCard } from "@/app/shared/post-card";

export async function HomePage() {
  const posts = await getAllPosts();

  const featured = posts.filter((p) => p.featured);
  const rest = posts.filter((p) => !p.featured);

  const categories = [...new Set(posts.map((p) => p.category).filter(Boolean))];

  return (
    <div className="blog-index">
      <header className="blog-header">
        <a href="https://spike.land" className="back-link">
          &larr; spike.land
        </a>
        <h1>Blog</h1>
        <p className="blog-subtitle">
          Articles, tutorials, and engineering insights about AI, MCP, and edge computing.
        </p>
        <nav className="category-nav">
          {categories.map((cat) => (
            <a key={cat} href={`?category=${encodeURIComponent(cat)}`} className="category-pill">
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

      {posts.length === 0 && <p className="empty-state">No posts yet. Check back soon.</p>}

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
