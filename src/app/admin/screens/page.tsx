import posterManifest from "@/content/generated/posters.json";
import shots from "@/content/generated/screenshots.json";
import { AdminHead, Panel } from "@/components/admin/parts";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Screen Inspector & Flows" };

const FLOWS = [
  { name: "Capture", steps: ["Capture chip / tile / shortcut / share", "One line typed", "Classified: task · note · expense · event", "Saved on device", "Synced if signed in"] },
  { name: "Release", steps: ["Admin drops APK", "Checked in browser", "TUS upload → apk-releases", "Publish as latest", "Website live + app update check"] },
  { name: "Feedback", steps: ["App or /support", "user_feedback (pending)", "Admin triage + reply", "Reply in app and /account"] },
  { name: "Delete account", steps: ["App or /account/delete", "Type DELETE", "delete-account function", "Feedback + media + auth user removed", "Cascades to all user tables"] },
];

export default async function ScreensPage({ searchParams }: { searchParams: Promise<{ series?: string; theme?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const posters = posterManifest.posters.filter((p) => (!sp.series || p.series === sp.series) && (!sp.theme || p.theme === sp.theme));
  const series = [...new Set(posterManifest.posters.map((p) => p.series))];
  return (
    <>
      <AdminHead cap="Screen inspector & flows" title="Screen Inspector & Flows" lede="Every verified app screenshot and every generated poster, plus the main flows across app, web and backend." />
      <Panel cap={`Screenshots (${shots.count})`} wide>
        <div className="grid-auto" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
          {shots.entries.map((s) => (
            <figure key={s.file} style={{ margin: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.sources.webp[0]!.split(" ")[0]} alt={`${s.screen} ${s.view} ${s.theme}`} loading="lazy" style={{ borderRadius: 12, border: "1px solid var(--c-hairline)" }} />
              <figcaption className="t-label">
                {s.screen} · {s.view} · {s.theme}
                <br />
                <span className="muted">{s.file}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Panel>
      <Panel cap={`Posters (${posters.length})`} wide>
        <nav className="row">
          <a className="chip" href="/admin/screens">All</a>
          {series.map((s) => (
            <a key={s} className="chip" href={`/admin/screens?series=${s}`}>{s}</a>
          ))}
          <a className="chip" href={`/admin/screens?${sp.series ? `series=${sp.series}&` : ""}theme=light`}>Ivory</a>
          <a className="chip" href={`/admin/screens?${sp.series ? `series=${sp.series}&` : ""}theme=dark`}>OLED</a>
        </nav>
        <div className="grid-auto" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
          {posters.map((p) => (
            <a key={p.id} href={p.src} target="_blank" rel="noopener" style={{ textDecoration: "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={p.alt} loading="lazy" style={{ borderRadius: 8 }} />
              <span className="t-label">{p.id}</span>
            </a>
          ))}
        </div>
      </Panel>
      <Panel cap="Flows" wide>
        {FLOWS.map((f) => (
          <div key={f.name}>
            <p className="mono-cap" style={{ margin: "10px 0 6px" }}>{f.name}</p>
            <ol className="row" style={{ listStyle: "none", padding: 0, margin: 0, gap: 6 }}>
              {f.steps.map((s, i) => (
                <li key={s} className="chip">
                  {s}
                  {i < f.steps.length - 1 ? " →" : ""}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </Panel>
    </>
  );
}
