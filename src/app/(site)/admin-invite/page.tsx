import { redirect } from "next/navigation";
import { PageHeader } from "@/components/site/PageHeader";
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
    <>
      <PageHeader compact eyebrow="Admin invite" title="Join the admins." italic={["admins."]} lede={`Signed in as ${user.email}. Paste the invite code you were given.`} />
      <section className="prose-wrap form-wrap">
        <div className="card pad">
          <RedeemForm code={code ?? ""} />
        </div>
      </section>
    </>
  );
}
