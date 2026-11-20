import { NextResponse, type NextRequest } from "next/server";
import { sha256Hex } from "@/lib/hash";
import { supabaseService } from "@/lib/supabase/server";

async function unsubscribe(token: string) {
  const sb = supabaseService();
  if (!sb || !/^[A-Za-z0-9_-]{20,64}$/.test(token)) return false;
  const { data } = await sb
    .from("release_subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("unsubscribe_token_hash", await sha256Hex(token))
    .select("id");
  return Boolean(data?.length);
}

/** One-click unsubscribe (RFC 8058) used by mail clients. */
export async function POST(req: NextRequest) {
  await unsubscribe(req.nextUrl.searchParams.get("token") ?? "");
  return new NextResponse(null, { status: 204 });
}

/** The unsubscribe link in every email. */
export async function GET(req: NextRequest) {
  const ok = await unsubscribe(req.nextUrl.searchParams.get("token") ?? "");
  return NextResponse.redirect(new URL(`/download?unsubscribed=${ok ? "1" : "0"}`, req.url), 303);
}
