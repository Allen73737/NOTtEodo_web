import type { MetadataRoute } from "next";
import guide from "@/content/generated/app_guide.json";
import { guides } from "@/content/guides";
import { modules, personas } from "@/content/site";
import { siteUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = [
    "", "/features", "/try", "/why", "/design", "/craft", "/security", "/nodo", "/gallery", "/download", "/changelog",
    "/help", "/faq", "/guides", "/status", "/support", "/press", "/brand",
    "/privacy", "/terms", "/delete-account", "/data-safety", "/child-safety", "/cookies", "/accessibility", "/licenses",
    ...modules.map((m) => `/features/${m.slug}`),
    ...personas.map((p) => `/for/${p.slug}`),
    ...guide.sections.map((s) => `/help/${s.id}`),
    ...guides.map((g) => `/guides/${g.slug}`),
  ];
  return paths.map((p) => ({
    url: `${siteUrl}${p}`,
    lastModified: now,
    changeFrequency: p === "" || p === "/download" || p === "/changelog" ? "weekly" : "monthly",
    priority: p === "" ? 1 : p.startsWith("/features") || p === "/download" ? 0.8 : 0.5,
  }));
}
