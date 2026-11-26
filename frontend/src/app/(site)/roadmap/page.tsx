import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/site/PageHeader";
import { getConfig, getRoadmap } from "@/lib/platform";

export const metadata: Metadata = { title: "Roadmap", description: "What we are exploring and building next.", alternates: { canonical: "/roadmap" } };
export const revalidate = 600;

const LABEL = { exploring: "Exploring", planned: "Planned", building: "Building", shipped: "Shipped" } as const;

const DEFAULT_ITEMS = [
  { id: "def-1", title: "Android 15 Edge-to-Edge Predictive Back", body: "Fluid system back-gesture previews matching the app's gesture system.", status: "building" },
  { id: "def-2", title: "Offline Speech-to-Text Quick Capture", body: "Voice note transcription using local on-device neural models without internet.", status: "building" },
  { id: "def-3", title: "Daily Reflection PDF Export", body: "Export journal entries and daily reflections as high-res printable folio documents.", status: "planned" },
  { id: "def-4", title: "Custom Accent Palette Designer", body: "Pick individual brand ink tones and personalize cards.", status: "planned" },
  { id: "def-5", title: "Wear OS Companion Tile", body: "Quick glance at daily tasks, timer status, and one-tap voice capture from the wrist.", status: "exploring" },
  { id: "def-6", title: "Local WebDAV & Folder Sync", body: "Self-hosted sync fallback for private NAS, Nextcloud, or local storage without accounts.", status: "exploring" },
  { id: "def-7", title: "Sanctuary Architecture & E2EE Vault", body: "Client-side encrypted notes and local SQLite storage.", status: "shipped" },
  { id: "def-8", title: "Focus Dial & Tactile Escapement", body: "Rotary timer with tick audio feedback and session logging.", status: "shipped" },
];

/** Only real plans, labelled honestly. Dynamic items from Supabase with curated defaults. */
export default async function RoadmapPage() {
  const [cfg, dbItems] = await Promise.all([getConfig(), getRoadmap()]);
  const items = dbItems.length > 0 ? dbItems : (cfg.flags.roadmap === false ? [] : DEFAULT_ITEMS);
  if (items.length === 0) notFound();
  return (
    <>
      <PageHeader eyebrow="Roadmap" title="What we're working on." italic={["working"]} lede="Plans change. “Exploring” means exactly that: we're thinking about it, with no promise." />
      <section className="wrap grid-auto page-body">
        {(["building", "planned", "exploring", "shipped"] as const).map((status) => (
          <div key={status} className="stack">
            <p className="t-eyebrow">{LABEL[status]}</p>
            {items
              .filter((i) => i.status === status)
              .map((i) => (
                <div key={i.id} className="card pad">
                  <p className="t-h3" style={{ margin: 0 }}>{i.title}</p>
                  {i.body && <p className="muted" style={{ margin: "6px 0 0" }}>{i.body}</p>}
                </div>
              ))}
          </div>
        ))}
      </section>
    </>
  );
}
