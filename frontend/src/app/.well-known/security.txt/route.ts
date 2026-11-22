import { IDENTITY } from "@/content/identity";
import { siteUrl } from "@/lib/env";

export const dynamic = "force-static";

export function GET() {
  const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
  const body = [
    `Contact: mailto:${IDENTITY.securityContact}`,
    "Contact: https://github.com/Allen73737/NOTtEodo/security/advisories/new",
    `Expires: ${expires}`,
    "Preferred-Languages: en",
    `Canonical: ${siteUrl}/.well-known/security.txt`,
    `Policy: ${siteUrl}/security`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
