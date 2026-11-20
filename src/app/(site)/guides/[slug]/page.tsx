import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/site/PageHeader";
import { guides } from "@/content/guides";
import { moduleBySlug } from "@/content/site";

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const key = (await params).slug;
  const g = guides.find((x) => x.slug === key);
  return g ? { title: g.title, description: g.lede, alternates: { canonical: `/guides/${g.slug}` } } : {};
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const key = (await params).slug;
  const g = guides.find((x) => x.slug === key);
  if (!g) notFound();
  const ld = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: g.title,
    description: g.lede,
    step: g.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.name, text: s.text })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <PageHeader eyebrow="Guide" title={g.title} lede={g.lede} />
      <article className="prose-wrap legal__body">
        <ol className="guide-steps">
          {g.steps.map((s) => (
            <li key={s.name}>
              <h2 className="t-h3">{s.name}</h2>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <p>
          Related:{" "}
          {g.related.map((r, i) => (
            <span key={r}>
              {i ? " · " : ""}
              <Link href={`/features/${r}`}>{moduleBySlug[r]?.name ?? r}</Link>
            </span>
          ))}
        </p>
      </article>
    </>
  );
}
