import { getPosts, SITE } from "@/lib/posts";

export const dynamic = "force-static";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const posts = getPosts().filter((p) => !p.draft);
  const items = posts
    .map((p) => {
      const url = `${SITE}/writing/${p.slug}/`;
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${p.date.toUTCString()}</pubDate>
      <description>${esc(p.summary)}</description>
      <content:encoded><![CDATA[${p.html.replaceAll("]]>", "]]]]><![CDATA[>")}]]></content:encoded>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>whiletrueee — Writing</title>
    <link>${SITE}/writing/</link>
    <atom:link href="${SITE}/writing/rss.xml" rel="self" type="application/rss+xml" />
    <description>Engineering, written while it happened.</description>
    <language>en</language>
${posts[0] ? `    <lastBuildDate>${posts[0].date.toUTCString()}</lastBuildDate>\n` : ""}${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
