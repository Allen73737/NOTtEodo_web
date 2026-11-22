import { ArrowDownToLine, Smartphone } from "lucide-react";
import Link from "next/link";
import type { Release } from "@/lib/db/types";
import { formatBytes } from "@/lib/format";

type Props = {
  release: Release | null;
  playLive: boolean;
  playUrl: string;
  /** Show the version line under the buttons. */
  meta?: boolean;
  align?: "start" | "center";
};

/**
 * The two ways to get NOTtEodo. Before the Play launch the APK leads and Play reads
 * "Coming soon"; flipping `platform_config.play_live` swaps them without a deploy.
 */
export function DownloadCta({ release, playLive, playUrl, meta = true, align = "start" }: Props) {
  const apk = release ? (
    <a
      className={playLive ? "btn btn-ghost" : "btn"}
      href={`/api/download/${release.id}`}
      data-cursor="Download"
      download
    >
      <ArrowDownToLine size={18} strokeWidth={1.8} aria-hidden />
      Download APK
    </a>
  ) : (
    <Link className={playLive ? "btn btn-ghost" : "btn"} href="/download" data-cursor="Open">
      <ArrowDownToLine size={18} strokeWidth={1.8} aria-hidden />
      Get the Android app
    </Link>
  );
  const play = playLive ? (
    <a className="btn" href={playUrl} rel="noopener" data-cursor="Open">
      <Smartphone size={18} strokeWidth={1.8} aria-hidden />
      Get it on Google Play
    </a>
  ) : (
    <span className="play-soon" aria-label="Google Play: coming soon">
      <Smartphone size={16} strokeWidth={1.8} aria-hidden />
      <span>
        <small>Google Play</small>
        Coming soon
      </span>
    </span>
  );

  return (
    <div className="dl-cta" style={{ justifyContent: align === "center" ? "center" : "flex-start" }}>
      <div className="dl-cta__row">
        {playLive ? (
          <>
            {play}
            {apk}
          </>
        ) : (
          <>
            {apk}
            {play}
          </>
        )}
      </div>
      {meta && (
        <p className="dl-cta__meta t-label" data-live-release>
          {release ? (
            <>
              v{release.version_name} · {formatBytes(release.file_size_bytes)} · Android
              {release.published_at
                ? ` · ${new Date(release.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                : ""}
            </>
          ) : (
            <>Android · Early access</>
          )}
        </p>
      )}
    </div>
  );
}
