import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/PageHeader";
import { guides } from "@/content/guides";

export const metadata: Metadata = { title: "Guides", description: "Step-by-step guides for NOTtEodo.", alternates: { canonical: "/guides" } };

export default function GuidesPage() {
  return (
    <>
      <PageHeader eyebrow="Guides" title="Step by step." italic={["step."]} />
      <section className="wrap grid-auto" style={{ paddingBottom: 96 }}>
        {guides.map((g) => (
          <Link key={g.slug} href={`/guides/${g.slug}`} className="card pad sheen pressable" style={{ textDecoration: "none" }}>
            <p className="t-label" style={{ margin: 0 }}>{g.steps.length} steps</p>
            <p className="t-h3" style={{ margin: "8px 0" }}>{g.title}</p>
            <p className="muted" style={{ margin: 0 }}>{g.lede}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
