import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/site/PageHeader";
import { getViewer } from "@/lib/supabase/server";
import { DeleteFlow } from "./DeleteFlow";

export const metadata: Metadata = { title: "Delete your account", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Destructive actions need a recent sign-in (within 15 minutes). */
const RECENT_MS = 15 * 60 * 1000;

export default async function DeletePage() {
  const { sb, user } = await getViewer();
  if (!sb) redirect("/delete-account");
  if (!user) redirect("/auth/sign-in?next=/account/delete");
  const recent = user.last_sign_in_at ? Date.now() - Date.parse(user.last_sign_in_at) < RECENT_MS : false;
  return (
    <>
      <PageHeader
        eyebrow="Delete your account"
        title="This can't be undone."
        italic={["undone."]}
        lede={`You're signed in as ${user.email}.`}
      />
      <section className="prose-wrap legal__body">
        <div className="legal__section">
          <h2 className="t-h3">What will be erased</h2>
          <ul>
            <li>Your account and sign-in methods</li>
            <li>Every synced item: notes, tasks, planner, habits, expenses, wardrobe, travel, journal, moodboard, shopping, settings</li>
            <li>Photos and voice notes in cloud storage</li>
            <li>What Nodo remembers about you, and your chat summary</li>
            <li>Feedback you sent</li>
          </ul>
          <p>
            Your phone keeps its own copy until you erase it in the app (Settings → Backup &amp; export → Permanently Erase All
            Data) or uninstall. <Link href="/delete-account">Full details</Link>.
          </p>
        </div>
        {recent ? (
          <DeleteFlow />
        ) : (
          <div className="card pad stack">
            <p style={{ margin: 0 }}>For your safety, please sign in again before deleting your account.</p>
            <Link className="btn" href="/auth/sign-in?next=/account/delete">
              Sign in again
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
