import type { Metadata } from "next";
import { Gallery } from "@/components/site/Gallery";
import { PageHeader } from "@/components/site/PageHeader";
import { posters } from "@/content/posters";

export const metadata: Metadata = {
  title: "Poster gallery",
  description: "Editorial posters made from NOTtEodo's real screens: magazine covers, typographic, Swiss grid, duotone, diptychs and more, in Ivory and OLED.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Poster gallery"
        title="The app, as art."
        italic={["art."]}
        lede="Every poster is generated in code from real app screenshots and the app's own fonts and colours. Download any of them."
      />
      <section className="wrap" style={{ paddingBottom: 96, display: "grid", gap: 24 }}>
        <Gallery posters={posters.filter((p) => p.series !== "og")} />
      </section>
    </>
  );
}
