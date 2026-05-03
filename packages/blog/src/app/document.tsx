import type { RequestInfo } from "rwsdk/worker";

interface PageMeta {
  title?: string;
  description?: string;
  ogImage?: string;
  ogUrl?: string;
  canonical?: string;
  lang?: string;
}

export function Document({ children, ctx }: { children: React.ReactNode } & RequestInfo) {
  const meta: PageMeta = ((ctx as Record<string, unknown>).meta as PageMeta) ?? {};
  const title = meta.title ?? "spike.land blog";
  const description =
    meta.description ??
    "Articles, tutorials, and engineering insights about AI, MCP, and edge computing.";
  const lang = meta.lang ?? "en";

  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content={description} />
        {meta.ogImage && <meta property="og:image" content={meta.ogImage} />}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {meta.ogUrl && <meta property="og:url" content={meta.ogUrl} />}
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        {meta.canonical && <link rel="canonical" href={meta.canonical} />}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate" type="application/rss+xml" title="spike.land blog" href="/rss" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/styles.css" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
          integrity="sha384-n8MVd4RsEw0911VqYESoT6i1B9B1Z0Bps/yT25uLz1S22yofZ2e2O23G83m2g81S"
          crossOrigin="anonymous"
        />
        <script
          defer
          src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"
          integrity="sha384-Hjjb47/o3bB6Ym0R1b/GqE3uO+e2f8yH//vH+YlI07eZ2zY8gYmN+YxQ70Yp/wV/"
          crossOrigin="anonymous"
        ></script>
        <script
          defer
          src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"
          integrity="sha384-b/xMbtbA6o2e5P5z2gQ/G+BEMw/Z14A19fHkR8/s0E1mN4W/o0TqXvD7V0bF92mN"
          crossOrigin="anonymous"
          dangerouslySetInnerHTML={{
            __html: "",
          }}
          onLoad={() => {}}
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener("DOMContentLoaded", function() {
                  if (typeof renderMathInElement !== "undefined") {
                      renderMathInElement(document.body, {
                        delimiters: [
                            {left: '$$', right: '$$', display: true},
                            {left: '$', right: '$', display: false}
                        ],
                        throwOnError: false
                      });
                  }
              });
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
