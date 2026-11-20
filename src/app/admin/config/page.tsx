import { AdminHead, Panel } from "@/components/admin/parts";
import { requireAdmin } from "@/lib/admin";
import { DEFAULT_CONFIG } from "@/lib/platform";
import { ConfigEditor } from "./ConfigEditor";
import { QuickSwitches } from "./QuickSwitches";

export const metadata = { title: "Platform Config" };

const HELP: Record<string, string> = {
  play_live: "true once the Play listing is public: every Play button becomes a live link, APK becomes secondary.",
  nodo_cloud_opt_in: "true once the app asks before cloud Nodo; the privacy policy wording follows.",
  groq_zdr: "true once zero data retention is on in the Groq console.",
  maintenance: "Banner on the website and in the app. Needs a recent sign-in.",
  min_supported_version_code: "Below this, the app shows Update required.",
  latest_version_code: "Set automatically when a stable release is marked latest.",
  urls: "Links the app opens for privacy, terms, deletion, support and help. Needs a recent sign-in.",
  flags: "Website features: release emails, testimonials, roadmap.",
  hero: "Homepage eyebrow and headline.",
  ai: "Kill switch for cloud Nodo.",
  posters: "Poster id per website section, e.g. { \"features\": \"cover-notes-notes-light\" }.",
};

export default async function ConfigPage() {
  const { sb } = await requireAdmin();
  const { data } = await sb.from("platform_config").select("key,value,updated_at").order("key");
  const stored = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  const keys = [...new Set([...Object.keys(HELP), ...Object.keys(stored)])];
  return (
    <>
      <AdminHead
        cap="Platform config"
        title="Platform Config"
        lede="One table read by the website and the app. Every change is validated, shown as a diff, audited and pushed live over Realtime."
      />
      <QuickSwitches playLive={Boolean(stored.play_live ?? false)} maintenance={(stored.maintenance as { on: boolean; message: string }) ?? DEFAULT_CONFIG.maintenance} />
      <div className="metrics">
        {keys.map((k) => (
          <Panel key={k} cap={k}>
            <p className="t-label" style={{ margin: 0 }}>{HELP[k] ?? ""}</p>
            <ConfigEditor k={k} initial={stored[k] ?? (DEFAULT_CONFIG as unknown as Record<string, unknown>)[k] ?? {}} />
          </Panel>
        ))}
      </div>
    </>
  );
}
