import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetForm } from "@/components/auth/AuthForms";
import { PageHeader } from "@/components/site/PageHeader";

export const metadata: Metadata = { title: "Reset your password.", robots: { index: false } };
// Signed-in areas carry a per-request CSP nonce, so they must render per request.
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Account" title="Reset your password." italic={["password."]} lede="We will email you a link." />
      <section className="prose-wrap" style={{ maxWidth: 520, paddingBottom: 96 }}>
        <div className="card pad">
          <Suspense>
            <ResetForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
