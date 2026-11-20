import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Illustration } from "@/components/site/Illustration";
import { Breadcrumbs } from "@/components/site/JsonLd";
import { DownloadCta } from "@/components/site/DownloadCta";
import { PageHeader } from "@/components/site/PageHeader";
import { Screenshot } from "@/components/shots/Screenshot";
import guide from "@/content/generated/app_guide.json";
import { posterFor } from "@/content/posters";
import { moduleBySlug, modules } from "@/content/site";
import { getConfig, getFaqOverrides, getLatestRelease } from "@/lib/platform";
import { Reveal } from "@/motion/primitives";

export const revalidate = 3600;
export function generateStaticParams() {
  return modules.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const m = moduleBySlug[(await params).slug];
  if (!m) return {};
  const poster = posterFor(m.slug);
  return {
    title: `${m.name}: ${m.line}`,
    description: m.summary,
    alternates: { canonical: `/features/${m.slug}` },
    openGraph: poster ? { images: [{ url: poster.src, width: poster.width, height: poster.height }] } : undefined,
  };
}

const SIM: Record<string, string> = { tasks: "Strike a task", capture: "Capture a line", "focus-dial": "Spin the Focus Dial", habits: "Press the check-in seal", nodo: "Ask Nodo", expenses: "Add an expense" };

export default async function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const m = moduleBySlug[(await params).slug];
  if (!m) notFound();
  const section = guide.sections.find((s) => s.id === m.guide);
  const [cfg, release, faqs] = await Promise.all([getConfig(), getLatestRelease(), getFaqOverrides()]);
  const extra = faqs.filter((f) => f.section === m.guide);
  const poster = posterFor(m.slug);
  const darkPoster = posterFor(m.slug, "dark");

  return (
    <>
      <Breadcrumbs items={[{ name: "Features", path: "/features" }, { name: m.name, path: `/features/${m.slug}` }]} />
      <PageHeader eyebrow={m.name} title={m.line} italic={m.line.split(" ").slice(-1)} lede={m.summary}>
        <DownloadCta release={release} playLive={cfg.play_live} playUrl={cfg.urls.play} meta={false} />
      </PageHeader>

      <section className="wrap split" style={{ paddingBottom: 80 }}>
        <div className="stack">
          <Reveal as="ol" className="benefits">
            {m.benefits.map((b, i) => (
              <li key={b} className="card pad">
                <span className="t-num acc">{String(i + 1).padStart(2, "0")}</span>
                <p className="t-h3" style={{ margin: 0 }}>{b}</p>
              </li>
            ))}
          </Reveal>
          {SIM[m.slug] && (
            <Link className="btn btn-ghost" href="/try" data-cursor="Play">
              {SIM[m.slug]} in the simulator
            </Link>
          )}
        </div>
        <div style={{ display: "grid", justifyItems: "center" }}>
          {m.shot ? <Screenshot screen={m.shot} priority /> : m.illustration ? <Illustration kind={m.illustration} /> : null}
        </div>
      </section>

      {poster && (
        <section className="wrap" aria-label="Poster">
          <picture>
            {darkPoster && <source srcSet={darkPoster.src} media="(prefers-color-scheme: dark)" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={poster.src} alt={poster.alt} width={poster.width} height={poster.height} loading="lazy" className="feature-poster" />
          </picture>
        </section>
      )}

      {section && (
        <section className="prose-wrap section" aria-labelledby="how">
          <p className="t-eyebrow">From the help centre</p>
          <h2 id="how" className="t-h2">{section.title}</h2>
          <p className="t-lede">{section.body}</p>
          {extra.map((f) => (
            <details key={f.id} className="faq">
              <summary>{f.question}</summary>
              <p>{f.answer_md}</p>
            </details>
          ))}
          <Link href={`/help/${section.id}`}>More in the help centre</Link>
        </section>
      )}

      <section className="wrap section" aria-labelledby="related">
        <h2 id="related" className="t-label">Goes well with</h2>
        <div className="grid-auto" style={{ marginTop: 16 }}>
          {m.related.map((slug) => {
            const r = moduleBySlug[slug];
            return r ? (
              <Link key={slug} href={`/features/${slug}`} className="card pad sheen pressable" style={{ textDecoration: "none" }}>
                <p className="t-eyebrow" style={{ margin: 0 }}>{r.name}</p>
                <p className="t-h3 it" style={{ margin: "6px 0 0" }}>{r.line}</p>
              </Link>
            ) : null;
          })}
        </div>
      </section>
    </>
  );
}
