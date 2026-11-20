import { AdminHead, Metric, Panel } from "@/components/admin/parts";
import { requireAdmin } from "@/lib/admin";
import { getConfig } from "@/lib/platform";
import { ConfigEditor } from "../config/ConfigEditor";

export const metadata = { title: "AI Engine" };

/** AI ENGINE & MODEL COMMAND. Model names stay server-side (ai-assist), so they're described, not read. */
export default async function AiPage() {
  const { sb } = await requireAdmin();
  const [{ data: counts }, cfg, { data: ai }] = await Promise.all([
    sb.rpc("admin_table_counts"),
    getConfig(),
    sb.from("platform_config").select("value").eq("key", "ai").maybeSingle(),
  ]);
  const c = (counts ?? {}) as Record<string, number>;
  return (
    <>
      <AdminHead
        cap="AI engine & model command"
        title="AI Engine"
        lede="Nodo's provider key, model order and daily allowance are edge-function secrets (GROQ_API_KEY, AI_MODELS, AI_FAST_MODEL, AI_DAILY_REQUESTS). The browser never sees them."
      />
      <div className="metrics">
        <Metric label="Requests today" value={c.ai_requests_today ?? 0} />
        <Metric label="Nodo memories" value={c.nodo_memories ?? 0} />
        <Metric label="Recent turns (30 days)" value={c.nodo_turns ?? 0} />
        <Metric label="Groq zero retention" value={cfg.groq_zdr ? "On" : "Off"} sub="Groq console → Data Controls" />
      </div>
      <Panel cap="Kill switch" wide>
        <p className="muted" style={{ margin: 0 }}>
          <code>ai.cloud_enabled = false</code> tells both clients to answer on the device only. The app honours it once the
          hand-off (APP_HANDOFF §3) ships; until then, unset the GROQ_API_KEY secret for an immediate server-side stop.
        </p>
        <ConfigEditor k="ai" initial={ai?.value ?? { cloud_enabled: true, note: "" }} />
      </Panel>
    </>
  );
}
