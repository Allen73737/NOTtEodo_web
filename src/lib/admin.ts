import "server-only";
import { getViewer } from "@/lib/supabase/server";

export class AdminError extends Error {}

/**
 * Every admin page and server action calls this. Admin status comes only from
 * public.is_app_admin() (rows in app_admins), checked on each request. The returned client
 * acts as the admin, so RLS and the audit trigger record who did what.
 */
export async function requireAdmin(opts: { recentAuthMinutes?: number } = {}) {
  const { sb, user, isAdmin } = await getViewer();
  if (!sb || !user || !isAdmin) throw new AdminError("Admins only.");
  if (opts.recentAuthMinutes) {
    const last = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : 0;
    if (Date.now() - last > opts.recentAuthMinutes * 60_000) {
      throw new AdminError("For this action, sign in again first (it needs a sign-in within the last 15 minutes).");
    }
  }
  return { sb, user };
}

export { ADMIN_TABS } from "@/lib/admin-tabs";
