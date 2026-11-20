import { LEGAL_META } from "@/components/legal/LegalPage";
import { AdminHead, Panel } from "@/components/admin/parts";
import { ActionForm } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { publishLegal } from "../actions";

export const metadata = { title: "Legal Versions" };

export default async function LegalAdmin() {
  const { sb } = await requireAdmin();
  const { data } = await sb.from("legal_documents").select("*").order("published_at", { ascending: false });
  const docs = Object.keys(LEGAL_META);
  return (
    <>
      <AdminHead
        cap="Legal versions"
        title="Legal Versions"
        lede="Edit the page text in the codebase and deploy, then publish its version here. The hash of the live page is recorded, and the app shows “our privacy policy was updated” when the privacy version changes."
      />
      <Panel cap="Publish a new version" wide>
        <ActionForm action={publishLegal} resetOnSuccess>
          <div className="form-grid">
            <label className="field">
              Document
              <select className="input" name="doc">
                {docs.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label className="field">
              Version
              <input className="input t-num" name="version" placeholder="1.1" pattern="\d+\.\d+" required />
            </label>
            <label className="field">
              Effective date
              <input className="input" type="date" name="effective_date" required />
            </label>
          </div>
          <label className="field">
            Summary of changes (shown in the change log)
            <textarea className="input" name="summary_of_changes" rows={3} required />
          </label>
          <button className="btn">Publish version</button>
        </ActionForm>
      </Panel>
      <Panel cap="History" wide>
        <table className="tbl">
          <thead>
            <tr><th>Document</th><th>Version</th><th>Effective</th><th>Content SHA-256</th><th>Changes</th></tr>
          </thead>
          <tbody>
            {(data ?? []).map((d) => (
              <tr key={d.id}>
                <td>{d.doc}</td>
                <td className="t-num">{d.version}</td>
                <td>{formatDate(d.effective_date)}</td>
                <td className="t-num" style={{ fontSize: "0.72rem" }}>{String(d.content_sha256).slice(0, 16)}…</td>
                <td>{d.summary_of_changes}</td>
              </tr>
            ))}
            {docs.map((d) => (
              <tr key={`built-in-${d}`}>
                <td>{d}</td>
                <td className="t-num">{LEGAL_META[d as keyof typeof LEGAL_META].version}</td>
                <td>{formatDate(LEGAL_META[d as keyof typeof LEGAL_META].effective)}</td>
                <td className="muted">built in</td>
                <td className="muted">Initial version shipped with the site</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
