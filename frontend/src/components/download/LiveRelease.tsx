"use client";

import { Wordmark } from "@/components/brand/Wordmark";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Release } from "@/lib/db/types";
import { formatBytes, formatDate } from "@/lib/format";
import { haptic, play } from "@/lib/sound";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * The live release card on /download. Subscribes to app_releases over Realtime, so when an admin
 * publishes, visitors see the new version immediately, with a small ceremony.
 */
export function LiveRelease({ initial, betaInitial = null }: { initial: Release | null; betaInitial?: Release | null }) {
  const [channel, setChannel] = useState<"stable" | "beta">("stable");
  const [stableRelease, setStableRelease] = useState(initial);
  const [betaRelease, setBetaRelease] = useState(betaInitial);
  const [fresh, setFresh] = useState(false);

  const release = channel === "stable" ? stableRelease : betaRelease;

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    const ch = sb
      .channel("web-releases")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_releases" }, async () => {
        const [stableRes, betaRes] = await Promise.all([
          sb.from("app_releases").select("*").eq("is_published", true).eq("channel", "stable").eq("is_latest", true).maybeSingle(),
          sb.from("app_releases").select("*").eq("is_published", true).eq("channel", "beta").eq("is_latest", true).maybeSingle(),
        ]);
        if (stableRes.data) setStableRelease(stableRes.data as Release);
        if (betaRes.data) setBetaRelease(betaRes.data as Release);
        setFresh(true);
        play("wax");
        haptic(20);
        toast("Releases updated in real-time");
      })
      .subscribe();
    return () => {
      void sb.removeChannel(ch);
    };
  }, []);

  const channelTabs = (
    <div className="row release__header" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
      <div className="release__tabs" role="tablist" aria-label="Release channel">
        <button
          type="button"
          role="tab"
          aria-selected={channel === "stable"}
          className={`chip${channel === "stable" ? " is-active" : ""}`}
          onClick={() => { setChannel("stable"); play("paper"); haptic(); }}
        >
          Stable
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={channel === "beta"}
          className={`chip${channel === "beta" ? " is-active" : ""}`}
          onClick={() => { setChannel("beta"); play("paper"); haptic(); }}
        >
          Preview / Beta
        </button>
      </div>
      {fresh && <span className="chip">Just released</span>}
    </div>
  );

  if (!release) {
    return (
      <div className="card pad stack release" aria-live="polite">
        {channelTabs}
        <p className="t-eyebrow">{channel === "stable" ? "Early access" : "Beta channel"}</p>
        <p className="t-h3">{channel === "stable" ? "The first public build is being prepared." : "No active preview build."}</p>
        <p className="muted">
          {channel === "stable"
            ? "This page updates by itself the moment it is published. Leave your email below and we’ll write once, when it’s ready."
            : `The stable build ${stableRelease ? `(${stableRelease.version_name})` : ""} is currently the latest release. New preview builds appear here.`}
        </p>
      </div>
    );
  }
  return (
    <div className={`card pad stack release${fresh ? " is-fresh" : ""}`} aria-live="polite">
      {channelTabs}
      <p className="t-eyebrow">{channel === "stable" ? "Latest stable release" : "Latest preview release"}</p>
      <p className="t-h2">
        <Wordmark /> {release.version_name}
      </p>
      <dl className="facts">
        <div>
          <dt>Released</dt>
          <dd>{formatDate(release.published_at)}</dd>
        </div>
        <div>
          <dt>Size</dt>
          <dd>{formatBytes(release.file_size_bytes)}</dd>
        </div>
        <div>
          <dt>Requires</dt>
          <dd>{release.min_sdk ? `Android API ${release.min_sdk}+` : "Android"}</dd>
        </div>
        <div>
          <dt>Version code</dt>
          <dd className="t-num">{release.version_code}</dd>
        </div>
      </dl>
      <a className="btn" href={`/api/download/${release.id}`} data-cursor="Download">
        Download APK
      </a>
      <Checksum value={release.sha256} label="SHA-256" />
      {release.signing_cert_sha256 && <Checksum value={release.signing_cert_sha256} label="Signing certificate SHA-256" />}
      {release.release_notes_md && (
        <div className="notes">
          <p className="t-label">What&rsquo;s new</p>
          {release.release_notes_md.split("\n").filter(Boolean).map((l, i) => (
            <p key={i}>{l.replace(/^[-*]\s*/, "· ")}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function Checksum({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="checksum">
      <p className="t-label">{label}</p>
      <div className="checksum__row">
        <code>{value}</code>
        <button
          type="button"
          className="icon-btn"
          aria-label={`Copy ${label}`}
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setDone(true);
            play("tick");
            haptic();
            toast.success(`${label} copied to clipboard`);
            setTimeout(() => setDone(false), 1600);
          }}
        >
          {done ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}
