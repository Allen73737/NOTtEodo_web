import guide from "@/content/generated/app_guide.json";
import { ogCard, ogContentType, ogSize } from "@/lib/og";

export const alt = "NOTtEodo help centre";
export const size = ogSize;
export const contentType = ogContentType;
export function generateStaticParams() {
  return guide.sections.map((s) => ({ section: s.id }));
}

export default async function Image({ params }: { params: Promise<{ section: string }> }) {
  const key = (await params).section;
  const s = guide.sections.find((x) => x.id === key);
  return ogCard({ eyebrow: "Help centre", title: s?.title ?? "How can we help?", foot: "Help" });
}
