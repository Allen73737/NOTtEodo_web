import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { IDENTITY } from "@/content/identity";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms for using the NOTtEodo app and website.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      doc="terms"
      title="Terms of use"
      summary={
        <ul>
          <li>NOTtEodo is free to use today. If we ever add paid extras, we will tell you first, and you can keep what you made.</li>
          <li>Your notes, tasks and everything else you create stay yours.</li>
          <li>Keep your own backups: an app can fail, and an encryption passphrase we never see cannot be recovered.</li>
          <li>Nodo can be wrong. Don&rsquo;t rely on it for medical, legal or financial decisions.</li>
          <li>Indian law applies; we try to sort out problems by talking first.</li>
        </ul>
      }
      sections={[
        {
          id: "agreement",
          title: "These terms",
          body: (
            <p>
              These terms are an agreement between you and {IDENTITY.developer} ({IDENTITY.address}) for the NOTtEodo Android
              app and this website. By using them you accept these terms and our <Link href="/privacy">privacy policy</Link>.
              If you use NOTtEodo for an organisation, you confirm you may accept on its behalf.
            </p>
          ),
        },
        {
          id: "eligibility",
          title: "Who can use NOTtEodo",
          body: (
            <p>
              Anyone can use the app on their phone without an account. To create an account you must be 18 or older, or have
              the verifiable consent of a parent or lawful guardian.
            </p>
          ),
        },
        {
          id: "price",
          title: "Price",
          body: (
            <p>
              NOTtEodo is currently free, with no ads and no in-app purchases. We may introduce optional paid features in the
              future. If we do, we will announce it in advance, it will never take away access to data you have already created,
              and you can always export or delete your data.
            </p>
          ),
        },
        {
          id: "your-content",
          title: "Your content",
          body: (
            <p>
              You own what you create in NOTtEodo. You give us only the permission needed to store, sync, back up and process it
              to provide the features you use (for example sending a question to cloud Nodo when it is on). We do not use your
              content for advertising or to train AI models.
            </p>
          ),
        },
        {
          id: "account",
          title: "Your account and security",
          body: (
            <p>
              Keep your password and any encryption passphrase safe. We cannot recover end-to-end encrypted data if the
              passphrase is lost. Tell us promptly if you suspect someone else has used your account. You can delete your account
              at any time (<Link href="/delete-account">how</Link>).
            </p>
          ),
        },
        {
          id: "acceptable-use",
          title: "Acceptable use",
          body: (
            <>
              <p>Don&rsquo;t use NOTtEodo to:</p>
              <ul>
                <li>store or share child sexual abuse material or anything that exploits children (see <Link href="/child-safety">child safety</Link>);</li>
                <li>break the law, infringe others&rsquo; rights, or harass anyone;</li>
                <li>attack, overload, scrape or reverse-engineer our servers, or get around rate limits and security;</li>
                <li>try to make Nodo produce harmful content or reveal other people&rsquo;s data.</li>
              </ul>
              <p>We may suspend accounts that do, and report illegal content to the authorities.</p>
            </>
          ),
        },
        {
          id: "nodo",
          title: "Nodo and AI answers",
          body: (
            <p>
              Nodo&rsquo;s answers are generated automatically and can be incomplete or wrong. Check anything important. Nodo is
              not a doctor, lawyer, financial adviser or emergency service. Cloud Nodo has a daily limit and may be unavailable at
              times.
            </p>
          ),
        },
        {
          id: "apk",
          title: "Downloading the APK",
          body: (
            <p>
              Before NOTtEodo is on Google Play, we offer the app as an APK file from this website, signed with our key. Each
              release lists its SHA-256 checksum so you can verify it. Only install NOTtEodo from this website or Google Play.
            </p>
          ),
        },
        {
          id: "open-source",
          title: "Open source",
          body: (
            <p>
              NOTtEodo&rsquo;s source code is published under the MIT licence. The NOTtEodo name, wordmark and ribbon N
              monogram are not covered by that licence. See <Link href="/brand">brand guidelines</Link> and{" "}
              <Link href="/licenses">licences</Link>.
            </p>
          ),
        },
        {
          id: "warranty",
          title: "No warranty and limits of liability",
          body: (
            <p>
              NOTtEodo is provided &ldquo;as is&rdquo;. We work hard to keep it reliable, but we can&rsquo;t promise it will
              always be available or free of errors, or that reminders will fire on every device (some phone makers restrict
              background apps). To the extent the law allows, we are not liable for indirect or consequential losses or for lost
              data, and our total liability is limited to ₹1,000. Nothing here limits rights you have under consumer protection law
              that cannot be excluded.
            </p>
          ),
        },
        {
          id: "changes",
          title: "Changes and ending",
          body: (
            <p>
              We may update these terms; for significant changes we will give notice in the app or on this website before they
              apply. You can stop using NOTtEodo at any time. We may end the service with at least 60 days&rsquo; notice, during
              which you can export your data.
            </p>
          ),
        },
        {
          id: "law",
          title: "Law and disputes",
          body: (
            <p>
              These terms are governed by the laws of India. Please contact us first at{" "}
              <a href={`mailto:${IDENTITY.supportEmail}`}>{IDENTITY.supportEmail}</a>; most problems can be solved that way.
              Otherwise the courts at [CITY], India have jurisdiction, without affecting your right to use the courts where you
              live if consumer law gives you that right.
            </p>
          ),
        },
      ]}
    />
  );
}
