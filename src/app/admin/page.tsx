import Link from "next/link";
import { AdminHead, Line, Metric, Metrics, Panel, Panels } from "@/components/admin/parts";
import { requireAdmin } from "@/lib/admin";
import { formatBytes, formatDate } from "@/lib/format";
import { getConfig, getLatestRelease } from "@/lib/platform";

export const metadata = { title: "Overview" };

/** SYSTEM HEALTH & TELEMETRY: real aggregates from admin_table_counts(), never local data. */
export default async function Overview() {
  const { sb } = await requireAdmin();
  const [{ data: counts }, { data: storage }, cfg, release, { count: pending }] = await Promise.all([
    sb.rpc("admin_table_counts"),
    sb.rpc("admin_storage_usage"),
    getConfig(),
    getLatestRelease(),
    sb.from("user_feedback").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const c = (counts ?? {}) as Record<string, number>;
  const totalBytes = ((storage ?? []) as { bytes: number }[]).reduce((s, b) => s + Number(b.bytes), 0);
  return (
    <>
      <AdminHead
        cap="System health & telemetry"
        title="Overview"
        lede="Live counts from the database. Numbers are totals, never anyone's content."
      />
      <Metrics>
        <Metric
          label="Accounts"
          value={c.accounts ?? 0}
          sub={`${c.synced_accounts ?? 0} syncing · ${c.e2ee_accounts ?? 0} with E2E passphrase`}
        />
        <Metric
          label="Total records"
          value={c.user_collections ?? 0}
          sub="synced collections (one per module per account)"
        />
        <Metric
          label="User voice & ideas"
          value={c.user_feedback ?? 0}
          sub={<Link href="/admin/feedback">{pending ?? 0} pending triage</Link>}
        />
        <Metric label="Nodo today" value={c.ai_requests_today ?? 0} sub="cloud requests (all accounts)" />
        <Metric
          label="Nodo memories"
          value={c.nodo_memories ?? 0}
          sub={`${c.nodo_app_insights ?? 0} app insights to review`}
        />
        <Metric
          label="Storage"
          value={formatBytes(totalBytes) || "0 KB"}
          sub={`${((storage ?? []) as unknown[]).length} buckets`}
        />
        <Metric label="Admins" value={c.app_admins ?? 0} sub={<Link href="/admin/users">manage</Link>} />
        <Metric
          label="Audit ledger"
          value={c.admin_audit_log ?? 0}
          sub={`${c.security_audit_logs ?? 0} security events`}
        />
      </Metrics>
      <Panels>
        <Panel cap="System status" actions={<Link href="/admin/config">Platform config</Link>}>
          <Line
            end={
              <span className="pill-state" data-on={cfg.maintenance.on}>
                {cfg.maintenance.on ? "On" : "Off"}
              </span>
            }
          >
            Maintenance
          </Line>
          <Line
            end={
              <span className="pill-state" data-on={cfg.play_live}>
                {cfg.play_live ? "Live" : "Coming soon"}
              </span>
            }
          >
            Google Play
          </Line>
          <Line
            end={
              <span className="pill-state" data-on={cfg.nodo_cloud_opt_in}>
                {cfg.nodo_cloud_opt_in ? "Yes" : "No"}
              </span>
            }
          >
            Cloud Nodo opt-in shipped
          </Line>
        </Panel>
        <Panel cap="Latest release" actions={<Link href="/admin/releases">Releases & APK</Link>}>
          {release ? (
            <>
              <p className="t-h3" style={{ margin: 0 }}>
                {release.version_name}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                {formatDate(release.published_at)} · {release.download_count} downloads
              </p>
            </>
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              No published release.
            </p>
          )}
        </Panel>
        <Panel cap="Subscribers">
          <p className="metric__value" style={{ margin: 0 }}>
            {c.release_subscribers ?? 0}
          </p>
          <p className="t-label" style={{ margin: 0 }}>
            email sign-ups (all states)
          </p>
        </Panel>
      </Panels>
    </>
  );
}
