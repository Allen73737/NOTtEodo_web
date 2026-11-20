import type { Metadata } from "next";
import Link from "next/link";
import { Table } from "@/components/legal/LegalPage";
import { PageHeader } from "@/components/site/PageHeader";
import { IDENTITY } from "@/content/identity";
import { GITHUB_URL } from "@/content/site";

export const metadata: Metadata = {
  title: "Security",
  description: "How NOTtEodo protects your data: on-device AES-256-GCM, Android Keystore, optional end-to-end passphrase, row-level security and an audit trail.",
  alternates: { canonical: "/security" },
  openGraph: { images: ["/posters/og/og-privacy-light.png"] },
};

export default function SecurityPage() {
  return (
    <>
      <PageHeader
        eyebrow="Security"
        title="Locked on your phone. Locked in the cloud."
        italic={["Locked"]}
        lede="The plain-English version first, then the technical details for those who want them."
      />
      <section className="prose-wrap legal__body">
        <div className="legal__section">
          <h2 className="t-h2">In plain English</h2>
          <ul>
            <li>Everything you write is encrypted on your phone. The key never leaves the phone&rsquo;s secure hardware.</li>
            <li>An app PIN or fingerprint can lock the app and the Vault. Guessing the PIN is deliberately slow.</li>
            <li>An account is optional. If you sync, each account can only ever read its own data.</li>
            <li>Add an encryption passphrase and your synced data is encrypted before it leaves the phone; we can&rsquo;t read it.</li>
            <li>No ads, no analytics SDKs, no plain-HTTP connections, and the app is never included in Android backups.</li>
          </ul>
        </div>
        <div className="legal__section">
          <h2 className="t-h2">Technical details</h2>
          <Table
            head={["Layer", "How"]}
            rows={[
              ["On-device storage", "Each value AES-256-GCM with a random 256-bit data key; the storage slot is the AAD, so ciphertexts can't be swapped between slots"],
              ["Key protection", "Data key wrapped by an Android Keystore key; with a PIN, also wrapped by PBKDF2-HMAC-SHA256(PIN, 600,000 iterations)"],
              ["Backups", "android:allowBackup=false; exported backups are encrypted with a password you choose"],
              ["Transport", "HTTPS only (usesCleartextTraffic=false)"],
              ["End-to-end sync", "Optional passphrase → PBKDF2-HMAC-SHA256 (600k) → AES-256-GCM; the server stores only a wrapped key and refuses plaintext once a key exists"],
              ["Access control", "Postgres row-level security on every table; accounts with two-step verification need an AAL2 session to touch their data"],
              ["Passwords", "Minimum 10 characters, common-password blocklist, and a Have I Been Pwned k-anonymity check (only a 5-character hash prefix is sent)"],
              ["Server secrets", "AI provider and media keys live in edge functions; the app never holds them"],
              ["Abuse limits", "Per-user rate limits on AI, account deletion, vault events and feedback; a daily AI allowance"],
              ["Audit", "Security events (sign-ins, vault unlocks, rate limits) kept 365 days; every admin change is recorded with a field-level diff"],
              ["Media", "Photos and voice notes stored per account; location metadata stripped on upload"],
              ["Website", "Strict CSP with per-request nonces on signed-in pages, HSTS, frame-ancestors none, no third-party scripts"],
            ]}
          />
        </div>
        <div className="legal__section">
          <h2 className="t-h2">Report a vulnerability</h2>
          <p>
            Please report privately through <a href={`${GITHUB_URL}/security/advisories/new`}>GitHub Security Advisories</a> or{" "}
            <a href={`mailto:${IDENTITY.securityContact}`}>{IDENTITY.securityContact}</a>. We aim to acknowledge within 72 hours and fix
            confirmed high-severity issues within 14 days. See also <a href="/.well-known/security.txt">security.txt</a> and the{" "}
            <Link href="/privacy">privacy policy</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
