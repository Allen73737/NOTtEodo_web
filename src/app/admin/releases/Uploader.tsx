"use client";

import { createSHA256 } from "hash-wasm";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload } from "tus-js-client";
import { inspectApk, validateApk, type ApkInfo } from "@/lib/apk/parse";
import { env } from "@/lib/env";
import { supabaseBrowser } from "@/lib/supabase/client";
import { createRelease } from "../actions";

type Stage = "idle" | "checking" | "ready" | "uploading" | "paused" | "saving" | "done";

/**
 * Drop an APK → it's inspected in the browser (package, versionCode, signing cert), hashed
 * (SHA-256, streamed in 8 MB chunks), uploaded resumably (TUS) to the apk-releases bucket,
 * then recorded as an unpublished release you can review and publish.
 */
export function Uploader({ latestVersionCode, lastCert, posters }: { latestVersionCode: number; lastCert: string | null; posters: { id: string; title: string }[] }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<ApkInfo | null>(null);
  const [sha, setSha] = useState("");
  const [issues, setIssues] = useState<{ errors: string[]; warnings: string[] }>({ errors: [], warnings: [] });
  const [progress, setProgress] = useState(0);
  const [over, setOver] = useState(false);
  const [notes, setNotes] = useState("");
  const [channel, setChannel] = useState<"stable" | "beta">("stable");
  const [poster, setPoster] = useState("");
  const upload = useRef<Upload | null>(null);
  const router = useRouter();

  async function check(f: File) {
    setFile(f);
    setStage("checking");
    setProgress(0);
    try {
      const buf = await f.arrayBuffer();
      const parsed = await inspectApk(buf);
      setInfo(parsed);
      setIssues(validateApk(parsed, latestVersionCode, lastCert));
      const hasher = await createSHA256();
      const CHUNK = 8 * 1024 * 1024;
      for (let o = 0; o < buf.byteLength; o += CHUNK) {
        hasher.update(new Uint8Array(buf, o, Math.min(CHUNK, buf.byteLength - o)));
        setProgress(Math.round(((o + CHUNK) / buf.byteLength) * 100));
        await new Promise((r) => setTimeout(r, 0));
      }
      setSha(hasher.digest("hex"));
      setStage("ready");
      setProgress(0);
    } catch (e) {
      setIssues({ errors: [(e as Error).message], warnings: [] });
      setStage("idle");
    }
  }

  async function start() {
    if (!file || !info) return;
    const sb = supabaseBrowser();
    const { data } = (await sb?.auth.getSession()) ?? { data: { session: null } };
    if (!data.session) return toast.error("Session expired. Sign in again.");
    const objectName = `NOTtEodo-${info.versionName}.apk`;
    setStage("uploading");
    upload.current = new Upload(file, {
      endpoint: `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 2000, 5000, 10000],
      headers: { authorization: `Bearer ${data.session.access_token}`, "x-upsert": "false" },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024, // Supabase requires 6 MB chunks
      metadata: { bucketName: "apk-releases", objectName, contentType: "application/vnd.android.package-archive", cacheControl: "3600" },
      onProgress: (sent, total) => setProgress(Math.round((sent / total) * 100)),
      onError: (err) => {
        toast.error(`Upload failed: ${err.message}`);
        setStage("ready");
      },
      onSuccess: async () => {
        setStage("saving");
        const r = await createRelease({
          version_name: info.versionName,
          version_code: info.versionCode,
          channel,
          file_path: objectName,
          file_size_bytes: file.size,
          sha256: sha,
          signing_cert_sha256: info.signingCertSha256,
          min_sdk: info.minSdk,
          release_notes_md: notes,
          poster_key: poster || null,
        });
        if (r.ok) {
          toast.success(`${info.versionName} uploaded. Review it below, then publish.`);
          setStage("done");
          router.refresh();
        } else {
          toast.error(r.message ?? "Could not save the release.");
          setStage("ready");
        }
      },
    });
    const previous = await upload.current.findPreviousUploads();
    if (previous[0]) upload.current.resumeFromPreviousUpload(previous[0]);
    upload.current.start();
  }

  const blocked = issues.errors.length > 0;
  return (
    <div className="stack">
      <label
        className="drop"
        data-over={over}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const f = e.dataTransfer.files[0];
          if (f) void check(f);
        }}
      >
        <strong>Drop the release APK here</strong>
        <span className="muted">or choose a file. It is checked in your browser before anything is uploaded.</span>
        <input type="file" accept=".apk,application/vnd.android.package-archive" className="sr-only" onChange={(e) => e.target.files?.[0] && void check(e.target.files[0])} />
        <span className="btn btn-ghost" aria-hidden="true">Choose APK</span>
      </label>

      {stage === "checking" && (
        <div className="stack">
          <p className="t-label" style={{ margin: 0 }}>Reading the manifest and hashing</p>
          <div className="progress" role="progressbar" aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
        </div>
      )}

      {info && (
        <table className="tbl">
          <tbody>
            <tr><th>Package</th><td className="t-num">{info.packageName}</td></tr>
            <tr><th>Version</th><td className="t-num">{info.versionName} (code {info.versionCode})</td></tr>
            <tr><th>Min SDK</th><td className="t-num">{info.minSdk ?? "?"}</td></tr>
            <tr><th>Signing cert</th><td className="t-num" style={{ wordBreak: "break-all" }}>{info.signingCertSha256 ?? "none found"}</td></tr>
            <tr><th>SHA-256</th><td className="t-num" style={{ wordBreak: "break-all" }}>{sha || "…"}</td></tr>
          </tbody>
        </table>
      )}
      {issues.errors.map((e) => (
        <p key={e} role="alert" style={{ color: "var(--c-error)", margin: 0 }}>✕ {e}</p>
      ))}
      {issues.warnings.map((w) => (
        <p key={w} style={{ color: "var(--c-bronze)", margin: 0 }}>! {w}</p>
      ))}

      {info && !blocked && (stage === "ready" || stage === "uploading" || stage === "paused") && (
        <div className="stack">
          <div className="form-grid">
            <label className="field">
              Channel
              <select className="input" value={channel} onChange={(e) => setChannel(e.target.value as "stable" | "beta")}>
                <option value="stable">Stable</option>
                <option value="beta">Beta</option>
              </select>
            </label>
            <label className="field">
              Release poster
              <select className="input" value={poster} onChange={(e) => setPoster(e.target.value)}>
                <option value="">None</option>
                {posters.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} ({p.id})</option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            Release notes (one change per line)
            <textarea className="input" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          {notes && (
            <div className="card pad">
              <p className="mono-cap" style={{ margin: 0 }}>Preview</p>
              {notes.split("\n").filter(Boolean).map((l, i) => <p key={i} style={{ margin: "6px 0" }}>{l.replace(/^[-*]\s*/, "· ")}</p>)}
            </div>
          )}
          {stage !== "ready" && (
            <div className="progress" role="progressbar" aria-valuenow={progress} aria-label="Upload progress"><span style={{ width: `${progress}%` }} /></div>
          )}
          <div className="row">
            {stage === "ready" && <button className="btn" onClick={start}>Upload {info.versionName}</button>}
            {stage === "uploading" && (
              <button className="btn btn-ghost" onClick={() => { void upload.current?.abort(); setStage("paused"); }}>Pause ({progress}%)</button>
            )}
            {stage === "paused" && <button className="btn" onClick={() => { upload.current?.start(); setStage("uploading"); }}>Resume ({progress}%)</button>}
          </div>
        </div>
      )}
      {stage === "saving" && <p className="t-label">Recording the release</p>}
    </div>
  );
}
