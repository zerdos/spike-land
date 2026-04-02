import { getAllPosts, type BlogPostRow } from "@/app/db";

export async function RssFeed(): Promise<Response> {
  const posts = await getAllPosts();
  const xml = buildRssXml(posts.slice(0, 50));

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

function buildRssXml(posts: BlogPostRow[]): string {
  const items = posts.map((post) => {
    const pubDate = new Date(post.date).toUTCString();
    const link = `https://blog.spike.land/${post.slug}`;
    return [
      "    <item>",
      `      <title><![CDATA[${post.title}]]></title>`,
      `      <link>${link}</link>`,
      `      <description><![CDATA[${post.description}]]></description>`,
      `      <pubDate>${pubDate}</pubDate>`,
      `      <author><![CDATA[${post.author}]]></author>`,
      `      <guid isPermaLink="true">${link}</guid>`,
      `      <category><![CDATA[${post.category}]]></category>`,
      "    </item>",
    ].join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    "    <title>spike.land Blog</title>",
    "    <link>https://blog.spike.land</link>",
    "    <description>Articles, tutorials, and engineering insights about AI, MCP, and edge computing.</description>",
    "    <language>en</language>",
    '    <atom:link href="https://blog.spike.land/rss" rel="self" type="application/rss+xml" />',
    ...items,
    "  </channel>",
    "</rss>",
  ].join("\n");
}
