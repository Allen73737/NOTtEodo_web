import type { Metadata } from "next";
import Link from "next/link";
import { Monogram } from "@/components/brand/Monogram";
import { Wordmark } from "@/components/brand/Wordmark";
import { AdminNav } from "@/components/admin/AdminNav";
import { Architect } from "@/components/admin/Architect";
import { IdleTimeout } from "@/components/admin/ui";
import { ThemeToggle, ViewToggle } from "@/components/site/Toggles";
import { getViewer } from "@/lib/supabase/server";
import "@/styles/admin.css";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · NOTtEodo" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Server-side gate: admin status is re-read from public.is_app_admin() on every request.
 * Non-admins get a plain 403 page (nothing about the portal is revealed).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { sb, user, isAdmin } = await getViewer();
  if (!sb || !user || !isAdmin) {
    return (
      <main className="admin-denied">
        <Monogram size={64} />
        <h1 className="t-h2">Not available.</h1>
        <p className="muted">This area is for NOTtEodo administrators.</p>
        {user ? (
          <Link className="btn btn-ghost" href="/admin-invite">
            I have an invite
          </Link>
        ) : (
          <Link className="btn" href="/auth/sign-in?next=/admin">
            Sign in
          </Link>
        )}
        <Link href="/">Back to NOTtEodo</Link>
      </main>
    );
  }
  return (
    <div className="admin">
      <IdleTimeout />
      <aside className="admin__side">
        <Link href="/" className="admin__brand" aria-label="NOTtEodo website">
          <Wordmark />
          <span className="mono-cap">Admin</span>
        </Link>
        <AdminNav />
        <div className="admin__me">
          <p className="mono-cap">Signed in</p>
          <p className="admin__email">{user.email}</p>
          <div className="row" style={{ gap: 4 }}>
            <ViewToggle />
            <ThemeToggle />
          </div>
          <form action="/auth/sign-out" method="post">
            <button className="btn btn-quiet">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="admin__main" id="main">
        {children}
      </main>
      <Architect />
    </div>
  );
}
