import { AdminHead, Empty, Panel } from "@/components/admin/parts";
import { ActionButton, ActionForm } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { deleteCmsRow, saveCmsRow } from "../actions";
import { ConfigEditor } from "../config/ConfigEditor";

export const metadata = { title: "Website CMS" };

export default async function CmsPage() {
  const { sb } = await requireAdmin();
  const [{ data: faq }, { data: roadmap }, { data: testimonials }, { data: cfg }] = await Promise.all([
    sb.from("faq_overrides").select("*").order("sort"),
    sb.from("roadmap_items").select("*").order("sort"),
    sb.from("testimonials").select("*").order("updated_at", { ascending: false }),
    sb.from("platform_config").select("key,value").in("key", ["hero", "posters", "flags"]),
  ]);
  const conf = Object.fromEntries((cfg ?? []).map((r) => [r.key, r.value]));
  return (
    <>
      <AdminHead cap="Website CMS" title="Website CMS" lede="Hero copy, FAQ additions, roadmap, testimonials (with consent records) and poster choices per section." />
      <div className="metrics">
        <Panel cap="Hero copy">
          <ConfigEditor k="hero" initial={conf.hero ?? { eyebrow: "Notes. Tasks. Life.", headline: "Curate your everyday.", sub: "" }} />
        </Panel>
        <Panel cap="Section features">
          <ConfigEditor k="flags" initial={conf.flags ?? { release_emails: true, testimonials: false, roadmap: false }} />
        </Panel>
        <Panel cap="Poster per section">
          <ConfigEditor k="posters" initial={conf.posters ?? {}} />
        </Panel>
      </div>

      <Panel cap="FAQ additions" wide>
        <ActionForm action={saveCmsRow.bind(null, "faq_overrides")} resetOnSuccess>
          <div className="form-grid">
            <label className="field">Question<input className="input" name="question" required /></label>
            <label className="field">Help section (optional)<input className="input" name="section" placeholder="e.g. backup" /></label>
            <label className="field">Order<input className="input" name="sort" type="number" defaultValue={100} /></label>
          </div>
          <label className="field">Answer<textarea className="input" name="answer_md" rows={3} required /></label>
          <label className="check"><input type="checkbox" name="is_published" defaultChecked /> Published</label>
          <button className="btn">Add FAQ</button>
        </ActionForm>
        {faq?.length ? faq.map((f) => (
          <div key={f.id} className="row" style={{ justifyContent: "space-between", borderTop: "1px solid var(--c-divider)", paddingTop: 10 }}>
            <span><strong>{f.question}</strong> <span className="muted">{f.is_published ? "" : "(hidden)"}</span></span>
            <ActionButton className="btn btn-quiet" action={deleteCmsRow.bind(null, "faq_overrides", f.id)} confirm="Delete this FAQ?">Delete</ActionButton>
          </div>
        )) : <Empty>No additions. The FAQ is generated from the app guide.</Empty>}
      </Panel>

      <Panel cap="Roadmap (only real plans)" wide>
        <ActionForm action={saveCmsRow.bind(null, "roadmap_items")} resetOnSuccess>
          <div className="form-grid">
            <label className="field">Title<input className="input" name="title" required /></label>
            <label className="field">Status
              <select className="input" name="status" defaultValue="exploring">
                <option value="exploring">Exploring</option><option value="planned">Planned</option><option value="building">Building</option><option value="shipped">Shipped</option>
              </select>
            </label>
            <label className="field">Order<input className="input" name="sort" type="number" defaultValue={100} /></label>
          </div>
          <label className="field">Detail<textarea className="input" name="body" rows={2} /></label>
          <label className="check"><input type="checkbox" name="is_published" /> Published</label>
          <button className="btn">Add item</button>
        </ActionForm>
        {roadmap?.length ? roadmap.map((r) => (
          <div key={r.id} className="row" style={{ justifyContent: "space-between", borderTop: "1px solid var(--c-divider)", paddingTop: 10 }}>
            <span><strong>{r.title}</strong> · {r.status} <span className="muted">{r.is_published ? "" : "(hidden)"}</span></span>
            <ActionButton className="btn btn-quiet" action={deleteCmsRow.bind(null, "roadmap_items", r.id)} confirm="Delete this item?">Delete</ActionButton>
          </div>
        )) : <Empty>The roadmap page stays hidden until there is at least one published item and the roadmap flag is on.</Empty>}
      </Panel>

      <Panel cap="Testimonials (real people, with consent)" wide>
        <ActionForm action={saveCmsRow.bind(null, "testimonials")} resetOnSuccess>
          <div className="form-grid">
            <label className="field">Name<input className="input" name="name" required /></label>
            <label className="field">Handle (optional)<input className="input" name="handle" /></label>
            <label className="field">Where it was said<input className="input" name="source" required placeholder="e.g. email to support, 3 Dec" /></label>
            <label className="field">Consent given on<input className="input" type="date" name="consent_at" /></label>
          </div>
          <label className="field">Quote (their exact words)<textarea className="input" name="quote" rows={3} required /></label>
          <label className="field">Consent record<input className="input" name="consent_note" placeholder="How they agreed to be quoted" /></label>
          <label className="check"><input type="checkbox" name="is_published" /> Published (requires a consent date)</label>
          <button className="btn">Add testimonial</button>
        </ActionForm>
        {testimonials?.length ? testimonials.map((t) => (
          <div key={t.id} className="row" style={{ justifyContent: "space-between", borderTop: "1px solid var(--c-divider)", paddingTop: 10 }}>
            <span>&ldquo;{t.quote}&rdquo; · {t.name} <span className="muted">{t.consent_at ? `consent ${formatDate(t.consent_at)}` : "no consent"} {t.is_published ? "" : "(hidden)"}</span></span>
            <ActionButton className="btn btn-quiet" action={deleteCmsRow.bind(null, "testimonials", t.id)} confirm="Delete this testimonial?">Delete</ActionButton>
          </div>
        )) : <Empty>None yet. The section stays hidden on the website until one is published.</Empty>}
      </Panel>
    </>
  );
}
