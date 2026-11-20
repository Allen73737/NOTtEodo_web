import app from "@/content/generated/app.json";
import { GITHUB_URL } from "@/content/site";
import type { Release } from "@/lib/db/types";
import { siteUrl } from "@/lib/env";

/** SoftwareApplication + Organization structured data (no ratings or reviews: there are none yet). */
export function JsonLd({ release }: { release: Release | null }) {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "NOTtEodo",
      alternateName: "NOTtEodo: Notes, Tasks, Life",
      operatingSystem: "Android",
      applicationCategory: "ProductivityApplication",
      description: "A private, offline-first daily organiser: notes, tasks, planner, habits, focus, expenses, wardrobe, travel, journal and moodboards.",
      softwareVersion: release?.version_name ?? app.versionName,
      downloadUrl: `${siteUrl}/download`,
      url: siteUrl,
      image: `${siteUrl}/icon-512.png`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      ...(release?.min_sdk ? { softwareRequirements: `Android API ${release.min_sdk}+` } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "NOTtEodo",
      url: siteUrl,
      logo: `${siteUrl}/icon-512.png`,
      sameAs: [GITHUB_URL],
    },
  ];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/** Breadcrumbs for nested pages. */
export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${siteUrl}${it.path}` })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
