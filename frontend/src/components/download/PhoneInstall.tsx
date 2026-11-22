"use client";

import { ArrowDownToLine, Apple, BellRing, ShieldCheck, Smartphone, ToggleRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { Release } from "@/lib/db/types";
import { formatBytes } from "@/lib/format";
import { haptic, play } from "@/lib/sound";

type Device = "android" | "ios" | "other";

const STEPS = [
  { icon: ArrowDownToLine, title: "Tap Download", text: "The file lands in your notifications in a few seconds." },
  { icon: BellRing, title: "Open it", text: "Tap the finished download, or find it in Files → Downloads." },
  { icon: ToggleRight, title: "Allow this once", text: "If Android asks, switch on “Allow from this source” for your browser, then go back." },
  { icon: ShieldCheck, title: "Install", text: "Tap Install. Play Protect may check it first; that’s normal." },
];

/**
 * The download page as a phone sees it. On Android: one large button with the version and size,
 * then the four taps, so the unfamiliar "unknown apps" step is expected rather than alarming.
 * On an iPhone: a straight answer that NOTtEodo is Android only. Computers get the QR code
 * further down instead, so this renders nothing there.
 */
export function PhoneInstall({ release, playLive, playUrl }: { release: Release | null; playLive: boolean; playUrl: string }) {
  const [device, setDevice] = useState<Device | null>(null);
  useEffect(() => {
    const ua = navigator.userAgent;
    const ipad = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    setDevice(/Android/i.test(ua) ? "android" : /iPhone|iPad|iPod/i.test(ua) || ipad ? "ios" : "other");
  }, []);

  if (device === null || device === "other") return null;
  if (device === "ios") {
    return (
      <section className="wrap phone-install" aria-label="On iPhone">
        <div className="phone-install__card card pad">
          <Apple size={22} strokeWidth={1.6} aria-hidden />
          <p className="t-h3" style={{ margin: 0 }}>
            NOTtEodo is for Android phones.
          </p>
          <p className="muted" style={{ margin: 0 }}>
            There isn&rsquo;t an iPhone version. You can still try the whole app in your browser.
          </p>
          <a className="btn btn-ghost" href="/try">
            Try it in the browser
          </a>
        </div>
      </section>
    );
  }

  const primary = playLive ? (
    <a className="btn phone-install__go" href={playUrl} rel="noopener" onClick={() => haptic(10)}>
      <Smartphone size={20} strokeWidth={1.8} aria-hidden />
      Get it on Google Play
    </a>
  ) : release ? (
    <a
      className="btn phone-install__go"
      href={`/api/download/${release.id}`}
      download
      onClick={() => {
        play("drop");
        haptic(12);
      }}
    >
      <ArrowDownToLine size={20} strokeWidth={1.8} aria-hidden />
      <span>
        Download APK
        <small>
          v{release.version_name} · {formatBytes(release.file_size_bytes)}
        </small>
      </span>
    </a>
  ) : null;

  return (
    <section className="wrap phone-install" aria-labelledby="phone-install-h">
      <div className="phone-install__card card pad">
        <p className="t-eyebrow" id="phone-install-h">
          On this phone
        </p>
        {primary ?? <p className="t-h3">The first build is being prepared. This page updates by itself when it&rsquo;s out.</p>}
        {!playLive && release && (
          <ol className="phone-install__steps">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} style={{ ["--i" as string]: i }}>
                <span className="phone-install__ico" aria-hidden="true">
                  <Icon size={18} strokeWidth={1.7} />
                </span>
                <span>
                  <strong>{title}</strong>
                  <span className="muted">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
        {!playLive && release && (
          <a className="phone-install__more" href="#verify">
            Want to check the file first? Compare its SHA-256 →
          </a>
        )}
      </div>
    </section>
  );
}
