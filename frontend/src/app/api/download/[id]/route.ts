import { NextResponse, type NextRequest } from "next/server";
import { env, hasSupabase } from "@/lib/env";
import { sha256Hex } from "@/lib/hash";

export const runtime = "edge";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * GET /api/download/<releaseId|latest>[?channel=beta]
 * Counts the download (hashed client, never a raw IP) and redirects to the APK in storage.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!hasSupabase) return NextResponse.redirect(new URL("/download", req.url), 302);
  const base = env.NEXT_PUBLIC_SUPABASE_URL!;
  const headers = { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` };
  const channel = req.nextUrl.searchParams.get("channel") === "beta" ? "beta" : "stable";

  const filter =
    id === "latest" ? `channel=eq.${channel}&is_latest=eq.true` : UUID.test(id) ? `id=eq.${id}` : null;
  if (!filter) return NextResponse.json({ error: "Unknown release" }, { status: 404 });

  const res = await fetch(`${base}/rest/v1/app_releases?select=id,file_path&is_published=eq.true&${filter}&limit=1`, {
    headers,
    cache: "no-store",
  });
  const rows = res.ok ? ((await res.json()) as { id: string; file_path: string }[]) : [];
  const release = rows[0];
  if (!release) return NextResponse.redirect(new URL("/download?missing=1", req.url), 302);

  // Salted, daily-rotated hash: the salt is a server secret and the date changes it every day.
  const salt = process.env.DOWNLOAD_HASH_SALT;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
  if (salt && ip) {
    const day = new Date().toISOString().slice(0, 10);
    const clientHash = await sha256Hex(`${salt}:${day}:${ip}`);
    // Fire and forget: a counting failure must never block the download.
    void fetch(`${base}/rest/v1/rpc/increment_download`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ p_release_id: release.id, p_client_hash: clientHash }),
    }).catch(() => undefined);
  }

  const target = `${base}/storage/v1/object/public/apk-releases/${encodeURIComponent(release.file_path)}`;
  return NextResponse.redirect(target, {
    status: 302,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
