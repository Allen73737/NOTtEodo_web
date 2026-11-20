import "server-only";
import { unstable_cache } from "next/cache";
import app from "@/content/generated/app.json";
import type { Announcement, FaqOverride, LegalDocument, Release, RoadmapItem, Testimonial } from "@/lib/db/types";
import { env } from "@/lib/env";
import { supabasePublic } from "@/lib/supabase/server";

/**
 * Shared platform state (the same rows the app reads). Every reader degrades to a safe
 * default when Supabase is not configured or unreachable, so the site never breaks.
 * Cached per tag; admin writes call revalidateTag() so changes appear immediately.
 */
export type PlatformConfig = {
  play_live: boolean;
  /** True once the app asks before cloud Nodo (APP_HANDOFF D6). Changes privacy wording. */
  nodo_cloud_opt_in: boolean;
  /** True once zero data retention is switched on in the Groq console (D9). */
  groq_zdr: boolean;
  min_supported_version_code: number;
  latest_version_code: number;
  maintenance: { on: boolean; message: string };
  urls: Record<"privacy" | "terms" | "delete_account" | "support" | "help" | "play" | "website" | "status", string>;
  flags: { release_emails: boolean; testimonials: boolean; roadmap: boolean };
  hero: { eyebrow: string; headline: string; sub: string };
};

const site = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

export const DEFAULT_CONFIG: PlatformConfig = {
  play_live: false,
  nodo_cloud_opt_in: false,
  groq_zdr: false,
  min_supported_version_code: 1,
  latest_version_code: app.versionCode,
  maintenance: { on: false, message: "" },
  urls: {
    privacy: `${site}/privacy`,
    terms: `${site}/terms`,
    delete_account: `${site}/delete-account`,
    support: `${site}/support`,
    help: `${site}/help`,
    play: env.NEXT_PUBLIC_PLAY_STORE_URL,
    website: site,
    status: `${site}/status`,
  },
  flags: { release_emails: true, testimonials: false, roadmap: false },
  hero: { eyebrow: "Notes. Tasks. Life.", headline: "Curate your everyday.", sub: "" },
};

export const TAGS = {
  config: "platform-config",
  releases: "releases",
  announcements: "announcements",
  legal: "legal",
  content: "site-content",
} as const;

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error(JSON.stringify({ level: "warn", msg: "platform read failed", err: String(e) }));
    return fallback;
  }
}

export const getConfig = unstable_cache(
  async (): Promise<PlatformConfig> =>
    safe(async () => {
      const sb = supabasePublic();
      if (!sb) return DEFAULT_CONFIG;
      const { data, error } = await sb.from("platform_config").select("key,value");
      if (error) throw error;
      const merged: Record<string, unknown> = { ...DEFAULT_CONFIG };
      for (const row of data ?? []) {
        const base = merged[row.key];
        merged[row.key] =
          base && typeof base === "object" && !Array.isArray(base) && row.value && typeof row.value === "object"
            ? { ...(base as object), ...(row.value as object) }
            : row.value;
      }
      return merged as PlatformConfig;
    }, DEFAULT_CONFIG),
  ["platform-config"],
  { tags: [TAGS.config], revalidate: 300 },
);

export const getReleases = unstable_cache(
  async (): Promise<Release[]> =>
    safe(async () => {
      const sb = supabasePublic();
      if (!sb) return [];
      const { data, error } = await sb
        .from("app_releases")
        .select("*")
        .eq("is_published", true)
        .order("version_code", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Release[];
    }, []),
  ["releases"],
  { tags: [TAGS.releases], revalidate: 300 },
);

export async function getLatestRelease(channel: "stable" | "beta" = "stable"): Promise<Release | null> {
  const all = await getReleases();
  return all.find((r) => r.channel === channel && r.is_latest) ?? all.find((r) => r.channel === channel) ?? null;
}

export const getAnnouncements = unstable_cache(
  async (): Promise<Announcement[]> =>
    safe(async () => {
      const sb = supabasePublic();
      if (!sb) return [];
      const { data, error } = await sb
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .in("target", ["web", "both"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      const now = Date.now();
      return ((data ?? []) as Announcement[]).filter(
        (a) => (!a.starts_at || Date.parse(a.starts_at) <= now) && (!a.ends_at || Date.parse(a.ends_at) > now),
      );
    }, []),
  ["announcements"],
  { tags: [TAGS.announcements], revalidate: 120 },
);

export const getLegalVersions = unstable_cache(
  async (): Promise<LegalDocument[]> =>
    safe(async () => {
      const sb = supabasePublic();
      if (!sb) return [];
      const { data, error } = await sb.from("legal_documents").select("*").order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LegalDocument[];
    }, []),
  ["legal"],
  { tags: [TAGS.legal], revalidate: 3600 },
);

export const getFaqOverrides = unstable_cache(
  async (): Promise<FaqOverride[]> =>
    safe(async () => {
      const sb = supabasePublic();
      if (!sb) return [];
      const { data, error } = await sb.from("faq_overrides").select("*").eq("is_published", true).order("sort");
      if (error) throw error;
      return (data ?? []) as FaqOverride[];
    }, []),
  ["faq"],
  { tags: [TAGS.content], revalidate: 3600 },
);

export const getTestimonials = unstable_cache(
  async (): Promise<Testimonial[]> =>
    safe(async () => {
      const sb = supabasePublic();
      if (!sb) return [];
      const { data, error } = await sb.from("testimonials").select("*").eq("is_published", true).not("consent_at", "is", null);
      if (error) throw error;
      return (data ?? []) as Testimonial[];
    }, []),
  ["testimonials"],
  { tags: [TAGS.content], revalidate: 3600 },
);

export const getRoadmap = unstable_cache(
  async (): Promise<RoadmapItem[]> =>
    safe(async () => {
      const sb = supabasePublic();
      if (!sb) return [];
      const { data, error } = await sb.from("roadmap_items").select("*").eq("is_published", true).order("sort");
      if (error) throw error;
      return (data ?? []) as RoadmapItem[];
    }, []),
  ["roadmap"],
  { tags: [TAGS.content], revalidate: 3600 },
);

export const getApprovedInsights = unstable_cache(
  async (): Promise<{ topic: string; question: string; answer: string }[]> =>
    safe(async () => {
      const sb = supabasePublic();
      if (!sb) return [];
      const { data, error } = await sb.rpc("public_nodo_insights");
      if (error) throw error;
      return (data ?? []) as { topic: string; question: string; answer: string }[];
    }, []),
  ["insights"],
  { tags: [TAGS.content], revalidate: 3600 },
);

export { formatBytes } from "@/lib/format";

export const APP = app;
