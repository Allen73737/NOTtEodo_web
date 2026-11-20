import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/PageHeader";

export const metadata: Metadata = { title: "Account deleted", robots: { index: false } };
// Signed-in areas carry a per-request CSP nonce, so they must render per request.
export const dynamic = "force-dynamic";

export default function DeletedPage() {
  return (
    <>
      <PageHeader
        eyebrow="Done"
        title="Your account is deleted."
        italic={["deleted."]}
        lede="Your account and everything stored with it in the cloud have been erased. Thank you for trying NOTtEodo."
      />
      <section className="prose-wrap" style={{ paddingBottom: 96 }}>
        <p>
          The app on your phone still has its own encrypted copy. To remove it too, open NOTtEodo and go to Settings → Backup &amp;
          export → Permanently Erase All Data, or uninstall the app.
        </p>
        <Link className="btn btn-ghost" href="/">
          Back to NOTtEodo
        </Link>
      </section>
    </>
  );
}
