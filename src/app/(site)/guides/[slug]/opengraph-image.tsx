import { guides } from "@/content/guides";
import { ogCard, ogContentType, ogSize } from "@/lib/og";

export const alt = "A NOTtEodo guide";
export const size = ogSize;
export const contentType = ogContentType;
export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const key = (await params).slug;
  const g = guides.find((x) => x.slug === key);
  return ogCard({ eyebrow: g ? `Guide · ${g.steps.length} steps` : "Guide", title: g?.title ?? "Step by step.", foot: "Guides" });
}
