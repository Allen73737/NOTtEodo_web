"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env, hasSupabase } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient> | null = null;

/** Browser client (auth + Realtime). Null when the site runs without Supabase. */
export function supabaseBrowser() {
  if (!hasSupabase) return null;
  client ??= createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  return client;
}
