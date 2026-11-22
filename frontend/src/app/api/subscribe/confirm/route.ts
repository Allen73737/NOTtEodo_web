import { NextResponse, type NextRequest } from "next/server";
import { sha256Hex } from "@/lib/hash";
import { supabaseService } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const sb = supabaseService();
  let ok = false;
  if (sb && /^[A-Za-z0-9_-]{20,64}$/.test(token)) {
    const { data } = await sb
      .from("release_subscribers")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("confirm_token_hash", await sha256Hex(token))
      .eq("status", "pending")
      .select("id");
    ok = Boolean(data?.length);
  }
  return NextResponse.redirect(new URL(`/download?subscribed=${ok ? "1" : "0"}`, req.url), 303);
}
