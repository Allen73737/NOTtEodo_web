import "@/styles/admin.css";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/supabase/server";
import { RedeemForm } from "./RedeemForm";

export const metadata = { title: "Redeem invite" };
export const dynamic = "force-dynamic";

/** Reached by any signed-in user from an invite link; the admin layout lets non-admins see it. */
export default async function RedeemPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  const { user } = await getViewer();
  if (!user) redirect(`/auth/sign-in?next=${encodeURIComponent(`/admin-invite${code ? `?code=${code}` : ""}`)}`);
  return (
    <main className="admin-denied" style={{ minHeight: "70dvh" }}>
      <h1 className="t-h2">Join the admins.</h1>
      <p className="muted">Signed in as {user.email}. Paste the invite code you were given.</p>
      <RedeemForm code={code ?? ""} />
    </main>
  );
}
