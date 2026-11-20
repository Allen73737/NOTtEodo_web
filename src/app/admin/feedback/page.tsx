import Link from "next/link";
import { AdminHead, Empty, Metric } from "@/components/admin/parts";
import { ActionButton, ActionForm } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import type { Feedback } from "@/lib/db/types";
import { formatDate } from "@/lib/format";
import { deleteFeedback, updateFeedback } from "../actions";

export const metadata = { title: "User Voice" };

const STATUSES = ["pending", "reviewed", "planned", "resolved"] as const;
const TYPES = ["bug_report", "feature_suggestion", "ui_enhancement", "general_feedback"] as const;

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ status?: string; type?: string }> }) {
  const sp = await searchParams;
  const { sb } = await requireAdmin();
  let q = sb.from("user_feedback").select("*").order("created_at", { ascending: false }).limit(100);
  if (sp.status && (STATUSES as readonly string[]).includes(sp.status)) q = q.eq("status", sp.status);
  if (sp.type && (TYPES as readonly string[]).includes(sp.type)) q = q.eq("type", sp.type);
  const [{ data }, ...counts] = await Promise.all([
    q,
    ...STATUSES.map((s) => sb.from("user_feedback").select("id", { count: "exact", head: true }).eq("status", s)),
  ]);
  const items = (data ?? []) as Feedback[];
  return (
    <>
      <AdminHead cap="User voice & feature suggestions" title="User Voice" lede="Replies appear to the author in the app and on their web account page." />
      <div className="metrics">
        <Metric label="Pending triage" value={counts[0]?.count ?? 0} />
        <Metric label="Reviewed" value={counts[1]?.count ?? 0} />
        <Metric label="Roadmap planned" value={counts[2]?.count ?? 0} />
        <Metric label="Completed / resolved" value={counts[3]?.count ?? 0} />
      </div>
      <nav className="row" aria-label="Filter">
        <Link className="chip" href="/admin/feedback">All</Link>
        {STATUSES.map((s) => (
          <Link key={s} className="chip" href={`/admin/feedback?status=${s}`} aria-current={sp.status === s ? "page" : undefined}>
            {s}
          </Link>
        ))}
        {TYPES.map((t) => (
          <Link key={t} className="chip" href={`/admin/feedback?type=${t}`}>
            {t.replace("_", " ")}
          </Link>
        ))}
      </nav>
      {items.length === 0 ? (
        <Empty>Nothing here.</Empty>
      ) : (
        items.map((f) => (
          <article key={f.id} className="card pad stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{f.title}</strong>
              <span className="t-label">
                {f.type.replace("_", " ")} · {f.impact.replace("_", " ")} · {f.source ?? "app"} · {formatDate(f.created_at)}
              </span>
            </div>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{f.description}</p>
            <p className="t-label" style={{ margin: 0 }}>
              {f.user_identifier} {f.user_email ? `· ${f.user_email}` : ""} {f.device_info ? `· ${f.device_info}` : ""}
            </p>
            <ActionForm action={updateFeedback}>
              <input type="hidden" name="id" value={f.id} />
              <div className="form-grid">
                <label className="field">
                  Status
                  <select className="input" name="status" defaultValue={f.status}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Private notes
                  <input className="input" name="admin_notes" defaultValue={f.admin_notes ?? ""} />
                </label>
              </div>
              <label className="field">
                Reply (visible to the author)
                <textarea className="input" name="admin_reply" rows={2} defaultValue={f.admin_reply ?? ""} />
              </label>
              <div className="row">
                <button className="btn">Save</button>
                <ActionButton className="btn btn-quiet" confirm="Delete this feedback permanently?" action={deleteFeedback.bind(null, f.id)}>
                  Delete
                </ActionButton>
              </div>
            </ActionForm>
          </article>
        ))
      )}
    </>
  );
}
