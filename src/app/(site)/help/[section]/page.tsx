import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Helpful } from "@/components/site/Helpful";
import { Breadcrumbs } from "@/components/site/JsonLd";
import { PageHeader } from "@/components/site/PageHeader";
import guide from "@/content/generated/app_guide.json";
import { modules } from "@/content/site";
import { getFaqOverrides } from "@/lib/platform";

export const revalidate = 3600;
export function generateStaticParams() {
  return guide.sections.map((s) => ({ section: s.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const key = (await params).section;
  const s = guide.sections.find((x) => x.id === key);
  return s ? { title: `${s.title} · Help`, description: s.body.slice(0, 155), alternates: { canonical: `/help/${s.id}` } } : {};
}

export default async function HelpSection({ params }: { params: Promise<{ section: string }> }) {
  const id = (await params).section;
  const i = guide.sections.findIndex((x) => x.id === id);
  const s = guide.sections[i];
  if (!s) notFound();
  const faqs = (await getFaqOverrides()).filter((f) => f.section === id);
  const feature = modules.find((m) => m.guide === id);
  const prev = guide.sections[i - 1];
  const next = guide.sections[i + 1];
  return (
    <>
      <Breadcrumbs items={[{ name: "Help", path: "/help" }, { name: s.title, path: `/help/${s.id}` }]} />
      <PageHeader eyebrow="Help centre" title={s.title} />
      <article className="prose-wrap legal__body">
        {s.body.split(/(?<=\.)\s+(?=[A-Z])/).reduce<string[][]>((acc, sentence, k) => {
          if (k % 3 === 0) acc.push([]);
          acc[acc.length - 1]!.push(sentence);
          return acc;
        }, []).map((para, k) => (
          <p key={k} className={k === 0 ? "t-lede" : undefined}>{para.join(" ")}</p>
        ))}
        {faqs.map((f) => (
          <details key={f.id} className="faq">
            <summary>{f.question}</summary>
            <p>{f.answer_md}</p>
          </details>
        ))}
        {feature && (
          <p>
            <Link href={`/features/${feature.slug}`}>See {feature.name} on the features page</Link>
          </p>
        )}
        <nav className="row help-pager" aria-label="More help">
          {prev ? <Link href={`/help/${prev.id}`} data-nav="back">← {prev.title}</Link> : <span />}
          {next ? <Link href={`/help/${next.id}`} data-nav="forward">{next.title} →</Link> : <span />}
        </nav>
        <Helpful />
      </article>
    </>
  );
}
