import type { Metadata } from "next";
import Link from "next/link";
import { HelpSearch } from "@/components/site/HelpSearch";
import { PageHeader } from "@/components/site/PageHeader";
import guide from "@/content/generated/app_guide.json";
import { getApprovedInsights } from "@/lib/platform";

export const metadata: Metadata = {
  title: "Help centre",
  description: "How to use every part of NOTtEodo, from the same guide Nodo uses inside the app.",
  alternates: { canonical: "/help" },
  openGraph: { images: ["/posters/og/og-help-light.png"] },
};
export const revalidate = 3600;

export default async function HelpPage() {
  const insights = await getApprovedInsights();
  return (
    <>
      <PageHeader
        eyebrow="Help centre"
        title="Everything, explained plainly."
        italic={["plainly."]}
        lede="The same guide Nodo reads inside the app, so the answers here and in the app always agree."
      />
      <section className="prose-wrap" style={{ paddingBottom: 40 }}>
        <HelpSearch extra={insights.map((i) => ({ question: i.question, answer: i.answer }))} />
      </section>
      <section className="wrap section" style={{ paddingTop: 20 }}>
        <div className="grid-auto">
          {guide.sections.map((s) => (
            <Link key={s.id} href={`/help/${s.id}`} className="card pad sheen pressable" style={{ textDecoration: "none" }}>
              <p className="t-h3" style={{ margin: 0 }}>{s.title}</p>
              <p className="muted" style={{ margin: "8px 0 0" }}>{s.body.slice(0, 110)}…</p>
            </Link>
          ))}
        </div>
        <p style={{ marginTop: 32 }}>
          Still stuck? <Link href="/faq">Read the FAQ</Link>, follow a <Link href="/guides">guide</Link> or <Link href="/support">contact us</Link>.
        </p>
      </section>
    </>
  );
}
