import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { env, hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { getConfig, getLatestRelease } from "@/lib/platform";
import { supabasePublic } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Status",
  description: "Live status of NOTtEodo's cloud services: sync, Nodo, account deletion, and the latest release.",
  alternates: { canonical: "/status" },
};
export const revalidate = 60;

type Check = { name: string; what: string; state: "ok" | "down" | "unknown"; ms?: number };

async function timed(fn: () => Promise<boolean>): Promise<{ ok: boolean; ms: number }> {
  const t = Date.now();
  try {
    const ok = await Promise.race([fn(), new Promise<boolean>((r) => setTimeout(() => r(false), 4000))]);
    return { ok, ms: Date.now() - t };
  } catch {
    return { ok: false, ms: Date.now() - t };
  }
}

/** Edge functions answer a CORS preflight without auth, which shows they are deployed and running. */
async function fnAlive(name: string) {
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`, {
    method: "OPTIONS",
    headers: { Origin: "https://example.invalid", "Access-Control-Request-Method": "POST" },
    cache: "no-store",
  });
  return res.status < 500;
}

export default async function StatusPage() {
  const [cfg, release] = await Promise.all([getConfig(), getLatestRelease()]);
  const checks: Check[] = [];
  if (hasSupabase) {
    const db = await timed(async () => !(await supabasePublic()!.rpc("public_status")).error);
    checks.push({ name: "Sync & accounts", what: "Database and sign-in", state: db.ok ? "ok" : "down", ms: db.ms });
    for (const [fn, label, what] of [
      ["ai-assist", "Nodo (cloud)", "Cloud answers and transcription"],
      ["delete-account", "Account deletion", "In-app and web deletion"],
      ["cloudinary-sign", "Photos & voice notes", "Media upload"],
    ] as const) {
      const r = await timed(() => fnAlive(fn));
      checks.push({ name: label, what, state: r.ok ? "ok" : "down", ms: r.ms });
    }
  } else {
    checks.push({ name: "Cloud services", what: "This site is running without a live connection", state: "unknown" });
  }
  checks.push({ name: "On-device app", what: "Everything you do without an account", state: "ok" });
  const allOk = checks.every((c) => c.state !== "down") && !cfg.maintenance.on;

  return (
    <>
      <PageHeader
        eyebrow="Status"
        title={allOk ? "All systems normal." : "Some services need attention."}
        italic={["normal.", "attention."]}
        lede={`Checked ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} IST. The app keeps working offline whatever this page says.`}
      />
      <section className="prose-wrap legal__body">
        {cfg.maintenance.on && (
          <p className="callout">
            <strong>Maintenance:</strong> {cfg.maintenance.message || "Cloud features may be briefly unavailable."}
          </p>
        )}
        <ul className="status-list">
          {checks.map((c) => (
            <li key={c.name} data-state={c.state}>
              <span className="status-list__dot" aria-hidden="true" />
              <div>
                <strong>{c.name}</strong>
                <span className="muted"> · {c.what}</span>
              </div>
              <span className="t-label">
                {c.state === "ok" ? "Operational" : c.state === "down" ? "Unavailable" : "Not checked"}
                {c.ms !== undefined ? ` · ${c.ms} ms` : ""}
              </span>
            </li>
          ))}
        </ul>
        <div className="legal__section">
          <h2 className="t-h3">Latest release</h2>
          <p>
            {release
              ? `${release.version_name} (code ${release.version_code}), published ${formatDate(release.published_at)}.`
              : "No public release yet."}
          </p>
        </div>
      </section>
    </>
  );
}
