import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DownloadCta } from "@/components/site/DownloadCta";
import { PageHeader } from "@/components/site/PageHeader";
import { posterFor } from "@/content/posters";
import { modulesFor, personas } from "@/content/site";
import { getConfig, getLatestRelease } from "@/lib/platform";
import { Reveal } from "@/motion/primitives";

export const revalidate = 3600;
export function generateStaticParams() {
  return personas.map((p) => ({ persona: p.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ persona: string }> }): Promise<Metadata> {
  const key = (await params).persona;
  const p = personas.find((x) => x.slug === key);
  return p ? { title: `NOTtEodo for ${p.name.toLowerCase()}`, description: p.lede, alternates: { canonical: `/for/${p.slug}` } } : {};
}

export default async function PersonaPage({ params }: { params: Promise<{ persona: string }> }) {
  const key = (await params).persona;
  const p = personas.find((x) => x.slug === key);
  if (!p) notFound();
  const [cfg, release] = await Promise.all([getConfig(), getLatestRelease()]);
  const list = modulesFor(p.slug).slice(0, 6);
  return (
    <>
      <PageHeader eyebrow={`For ${p.name.toLowerCase()}`} title={p.line} italic={p.line.split(" ").slice(-1)} lede={p.lede}>
        <DownloadCta release={release} playLive={cfg.play_live} playUrl={cfg.urls.play} meta={false} />
      </PageHeader>
      <section className="wrap section" style={{ paddingTop: 0 }}>
        <Reveal className="masonry">
          {list.map((m, i) => {
            const poster = posterFor(m.slug);
            return (
              <Link key={m.slug} href={`/features/${m.slug}`} className="card feature-card sheen pressable">
                {poster && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={poster.src} alt="" loading="lazy" width={poster.width} height={poster.height} className="feature-card__poster" />
                )}
                <div className="pad stack" style={{ gap: 6 }}>
                  <span className="t-num acc">{String(i + 1).padStart(2, "0")}</span>
                  <p className="t-h3" style={{ margin: 0 }}>{m.name}</p>
                  <p className="muted" style={{ margin: 0 }}>{m.benefits[0]}</p>
                </div>
              </Link>
            );
          })}
        </Reveal>
        <p style={{ marginTop: 32 }}>
          Other paths:{" "}
          {personas
            .filter((x) => x.slug !== p.slug)
            .map((x, i) => (
              <span key={x.slug}>
                {i ? " · " : ""}
                <Link href={`/for/${x.slug}`}>{x.name}</Link>
              </span>
            ))}
        </p>
      </section>
    </>
  );
}
