import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** OAuth / email-link landing: exchanges the code for a session cookie, then continues. */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const raw = req.nextUrl.searchParams.get("next") ?? "/account";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/account";
  const sb = await supabaseServer();
  if (code && sb) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, req.url));
  }
  return NextResponse.redirect(new URL("/auth/sign-in?error=link", req.url));
}
