import { AdminHead, Empty } from "@/components/admin/parts";
import { ActionForm } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import type { NodoInsight } from "@/lib/db/types";
import { reviewInsight } from "../actions";

export const metadata = { title: "Nodo Learning" };

/** nodo_app_insights: de-personalised questions about using the app. Approved answers reach everyone. */
export default async function NodoPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const { sb } = await requireAdmin();
  const status = ["candidate", "approved", "rejected"].includes(sp.status ?? "") ? sp.status! : "candidate";
  const { data } = await sb.from("nodo_app_insights").select("*").eq("status", status).order("hits", { ascending: false }).limit(100);
  const items = (data ?? []) as NodoInsight[];
  return (
    <>
      <AdminHead
        cap="Nodo learning"
        title="Nodo Learning"
        lede="What people commonly ask about using NOTtEodo. These rows hold no account ID or personal text. Approved answers feed Nodo for everyone and the web help search."
      />
      <nav className="row">
        {["candidate", "approved", "rejected"].map((s) => (
          <a key={s} className="chip" href={`/admin/nodo?status=${s}`} aria-current={s === status ? "page" : undefined}>{s}</a>
        ))}
      </nav>
      {items.length === 0 ? (
        <Empty>No {status} insights.</Empty>
      ) : (
        items.map((i) => (
          <article key={i.topic} className="card pad stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{i.question}</strong>
              <span className="t-label">{i.topic} · asked {i.hits}× · score {i.score}</span>
            </div>
            <ActionForm action={reviewInsight}>
              <input type="hidden" name="topic" value={i.topic} />
              <label className="field">
                Answer
                <textarea className="input" name="answer" rows={3} defaultValue={i.answer ?? ""} maxLength={1200} />
              </label>
              <div className="row">
                <button className="btn" name="status" value="approved">Approve</button>
                <button className="btn btn-ghost" name="status" value="rejected">Reject</button>
                <button className="btn btn-quiet" name="status" value="candidate">Keep as candidate</button>
              </div>
            </ActionForm>
          </article>
        ))
      )}
    </>
  );
}
