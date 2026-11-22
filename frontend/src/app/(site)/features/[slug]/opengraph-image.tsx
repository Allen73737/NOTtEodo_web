import { moduleBySlug, modules } from "@/content/site";
import { ogCard, ogContentType, ogSize } from "@/lib/og";

export const alt = "A NOTtEodo feature";
export const size = ogSize;
export const contentType = ogContentType;
export function generateStaticParams() {
  return modules.map((m) => ({ slug: m.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const m = moduleBySlug[(await params).slug];
  return ogCard({ eyebrow: m?.name ?? "Features", title: m?.line ?? "One app, every part of life.", foot: "Features" });
}
