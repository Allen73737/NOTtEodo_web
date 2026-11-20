import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/AuthForms";
import { PageHeader } from "@/components/site/PageHeader";

export const metadata: Metadata = { title: "Welcome back.", robots: { index: false } };
// Signed-in areas carry a per-request CSP nonce, so they must render per request.
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Account" title="Welcome back." italic={["back."]} lede="Sign in with the same email or Google account you use in the app." />
      <section className="prose-wrap" style={{ maxWidth: 520, paddingBottom: 96 }}>
        <div className="card pad">
          <Suspense>
            <SignInForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
