import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env, hasSupabase } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";

/** Cookie-bound client for the signed-in visitor (RLS applies as that user). */
export async function supabaseServer() {
  if (!hasSupabase) return null;
  const store = await cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* called from a Server Component: the proxy refreshes the session instead */
        }
      },
    },
  });
}

/** Anonymous client with no cookies, for cacheable public reads (ISR). */
export function supabasePublic() {
  if (!hasSupabase) return null;
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Service-role client. Bypasses RLS, so it is used only for the few jobs that have no user:
 * subscriber emails and the download counter's hashed rate limit. Never for admin actions,
 * which run as the admin so RLS and the audit trigger see who did it.
 */
export function supabaseService() {
  if (!hasSupabase || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** The signed-in user and whether `public.is_app_admin()` says they are an admin. Re-checked per request. */
export async function getViewer() {
  const sb = await supabaseServer();
  if (!sb) return { sb: null, user: null, isAdmin: false } as const;
  const { data } = await sb.auth.getUser();
  const user = data.user ?? null;
  if (!user) return { sb, user: null, isAdmin: false } as const;
  const { data: admin } = await sb.rpc("is_app_admin");
  return { sb, user, isAdmin: admin === true } as const;
}
