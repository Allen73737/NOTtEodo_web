import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUpForm } from "@/components/auth/AuthForms";
import { PageHeader } from "@/components/site/PageHeader";

export const metadata: Metadata = { title: "Make an account.", robots: { index: false } };
// Signed-in areas carry a per-request CSP nonce, so they must render per request.
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <>
      <PageHeader compact eyebrow="Account" title="Make an account." italic={["account."]} lede="Only needed for sync, cloud Nodo and the web account page. The app works fully without one." />
      <section className="prose-wrap form-wrap">
        <div className="card pad">
          <Suspense>
            <SignUpForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
