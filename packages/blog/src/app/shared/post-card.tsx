import type { BlogPostRow } from "@/app/db";
import { parseTags } from "@/app/db";

export function PostCard({ post, featured }: { post: BlogPostRow; featured?: boolean }) {
  const tags = parseTags(post.tags);
  const formattedDate = formatDate(post.date);

  return (
    <article className={featured ? "post-card post-card--featured" : "post-card"}>
      <a href={`/${post.slug}`} className="post-card-link">
        {post.hero_image && (
          <div className="post-card-image">
            <img
              src={heroImageUrl(post.slug, post.hero_image)}
              alt={post.title}
              loading={featured ? "eager" : "lazy"}
            />
          </div>
        )}
        <div className="post-card-body">
          {post.category && <span className="post-card-category">{post.category}</span>}
          <h2 className="post-card-title">{post.title}</h2>
          <p className="post-card-description">{post.primer || post.description}</p>
          <div className="post-card-meta">
            <time dateTime={post.date}>{formattedDate}</time>
            {post.author && <span className="post-card-author">{post.author}</span>}
          </div>
          {tags.length > 0 && (
            <div className="post-card-tags">
              {tags.slice(0, 4).map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </a>
    </article>
  );
}

function heroImageUrl(slug: string, heroImage: string): string {
  if (heroImage.startsWith("http")) return heroImage;
  if (heroImage.startsWith("/blog/"))
    return `https://spike.land/api/blog-images/${slug}/${heroImage.split("/").pop()}`;
  return `https://spike.land/api/blog-images/${slug}/${heroImage.replace(/^\//, "")}`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
