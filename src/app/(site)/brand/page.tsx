import type { Metadata } from "next";
import { Monogram } from "@/components/brand/Monogram";
import { Wordmark } from "@/components/brand/Wordmark";
import { PageHeader } from "@/components/site/PageHeader";
import { colors } from "@/content/generated/tokens";

export const metadata: Metadata = { title: "Brand guidelines", description: "How to use the NOTtEodo wordmark, monogram and colours.", alternates: { canonical: "/brand" } };

export default function BrandPage() {
  return (
    <>
      <PageHeader eyebrow="Brand" title="Ivory, oxblood, and an italic t and e." italic={["italic"]} />
      <section className="prose-wrap legal__body">
        <div className="legal__section">
          <h2 className="t-h3">The wordmark</h2>
          <p className="t-h1"><Wordmark /></p>
          <p>Bodoni Moda. The lowercase <em>t</em> and <em>e</em> are italic and in the accent colour; the rest is upright. Always written NOTtEodo in plain text.</p>
        </div>
        <div className="legal__section">
          <h2 className="t-h3">The ribbon N</h2>
          <div className="row" style={{ gap: 24, color: "var(--c-accent)" }}>
            <Monogram size={120} />
            <div className="card pad" style={{ background: colors.dark.canvas, color: colors.dark.accent }}><Monogram size={80} /></div>
          </div>
          <p>Clear space: at least the width of one loop on every side. Minimum size: 24 px.</p>
        </div>
        <div className="legal__section">
          <h2 className="t-h3">Colour</h2>
          <p>Ivory &amp; Oxblood by day; pure black with Oxblood Blush by night. Never blue, teal, green, gold or neon, and no rainbow gradients.</p>
        </div>
        <div className="legal__section">
          <h2 className="t-h3">Do and don&rsquo;t</h2>
          <ul>
            <li>Do place the wordmark on Ivory or OLED black.</li>
            <li>Don&rsquo;t stretch, outline, add shadows or recolour the wordmark.</li>
            <li>Don&rsquo;t imply partnership or endorsement.</li>
            <li>The name and marks are not covered by the code&rsquo;s MIT licence.</li>
          </ul>
        </div>
      </section>
    </>
  );
}
