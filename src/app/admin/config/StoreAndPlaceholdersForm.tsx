"use client";

import { ExternalLink, Check, RotateCcw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveStoreAndPlaceholders } from "../actions";

export type StoreAndPlaceholdersProps = {
  initial: {
    playStoreUrl: string;
    playLive: boolean;
    minSupportedVersionCode: number;
    latestVersionCode: number;
    developer: string;
    supportEmail: string;
    privacyEmail: string;
    grievanceOfficer: string;
    grievanceEmail: string;
    address: string;
    country: string;
    domain: string;
    securityContact: string;
  };
};

export function StoreAndPlaceholdersForm({ initial }: StoreAndPlaceholdersProps) {
  const [state, setState] = useState(initial);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const isDirty = JSON.stringify(state) !== JSON.stringify(initial);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveStoreAndPlaceholders(state);
      if (res.ok) {
        toast.success(res.message ?? "Updated successfully!");
        router.refresh();
      } else {
        toast.error(res.message ?? "Failed to save.");
      }
    });
  };

  const handleReset = () => {
    setState(initial);
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      {/* 1. App Distribution & Google Play */}
      <section className="card panel">
        <header className="panel__head">
          <div className="panel__title">
            <h2 className="mono-cap">Google Play & app versioning</h2>
            <p className="panel__note">
              Where people download the app, whether Google Play buttons are live, and the minimum app version.
            </p>
          </div>
          <span className="pill-state" data-on={state.playLive}>
            {state.playLive ? "Play Store Live" : "Early Access / APK Mode"}
          </span>
        </header>

        <div className="stack" style={{ gap: 16 }}>
          <label className="field">
            <span>Google Play Store URL</span>
            <div className="admin-form__inline">
              <input
                type="url"
                className="input"
                value={state.playStoreUrl}
                onChange={(e) => setState({ ...state, playStoreUrl: e.target.value })}
                placeholder="https://play.google.com/store/apps/details?id=com.notteodo.notteodo"
                required
              />
              {state.playStoreUrl && (
                <a
                  href={state.playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost admin-form__icon"
                  title="Test Google Play Link"
                  aria-label="Open the Google Play link"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
            <span className="muted" style={{ fontSize: "0.8rem" }}>
              Used everywhere on the site (download buttons, CTAs, footer links) when Play is live.
            </span>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            <label className="admin-form__toggle">
              <div className="admin-form__inline">
                <div>
                  <span style={{ fontWeight: 600 }}>Google Play is Live</span>
                  <p className="muted" style={{ margin: "2px 0 0", fontSize: "0.8rem" }}>
                    Switches all download buttons across the site from APK early-access to Google Play.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={state.playLive}
                  onChange={(e) => setState({ ...state, playLive: e.target.checked })}
                  style={{ width: 20, height: 20, accentColor: "var(--c-accent)", cursor: "pointer" }}
                />
              </div>
            </label>

            <label className="field">
              <span>Minimum Supported App Version (versionCode)</span>
              <input
                type="number"
                min={1}
                className="input"
                value={state.minSupportedVersionCode}
                onChange={(e) => setState({ ...state, minSupportedVersionCode: parseInt(e.target.value, 10) || 1 })}
                required
              />
              <span className="muted" style={{ fontSize: "0.8rem" }}>
                Mobile apps running below this version will prompt the user to update. Latest active code is {state.latestVersionCode}.
              </span>
            </label>
          </div>
        </div>
      </section>

      {/* 2. Identity, Support & Legal Placeholders */}
      <section className="card panel">
        <header className="panel__head">
          <div className="panel__title">
            <h2 className="mono-cap">Owner, support & compliance</h2>
            <p className="panel__note">
              Fills in the Terms, Privacy Policy, Child Safety, Support and security.txt pages.
            </p>
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          <label className="field">
            <span>Developer / Studio Name</span>
            <input
              type="text"
              className="input"
              value={state.developer}
              onChange={(e) => setState({ ...state, developer: e.target.value })}
              placeholder="e.g. Allen Francis"
              required
            />
          </label>

          <label className="field">
            <span>Official Domain</span>
            <input
              type="text"
              className="input"
              value={state.domain}
              onChange={(e) => setState({ ...state, domain: e.target.value })}
              placeholder="notteodo.com"
              required
            />
          </label>

          <label className="field">
            <span>Public Support Email</span>
            <input
              type="email"
              className="input"
              value={state.supportEmail}
              onChange={(e) => setState({ ...state, supportEmail: e.target.value })}
              placeholder="support@notteodo.com"
              required
            />
          </label>

          <label className="field">
            <span>Privacy Inquiries Email</span>
            <input
              type="email"
              className="input"
              value={state.privacyEmail}
              onChange={(e) => setState({ ...state, privacyEmail: e.target.value })}
              placeholder="privacy@notteodo.com"
              required
            />
          </label>

          <label className="field">
            <span>Grievance Officer Name (India Law)</span>
            <input
              type="text"
              className="input"
              value={state.grievanceOfficer}
              onChange={(e) => setState({ ...state, grievanceOfficer: e.target.value })}
              placeholder="Grievance Officer Name"
              required
            />
          </label>

          <label className="field">
            <span>Grievance Officer Email</span>
            <input
              type="email"
              className="input"
              value={state.grievanceEmail}
              onChange={(e) => setState({ ...state, grievanceEmail: e.target.value })}
              placeholder="grievance@notteodo.com"
              required
            />
          </label>

          <label className="field">
            <span>Security Vulnerability Contact</span>
            <input
              type="email"
              className="input"
              value={state.securityContact}
              onChange={(e) => setState({ ...state, securityContact: e.target.value })}
              placeholder="security@notteodo.com"
              required
            />
          </label>

          <label className="field">
            <span>Country of Jurisdiction</span>
            <input
              type="text"
              className="input"
              value={state.country}
              onChange={(e) => setState({ ...state, country: e.target.value })}
              placeholder="India"
              required
            />
          </label>
        </div>

        <label className="field">
          <span>Official Postal Address</span>
          <textarea
            className="input"
            rows={2}
            value={state.address}
            onChange={(e) => setState({ ...state, address: e.target.value })}
            placeholder="Official postal address for legal notices"
            required
          />
        </label>
      </section>

      {/* Action Bar */}
      <div className="card admin-form__bar">
        <div className="row" style={{ gap: 8, alignItems: "center" }}>
          {isDirty ? (
            <span className="mono-cap" style={{ color: "var(--c-accent)" }}>
              Unsaved changes
            </span>
          ) : (
            <span className="row muted" style={{ gap: 6, fontSize: "0.85rem" }}>
              <Check size={16} /> All settings saved and synced live
            </span>
          )}
        </div>
        <div className="row" style={{ gap: 10 }}>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={handleReset}
            disabled={!isDirty || pending}
          >
            <RotateCcw size={15} /> Reset
          </button>
          <button
            type="submit"
            className="btn"
            disabled={!isDirty || pending}
          >
            <Save size={15} /> {pending ? "Saving..." : "Save Store & Placeholders"}
          </button>
        </div>
      </div>
    </form>
  );
}
