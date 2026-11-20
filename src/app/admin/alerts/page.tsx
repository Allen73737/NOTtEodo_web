import { AdminHead, Empty, Panel } from "@/components/admin/parts";
import { ActionButton } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import type { Announcement, AuditRow } from "@/lib/db/types";
import { formatDate } from "@/lib/format";
import { deleteAnnouncement, testEmail } from "../actions";
import { Composer } from "./Composer";

export const metadata = { title: "Alerts & Logs" };

export default async function AlertsPage() {
  const { sb } = await requireAdmin();
  const [{ data: anns }, { data: audit }] = await Promise.all([
    sb.from("announcements").select("*").order("created_at", { ascending: false }).limit(50),
    sb.from("admin_audit_log").select("*").order("at", { ascending: false }).limit(100),
  ]);
  return (
    <>
      <AdminHead cap="In-app announcement banner" title="Alerts & Logs" lede="Announcements go to the website, the app or both, on a schedule. Every admin change below is in the audit ledger." />
      <div className="metrics">
        <Panel cap="Compose" wide>
          <Composer />
        </Panel>
        <Panel cap="Announcements" wide>
          {anns?.length ? (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Target</th>
                    <th>Window</th>
                    <th>State</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {(anns as Announcement[]).map((a) => (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.title}</strong>
                        <br />
                        <span className="muted">{a.body_md}</span>
                      </td>
                      <td>{a.target}</td>
                      <td>
                        {a.starts_at ? formatDate(a.starts_at) : "now"} → {a.ends_at ? formatDate(a.ends_at) : "open"}
                      </td>
                      <td>
                        <span className="pill-state" data-on={a.is_active}>{a.is_active ? a.severity : "off"}</span>
                      </td>
                      <td>
                        <ActionButton className="btn btn-quiet" confirm="Delete this announcement?" action={deleteAnnouncement.bind(null, a.id)}>
                          Delete
                        </ActionButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>No announcements.</Empty>
          )}
        </Panel>
        <Panel cap="Audit ledger" wide>
          {audit?.length ? (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Who</th>
                    <th>What</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {(audit as AuditRow[]).map((r) => (
                    <tr key={r.id}>
                      <td className="t-num">{new Date(r.at).toLocaleString("en-IN")}</td>
                      <td className="t-num">{r.actor ? r.actor.slice(0, 8) : "system"}</td>
                      <td>
                        {r.op} {r.table_name} <span className="muted">{r.row_pk}</span>
                      </td>
                      <td>
                        <code style={{ fontSize: "0.72rem", wordBreak: "break-all" }}>{JSON.stringify(r.diff).slice(0, 220)}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>Nothing logged yet.</Empty>
          )}
        </Panel>
        <Panel cap="Email">
          <p className="muted" style={{ margin: 0 }}>Send yourself a test through Resend.</p>
          <ActionButton action={testEmail}>Send test email</ActionButton>
        </Panel>
      </div>
    </>
  );
}
