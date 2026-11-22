import posterManifest from "@/content/generated/posters.json";
import { AdminHead, Empty, Panel } from "@/components/admin/parts";
import { ActionButton } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import type { Release } from "@/lib/db/types";
import { formatBytes, formatDate } from "@/lib/format";
import { deleteRelease, emailSubscribers, updateRelease } from "../actions";
import { Uploader } from "./Uploader";

export const metadata = { title: "Releases & APK" };

export default async function ReleasesPage() {
  const { sb } = await requireAdmin();
  const { data } = await sb.from("app_releases").select("*").order("version_code", { ascending: false });
  const releases = (data ?? []) as Release[];
  const latestCode = releases[0]?.version_code ?? 0;
  const lastCert = releases.find((r) => r.signing_cert_sha256)?.signing_cert_sha256 ?? null;
  const posters = posterManifest.posters
    .filter((p) => p.series === "covers" || p.series === "play")
    .map((p) => ({ id: p.id, title: p.title }));
  return (
    <>
      <AdminHead
        cap="Releases & APK"
        title="Releases & APK"
        lede="Upload → review → publish. Publishing a stable release as latest updates the website instantly over Realtime and sets latest_version_code for the app's update check."
      />
      <Panel cap="New release" note="Checked in your browser before anything uploads.">
        <Uploader latestVersionCode={latestCode} lastCert={lastCert} posters={posters} />
      </Panel>
      <Panel cap="All releases">
        {releases.length === 0 ? (
          <Empty>No releases yet.</Empty>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Channel</th>
                  <th>Size</th>
                  <th>Downloads</th>
                  <th>State</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {releases.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.version_name}</strong>{" "}
                      <span className="t-num muted">({r.version_code})</span>
                      <br />
                      <span className="t-label">{formatDate(r.published_at ?? r.created_at)}</span>
                    </td>
                    <td>{r.channel}</td>
                    <td className="t-num">{formatBytes(r.file_size_bytes)}</td>
                    <td className="t-num">{r.download_count}</td>
                    <td>
                      <span className="pill-state" data-on={r.is_published}>
                        {r.is_published ? (r.is_latest ? "Latest" : "Published") : "Draft"}
                      </span>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 4 }}>
                        {!r.is_published && (
                          <ActionButton
                            className="btn"
                            action={updateRelease.bind(null, r.id, { is_published: true, is_latest: true })}
                            confirm={`Publish ${r.version_name} as the latest ${r.channel} release?`}
                          >
                            Publish as latest
                          </ActionButton>
                        )}
                        {r.is_published && !r.is_latest && (
                          <ActionButton
                            action={updateRelease.bind(null, r.id, { is_latest: true })}
                            confirm={`Roll back: make ${r.version_name} the latest?`}
                          >
                            Make latest
                          </ActionButton>
                        )}
                        {r.is_published && (
                          <ActionButton
                            className="btn btn-quiet"
                            action={updateRelease.bind(null, r.id, { is_published: false })}
                            confirm={`Unpublish ${r.version_name}? Its download link stops working.`}
                          >
                            Unpublish
                          </ActionButton>
                        )}
                        {r.is_published && r.is_latest && (
                          <ActionButton
                            className="btn btn-quiet"
                            action={emailSubscribers.bind(null, "releases", r.id)}
                            confirm="Email every confirmed release subscriber about this version?"
                          >
                            Email subscribers
                          </ActionButton>
                        )}
                        {!r.is_published && (
                          <ActionButton
                            className="btn btn-quiet"
                            action={deleteRelease.bind(null, r.id, r.file_path)}
                            confirm={`Delete draft ${r.version_name} and its file?`}
                          >
                            Delete
                          </ActionButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <Panel
        cap="Google Play launch"
        note="When the listing goes live: mark Play live in Platform Config, then tell everyone who asked."
      >
        <ActionButton
          action={emailSubscribers.bind(null, "play_launch", undefined)}
          confirm="Email every confirmed 'tell me when it's on Google Play' subscriber now?"
        >
          Email Play-launch subscribers
        </ActionButton>
      </Panel>
    </>
  );
}
