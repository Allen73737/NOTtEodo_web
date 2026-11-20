import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/site/PageHeader";
import { getConfig, getRoadmap } from "@/lib/platform";

export const metadata: Metadata = { title: "Roadmap", description: "What we are exploring and building next.", alternates: { canonical: "/roadmap" } };
export const revalidate = 600;

const LABEL = { exploring: "Exploring", planned: "Planned", building: "Building", shipped: "Shipped" } as const;

/** Only real plans, labelled honestly. Hidden until an admin publishes at least one item. */
export default async function RoadmapPage() {
  const [cfg, items] = await Promise.all([getConfig(), getRoadmap()]);
  if (!cfg.flags.roadmap || items.length === 0) notFound();
  return (
    <>
      <PageHeader eyebrow="Roadmap" title="What we're working on." italic={["working"]} lede="Plans change. “Exploring” means exactly that: we're thinking about it, with no promise." />
      <section className="wrap grid-auto" style={{ paddingBottom: 96 }}>
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
