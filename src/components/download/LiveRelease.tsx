"use client";

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
export function LiveRelease({ initial }: { initial: Release | null }) {
  const [release, setRelease] = useState(initial);
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    const ch = sb
      .channel("web-releases")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_releases" }, async () => {
        const { data } = await sb
          .from("app_releases")
          .select("*")
          .eq("is_published", true)
          .eq("channel", "stable")
          .eq("is_latest", true)
          .maybeSingle();
        if (data && (data as Release).id !== release?.id) {
          setRelease(data as Release);
          setFresh(true);
          play("wax");
          haptic(20);
          toast(`New version just released: ${(data as Release).version_name}`);
        }
      })
      .subscribe();
    return () => {
      void sb.removeChannel(ch);
    };
  }, [release?.id]);

  if (!release) {
    return (
      <div className="card pad stack release">
        <p className="t-eyebrow">Early access</p>
        <p className="t-h3">The first public build is being prepared.</p>
        <p className="muted">
          This page updates by itself the moment it is published. Leave your email below and we&rsquo;ll write once, when
          it&rsquo;s ready.
        </p>
      </div>
    );
  }
  return (
    <div className={`card pad stack release${fresh ? " is-fresh" : ""}`} aria-live="polite">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <p className="t-eyebrow">Latest release</p>
        {fresh && <span className="chip">Just released</span>}
      </div>
      <p className="t-h2">
        NOT<span className="it" style={{ color: "var(--c-accent)" }}>te</span>odo {release.version_name}
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
            setTimeout(() => setDone(false), 1600);
          }}
        >
          {done ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}
