import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { TAGS } from "@/lib/platform";
import { serverEnv } from "@/lib/env.server";

/**
 * POST /api/revalidate  { "tag": "releases" }   Authorization: Bearer <REVALIDATE_SECRET>
 * For a Supabase database webhook, so publishes made from the app's admin dashboard refresh the site.
 */
export async function POST(req: NextRequest) {
  const secret = serverEnv.REVALIDATE_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { tag?: string; table?: string };
  const byTable: Record<string, string> = {
    app_releases: TAGS.releases,
    announcements: TAGS.announcements,
    platform_config: TAGS.config,
    legal_documents: TAGS.legal,
  };
  const tag = body.tag ?? (body.table ? byTable[body.table] : undefined);
  const valid = Object.values(TAGS) as string[];
  if (!tag || !valid.includes(tag)) return NextResponse.json({ error: "unknown tag" }, { status: 400 });
  revalidateTag(tag, "max");
  return NextResponse.json({ revalidated: tag });
}
