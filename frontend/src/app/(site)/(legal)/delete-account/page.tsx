import type { Metadata } from "next";
import Link from "next/link";
import { Table } from "@/components/legal/LegalPage";
import { PageHeader } from "@/components/site/PageHeader";
import { IDENTITY } from "@/content/identity";

export const metadata: Metadata = {
  title: "Delete your account",
  description:
    "How to delete your NOTtEodo account and data, in the app or on the web, what is deleted, and what happens to data on your phone.",
  alternates: { canonical: "/delete-account" },
};

/** Required by Google Play: a public page explaining how to delete the account and its data. */
export default function DeleteAccountPage() {
  return (
    <>
      <PageHeader
        eyebrow="Account deletion · NOTtEodo (com.notteodo.notteodo)"
        title="Delete your account and data."
        italic={["data."]}
        lede="You can delete your NOTtEodo account at any time: in the app, on this website, or by email. Deletion is permanent and happens straight away."
      />
      <div className="prose-wrap legal__body">
        <section className="legal__section" aria-labelledby="in-app">
          <h2 id="in-app" className="t-h3">
            In the app
          </h2>
          <ol>
            <li>Open NOTtEodo and tap the menu (☰).</li>
            <li>
              Go to <strong>Settings → Account &amp; sync</strong>.
            </li>
            <li>
              Tap <strong>Delete my account</strong>, type <code>DELETE</code> to confirm, and tap Delete.
            </li>
          </ol>
        </section>

        <section className="legal__section" aria-labelledby="web">
          <h2 id="web" className="t-h3">
            On the web
          </h2>
          <ol>
            <li>
              <Link href="/auth/sign-in?next=/account/delete">Sign in</Link> with the same email or Google account you use in
              the app.
            </li>
            <li>Review what will be erased.</li>
            <li>
              Type <code>DELETE</code> and confirm. You&rsquo;ll see a confirmation page when it&rsquo;s done.
            </li>
          </ol>
          <p>
            <Link className="btn" href="/account/delete">
              Delete my account on the web
            </Link>
          </p>
        </section>

        <section className="legal__section" aria-labelledby="email">
          <h2 id="email" className="t-h3">
            By email
          </h2>
          <p>
            If you can&rsquo;t sign in, email <a href={`mailto:${IDENTITY.supportEmail}?subject=Delete%20my%20NOTtEodo%20account`}>{IDENTITY.supportEmail}</a>{" "}
            from the address on the account with the subject &ldquo;Delete my NOTtEodo account&rdquo;. We may ask you to confirm
            from that address, and we delete the account within 7 days.
          </p>
        </section>

        <section className="legal__section" aria-labelledby="what">
          <h2 id="what" className="t-h3">
            What is deleted
          </h2>
          <Table
            head={["Data", "What happens"]}
            rows={[
              ["Your account (email, sign-in methods, two-step verification)", "Deleted immediately"],
              ["All synced items (notes, tasks, planner, habits, expenses, wardrobe, travel, journal, moodboard, shopping, settings)", "Deleted immediately"],
              ["End-to-end encryption key record", "Deleted immediately"],
              ["Photos and voice notes in cloud storage", "Deleted immediately"],
              ["Nodo memories, conversation summary and recent answers", "Deleted immediately"],
              ["Feedback you sent", "Deleted immediately"],
              ["Cloud Nodo usage counts and your security log", "Deleted immediately"],
            ]}
          />
          <h3>What is not deleted</h3>
          <ul>
            <li>
              <strong>Shared app insights</strong>: common questions about using NOTtEodo and their answers. They hold no account ID
              or personal text, so nothing in them is linked to you.
            </li>
            <li>
              <strong>Provider logs</strong>: our hosting and AI providers keep short-lived operational logs under their own terms (for
              example Groq may keep request logs for up to 30 days for abuse investigation unless zero retention is on). They expire on
              their own schedule.
            </li>
            <li>
              <strong>Backups you exported yourself</strong> are files you control.
            </li>
          </ul>
        </section>

        <section className="legal__section" aria-labelledby="device">
          <h2 id="device" className="t-h3">
            Data on your phone
          </h2>
          <p>
            Deleting your account removes the cloud copy. Your phone keeps its own encrypted copy until you erase it: in the app,
            go to <strong>Settings → Backup &amp; export → Permanently Erase All Data</strong>, or uninstall NOTtEodo.
          </p>
        </section>

        <section className="legal__section" aria-labelledby="partial">
          <h2 id="partial" className="t-h3">
            Deleting only some data
          </h2>
          <p>
            You don&rsquo;t have to delete your whole account to remove data. Delete individual items in the app (they go to the
            Bin; empty the Bin to remove them for good, and sync carries that to the cloud). Delete what Nodo remembers in{" "}
            <strong>Settings → Nodo assistant</strong>, one memory at a time or all at once. Turn off cloud Nodo there too.
          </p>
        </section>
      </div>
    </>
  );
}
