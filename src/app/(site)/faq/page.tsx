import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/PageHeader";
import guide from "@/content/generated/app_guide.json";
import { getFaqOverrides } from "@/lib/platform";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Quick answers about NOTtEodo: privacy, accounts, sync, Nodo, widgets, backups, price and deleting your data.",
  alternates: { canonical: "/faq" },
};
export const revalidate = 3600;

/** Questions people actually ask, answered from the app's guide (and admin-curated additions). */
const CORE: { q: string; a: string; help?: string }[] = [
  { q: "Is NOTtEodo free?", a: "Yes. There's no subscription, no ads and nothing locked behind a paywall in the app today.", help: "overview" },
  { q: "Do I need an account?", a: "No. Everything works on your phone without one. An account adds sync between devices and the cloud side of Nodo.", help: "backup" },
  { q: "Where is my data stored?", a: "On your phone, encrypted with AES-256-GCM and a key held by Android's Keystore. If you sign in, a copy syncs to our database in India; add a passphrase and it is encrypted before it leaves your phone.", help: "privacy" },
  { q: "Does NOTtEodo track me or show ads?", a: "No. The app contains no analytics, advertising or tracking code, and this website sets no tracking cookies." },
  { q: "What does Nodo send to the cloud?", a: "Only when you're signed in and cloud AI is on: your question and the items that match it go to our server and an AI provider to write the answer. Without that, Nodo answers on the device.", help: "nodo" },
  { q: "How do I move to a new phone?", a: "Sign in on the new phone to sync, or make an encrypted backup in Settings → Backup & export and restore it there.", help: "backup" },
  { q: "How do I delete my account?", a: "In the app: Settings → Account & sync → Delete my account. On the web: /delete-account. Deletion is immediate.", help: "backup" },
  { q: "Is it on Google Play?", a: "Not yet: it's coming soon. Until then you can install the signed APK from the download page and verify its checksum." },
  { q: "Is there an iPhone version?", a: "NOTtEodo is for Android." },
];

export default async function FaqPage() {
  const extra = await getFaqOverrides();
  const items = [...CORE, ...extra.map((f) => ({ q: f.question, a: f.answer_md, help: f.section ?? undefined }))];
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <PageHeader eyebrow="FAQ" title="Short answers." italic={["answers."]} lede="The longer versions live in the help centre." />
      <section className="prose-wrap legal__body">
        {items.map((i) => (
          <details key={i.q} className="faq" open={false}>
            <summary>{i.q}</summary>
            <p>{i.a}</p>
            {i.help && guide.sections.some((s) => s.id === i.help) && <Link href={`/help/${i.help}`}>Read more</Link>}
          </details>
        ))}
      </section>
    </>
  );
}
