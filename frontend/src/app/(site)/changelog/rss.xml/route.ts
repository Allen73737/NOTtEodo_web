import { siteUrl } from "@/lib/env";
import { getReleases } from "@/lib/platform";

export const revalidate = 300;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** RSS 2.0 feed of published releases. */
export async function GET() {
  const releases = await getReleases();
  const items = releases
    .map(
      (r) => `<item>
  <title>NOTtEodo ${esc(r.version_name)}${r.channel === "beta" ? " (beta)" : ""}</title>
  <link>${siteUrl}/changelog#v${esc(r.version_name)}</link>
  <guid isPermaLink="false">notteodo-${r.version_code}</guid>
  <pubDate>${new Date(r.published_at ?? r.created_at).toUTCString()}</pubDate>
  <description>${esc(r.release_notes_md)}</description>
</item>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>NOTtEodo releases</title>
  <link>${siteUrl}/changelog</link>
  <atom:link href="${siteUrl}/changelog/rss.xml" rel="self" type="application/rss+xml"/>
  <description>New versions of NOTtEodo for Android.</description>
  <language>en-in</language>
${items}
</channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
