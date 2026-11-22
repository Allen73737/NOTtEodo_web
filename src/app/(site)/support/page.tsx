import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/PageHeader";
import { IDENTITY } from "@/content/identity";
import { getViewer } from "@/lib/supabase/server";
import { SupportForm } from "./SupportForm";

export const metadata: Metadata = {
  title: "Contact & feedback",
  description: "Report a bug, suggest an idea or ask a question. Feedback sent here appears in the app too, with our replies.",
  alternates: { canonical: "/support" },
};
export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const { user } = await getViewer();
  return (
    <>
      <PageHeader compact
        eyebrow="Support"
        title="Tell us anything."
        italic={["anything."]}
        lede={
          <>
            Bugs, ideas, questions. Feedback sent while signed in shows up in the app as well, and our replies appear on{" "}
            <Link href="/account">your account page</Link>. Most answers are already in the <Link href="/help">help centre</Link>.
          </>
        }
      />
      <section className="prose-wrap form-wrap form-wrap--wide">
        {user ? (
          <SupportForm />
        ) : (
          <div className="card pad stack">
            <p style={{ margin: 0 }}>
              <Link href="/auth/sign-in?next=/support">Sign in</Link> to send feedback you can follow, or email us at{" "}
              <a href={`mailto:${IDENTITY.supportEmail}`}>{IDENTITY.supportEmail}</a>.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
