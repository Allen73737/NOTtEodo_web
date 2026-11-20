import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** POST /auth/sign-out[?scope=global]: global signs out every device, including the app. */
export async function POST(req: NextRequest) {
  // Same-origin form posts only (CSRF): browsers always send Origin on POST.
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) return NextResponse.json({ error: "bad origin" }, { status: 403 });
  const scope = req.nextUrl.searchParams.get("scope") === "global" ? "global" : "local";
  const sb = await supabaseServer();
  await sb?.auth.signOut({ scope });
  return NextResponse.redirect(new URL("/?signed-out=1", req.url), 303);
}
