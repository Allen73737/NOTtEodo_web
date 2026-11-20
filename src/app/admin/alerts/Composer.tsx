"use client";

import { useState } from "react";
import { ActionForm } from "@/components/admin/ui";
import { saveAnnouncement } from "../actions";

/** Announcement composer with a live preview in Ivory and OLED, Cards and Editorial. */
export function Composer() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [cta, setCta] = useState("");
  return (
    <ActionForm action={saveAnnouncement} resetOnSuccess>
      <div className="form-grid">
        <label className="field">
          Title
          <input className="input" name="title" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="field">
          Severity
          <select className="input" name="severity" defaultValue="info">
            <option value="info">Info</option>
            <option value="notice">Notice</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </label>
        <label className="field">
          Show on
          <select className="input" name="target" defaultValue="both">
            <option value="both">Website and app</option>
            <option value="web">Website only</option>
            <option value="app">App only</option>
          </select>
        </label>
        <label className="field">
          Audience
          <select className="input" name="audience" defaultValue="all">
            <option value="all">Everyone</option>
            <option value="signed_in">Signed-in users</option>
          </select>
        </label>
        <label className="field">
          Starts (optional)
          <input className="input" type="datetime-local" name="starts_at" />
        </label>
        <label className="field">
          Ends (optional)
          <input className="input" type="datetime-local" name="ends_at" />
        </label>
        <label className="field">
          Button label
          <input className="input" name="cta_label" maxLength={40} value={cta} onChange={(e) => setCta(e.target.value)} />
        </label>
        <label className="field">
          Button link (https:// or /path)
          <input className="input" name="cta_url" pattern="(https://.+|/[^/].*|/)" />
        </label>
      </div>
      <label className="field">
        Message
        <textarea className="input" name="body_md" rows={3} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <label className="check">
        <input type="checkbox" name="is_active" defaultChecked /> Active
      </label>
      <div className="preview-grid" aria-label="Preview">
        {(["light", "dark"] as const).flatMap((mode) =>
          (["cards", "editorial"] as const).map((view) => (
            <div key={mode + view} className="preview" data-mode={mode} data-view={view}>
              <p className="mono-cap" style={{ margin: "0 0 6px", opacity: 0.6 }}>
                {mode === "light" ? "Ivory" : "OLED"} · {view}
              </p>
              <strong style={{ fontFamily: view === "editorial" ? "var(--font-display)" : undefined }}>{title || "Title"}</strong>
              <p style={{ margin: "4px 0 0", fontSize: "0.9rem" }}>{body || "Message"}</p>
              {cta && <p style={{ margin: "6px 0 0", fontWeight: 600, color: mode === "light" ? "#7A1F2B" : "#D0485A" }}>{cta} →</p>}
            </div>
          )),
        )}
      </div>
      <button className="btn">Publish announcement</button>
    </ActionForm>
  );
}
