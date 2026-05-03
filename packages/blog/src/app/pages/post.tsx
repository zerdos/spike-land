import { requestInfo } from "rwsdk/worker";
import { getPostBySlug, detectLang, resolveContent, parseTags } from "@/app/db";

export async function PostPage() {
  const { request, params, ctx } = requestInfo;
  const slug = params.slug as string;
  const url = new URL(request.url);
  const lang = detectLang(request, url.searchParams.get("lang"));

  const post = await getPostBySlug(slug);

  if (!post) {
    return new Response("Post not found", { status: 404 });
  }

  const { content, resolvedLang } = resolveContent(post, lang);
  const tags = parseTags(post.tags);
  const formattedDate = formatDate(post.date);

  // Set page meta for Document component
  const ctxRecord = ctx as Record<string, unknown>;
  ctxRecord.meta = {
    title: `${post.title} — spike.land blog`,
    description: post.description,
    ogImage: post.hero_image ? heroImageUrl(slug, post.hero_image) : undefined,
    ogUrl: `https://blog.spike.land/${slug}`,
    canonical: `https://blog.spike.land/${slug}${resolvedLang !== "en" ? `?lang=${resolvedLang}` : ""}`,
    lang: resolvedLang,
  };

  return (
    <div className="post-layout">
      <header className="post-header">
        <nav className="post-nav">
          <a href="/" className="back-link">
            &larr; All posts
          </a>
          <a href="https://spike.land" className="home-link">
            spike.land
          </a>
        </nav>
        {post.category && <span className="post-category">{post.category}</span>}
        <h1 className="post-title">{post.title}</h1>
        {post.description && <p className="post-description">{post.description}</p>}
        <div className="post-meta">
          <time dateTime={post.date}>{formattedDate}</time>
          {post.author && <span className="post-author">by {post.author}</span>}
          {resolvedLang !== "en" && <span className="post-lang">{resolvedLang.toUpperCase()}</span>}
        </div>
        {tags.length > 0 && (
          <div className="post-tags">
            {tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {post.hero_image && (
        <div className="post-hero">
          <img src={heroImageUrl(slug, post.hero_image)} alt={post.title} loading="eager" />
        </div>
      )}

      <article
        className="post-content prose"
        dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
      />

      <footer className="post-footer">
        <a href="/" className="back-link">
          &larr; Back to all posts
        </a>
        <LanguageSwitcher slug={slug} currentLang={resolvedLang} />
      </footer>
    </div>
  );
}

function LanguageSwitcher({ slug, currentLang }: { slug: string; currentLang: string }) {
  const langs = [
    { code: "en", label: "English" },
    { code: "hu", label: "Magyar" },
    { code: "de", label: "Deutsch" },
    { code: "fr", label: "Fran\u00e7ais" },
    { code: "es", label: "Espa\u00f1ol" },
    { code: "it", label: "Italiano" },
    { code: "ja", label: "\u65e5\u672c\u8a9e" },
    { code: "zh", label: "\u4e2d\u6587" },
    { code: "ru", label: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439" },
  ];

  return (
    <nav className="lang-switcher">
      {langs.map(({ code, label }) => (
        <a
          key={code}
          href={code === "en" ? `/${slug}` : `/${slug}?lang=${code}`}
          className={currentLang === code ? "lang-active" : "lang-link"}
        >
          {label}
        </a>
      ))}
    </nav>
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

function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Protect math blocks
  const mathBlocks: string[] = [];
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (match) => {
    mathBlocks.push(match);
    return `___MATH_BLOCK_${mathBlocks.length - 1}___`;
  });

  // Protect inline math
  const mathInline: string[] = [];
  html = html.replace(/\$([^$]+)\$/g, (match) => {
    mathInline.push(match);
    return `___MATH_INLINE_${mathInline.length - 1}___`;
  });

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const escaped = escapeHtml(code.trimEnd());
    return `<pre><code class="language-${lang || "text"}">${escaped}</code></pre>`;
  });

  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  html = html.replace(/^#{6}\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#{5}\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^#{4}\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  html = html.replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/^---$/gm, "<hr />");

  html = html.replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<")) return trimmed;
      // Don't wrap math blocks in p tags if they are standalone
      if (trimmed.startsWith("___MATH_BLOCK_")) return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  // Restore math
  html = html.replace(/___MATH_BLOCK_(\d+)___/g, (_, i) => mathBlocks[parseInt(i)]);
  html = html.replace(/___MATH_INLINE_(\d+)___/g, (_, i) => mathInline[parseInt(i)]);

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
