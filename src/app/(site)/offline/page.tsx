import type { Metadata } from "next";
import { Scene } from "@/components/site/Scene";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };

/** Served by the service worker when this website can't be reached. (The app itself works offline anyway.) */
export default function OfflinePage() {
  return (
    <section className="wrap status-page">
      <Scene kind="plane" />
      <p className="t-eyebrow">Offline</p>
      <h1 className="t-h1">This page is in flight.</h1>
      <p className="t-lede">You&rsquo;re not connected right now. NOTtEodo on your phone keeps working offline; this website will be back when you are.</p>
    </section>
  );
}
