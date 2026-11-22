import { NextResponse } from "next/server";
import app from "@/content/generated/app.json";
import { hasSupabase } from "@/lib/env";
import { supabasePublic } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Liveness + a cheap database round trip. No secrets, no user data. */
export async function GET() {
  const started = Date.now();
  let db: "ok" | "down" | "not-configured" = "not-configured";
  if (hasSupabase) {
    try {
      const { error } = await supabasePublic()!.rpc("public_status");
      db = error ? "down" : "ok";
    } catch {
      db = "down";
    }
  }
  return NextResponse.json(
    { status: db === "down" ? "degraded" : "ok", db, app: app.versionName, ms: Date.now() - started, at: new Date().toISOString() },
    { status: db === "down" ? 503 : 200, headers: { "Cache-Control": "no-store" } },
  );
}
