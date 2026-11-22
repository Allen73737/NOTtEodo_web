import { personas } from "@/content/site";
import { ogCard, ogContentType, ogSize } from "@/lib/og";

export const alt = "NOTtEodo, for the way you live";
export const size = ogSize;
export const contentType = ogContentType;
export function generateStaticParams() {
  return personas.map((p) => ({ persona: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ persona: string }> }) {
  const key = (await params).persona;
  const p = personas.find((x) => x.slug === key);
  return ogCard({ eyebrow: p ? `For ${p.name.toLowerCase()}` : "NOTtEodo", title: p?.line ?? "Curate your everyday." });
}
