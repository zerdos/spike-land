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
      </head>
      <body>{children}</body>
    </html>
  );
}
