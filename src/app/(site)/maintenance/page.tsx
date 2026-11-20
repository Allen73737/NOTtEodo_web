import type { Metadata } from "next";
import Link from "next/link";
import { Scene } from "@/components/site/Scene";
import { getConfig } from "@/lib/platform";

export const metadata: Metadata = { title: "Maintenance", robots: { index: false } };
export const revalidate = 60;

export default async function MaintenancePage() {
  const cfg = await getConfig();
  return (
    <section className="wrap status-page">
      <Scene kind="envelope" />
      <p className="t-eyebrow">Maintenance</p>
      <h1 className="t-h1">Sealed for a moment.</h1>
      <p className="t-lede">
        {cfg.maintenance.on && cfg.maintenance.message
          ? cfg.maintenance.message
          : "Cloud features are being looked after. Everything on your phone keeps working, and sync catches up afterwards."}
      </p>
      <Link className="btn btn-ghost" href="/status">Live status</Link>
    </section>
  );
}
