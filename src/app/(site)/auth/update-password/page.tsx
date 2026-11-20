import type { Metadata } from "next";
import { Suspense } from "react";
import { UpdatePasswordForm } from "@/components/auth/AuthForms";
import { PageHeader } from "@/components/site/PageHeader";

export const metadata: Metadata = { title: "Choose a new password.", robots: { index: false } };
// Signed-in areas carry a per-request CSP nonce, so they must render per request.
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Account" title="Choose a new password." italic={["new"]} lede="At least 10 characters, checked against known breaches without sending it anywhere." />
      <section className="prose-wrap" style={{ maxWidth: 520, paddingBottom: 96 }}>
        <div className="card pad">
          <Suspense>
            <UpdatePasswordForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
