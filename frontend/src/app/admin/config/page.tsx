import { AdminHead, Panel, Panels } from "@/components/admin/parts";
import { requireAdmin } from "@/lib/admin";
import { DEFAULT_CONFIG, type IdentityConfig } from "@/lib/platform";
import { ConfigEditor } from "./ConfigEditor";
import { QuickSwitches } from "./QuickSwitches";
import { StoreAndPlaceholdersForm } from "./StoreAndPlaceholdersForm";

export const metadata = { title: "Platform Config" };

const HELP: Record<string, string> = {
  play_live:
    "true once the Play listing is public: every Play button becomes a live link, APK becomes secondary.",
  nodo_cloud_opt_in: "true once the app asks before cloud Nodo; the privacy policy wording follows.",
  groq_zdr: "true once zero data retention is on in the Groq console.",
  maintenance: "Banner on the website and in the app. Needs a recent sign-in.",
  min_supported_version_code: "Below this, the app shows Update required.",
  latest_version_code: "Set automatically when a stable release is marked latest.",
  urls: "Links the app opens for privacy, terms, deletion, support and help. Needs a recent sign-in.",
  flags: "Website features: release emails, testimonials, roadmap.",
  hero: "Homepage eyebrow and headline.",
  ai: "Kill switch for cloud Nodo.",
  posters: 'Poster id per website section, e.g. { "features": "cover-notes-notes-light" }.',
  identity: "Legal disclosures, grievance officer, contact emails and developer entity.",
};

export default async function ConfigPage() {
  const { sb } = await requireAdmin();
  const { data } = await sb.from("platform_config").select("key,value,updated_at").order("key");
  const stored = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  const keys = [...new Set([...Object.keys(HELP), ...Object.keys(stored)])];

  const currentUrls = (stored.urls as Record<string, string>) ?? DEFAULT_CONFIG.urls;
  const currentIdentity = (stored.identity as IdentityConfig) ?? DEFAULT_CONFIG.identity;

  return (
    <>
      <AdminHead
        cap="Platform config"
        title="Platform & Store Config"
        lede="Configure your Google Play Store listing, APK distribution, legal placeholders and system switches. Every change is audited and synced live across the website and app."
      />

      <QuickSwitches
        playLive={Boolean(stored.play_live ?? false)}
        maintenance={(stored.maintenance as { on: boolean; message: string }) ?? DEFAULT_CONFIG.maintenance}
      />

      {/* Visual, User-Friendly Store & Identity Editor */}
      <StoreAndPlaceholdersForm
        initial={{
          playStoreUrl: currentUrls.play ?? DEFAULT_CONFIG.urls.play,
          playLive: Boolean(stored.play_live ?? false),
          minSupportedVersionCode: Number(
            stored.min_supported_version_code ?? DEFAULT_CONFIG.min_supported_version_code,
          ),
          latestVersionCode: Number(stored.latest_version_code ?? DEFAULT_CONFIG.latest_version_code),
          developer: currentIdentity.developer ?? DEFAULT_CONFIG.identity.developer,
          supportEmail: currentIdentity.supportEmail ?? DEFAULT_CONFIG.identity.supportEmail,
          privacyEmail: currentIdentity.privacyEmail ?? DEFAULT_CONFIG.identity.privacyEmail,
          grievanceOfficer: currentIdentity.grievanceOfficer ?? DEFAULT_CONFIG.identity.grievanceOfficer,
          grievanceEmail: currentIdentity.grievanceEmail ?? DEFAULT_CONFIG.identity.grievanceEmail,
          address: currentIdentity.address ?? DEFAULT_CONFIG.identity.address,
          country: currentIdentity.country ?? DEFAULT_CONFIG.identity.country,
          domain: currentIdentity.domain ?? DEFAULT_CONFIG.identity.domain,
          securityContact: currentIdentity.securityContact ?? DEFAULT_CONFIG.identity.securityContact,
        }}
      />

      {/* Developer Raw JSON Inspection Mode */}
      <details className="card panel admin-advanced">
        <summary className="mono-cap">Advanced: raw JSON keys & overrides ({keys.length} keys)</summary>
        <p className="panel__note">Direct database view for low-level configuration overrides.</p>
        <Panels>
          {keys.map((k) => (
            <Panel key={k} cap={k} note={HELP[k]}>
              <ConfigEditor
                k={k}
                initial={stored[k] ?? (DEFAULT_CONFIG as unknown as Record<string, unknown>)[k] ?? {}}
              />
            </Panel>
          ))}
        </Panels>
      </details>
    </>
  );
}
