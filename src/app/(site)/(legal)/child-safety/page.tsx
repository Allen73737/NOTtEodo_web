import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { IDENTITY } from "@/content/identity";

export const metadata: Metadata = {
  title: "Child safety standards",
  description: "NOTtEodo's standards against child sexual abuse and exploitation (CSAE), and how to report a concern.",
  alternates: { canonical: "/child-safety" },
};

export default function ChildSafetyPage() {
  return (
    <LegalPage
      doc="child-safety"
      title="Child safety standards"
      summary={
        <ul>
          <li>NOTtEodo has zero tolerance for child sexual abuse material (CSAM) and child sexual abuse and exploitation (CSAE).</li>
          <li>NOTtEodo is a private organiser: there are no public profiles, feeds, messaging between users or ways to contact strangers.</li>
          <li>Report concerns to {IDENTITY.supportEmail}. We act on reports and notify the authorities as the law requires.</li>
        </ul>
      }
      sections={[
        {
          id: "standards",
          title: "Our standards",
          body: (
            <>
              <p>
                NOTtEodo prohibits creating, storing, uploading or sharing any content that sexually exploits or endangers
                children, including CSAM, grooming, sextortion and trafficking content. Accounts used this way are terminated and
                reported.
              </p>
              <p>
                The app has no social features: you cannot find, message or share with other users inside NOTtEodo. Content you
                create is visible only to you (and, for synced data, to your own devices).
              </p>
            </>
          ),
        },
        {
          id: "report",
          title: "How to report",
          body: (
            <>
              <p>
                Email <a href={`mailto:${IDENTITY.supportEmail}?subject=Child%20safety%20report`}>{IDENTITY.supportEmail}</a> with
                the subject &ldquo;Child safety report&rdquo;. Include what you saw and, if you can, the account email involved. Do
                not attach illegal imagery.
              </p>
              <p>
                In India you can also report to the National Cyber Crime Reporting Portal (cybercrime.gov.in) or call 1930. Elsewhere,
                contact your local police or the NCMEC CyberTipline (report.cybertip.org).
              </p>
            </>
          ),
        },
        {
          id: "response",
          title: "What we do",
          body: (
            <ul>
              <li>We acknowledge reports within 48 hours and act on them as a priority.</li>
              <li>We remove violating content and terminate the account involved.</li>
              <li>
                We report confirmed CSAM to the appropriate authorities, including Indian law enforcement as required by the
                POCSO Act, 2012 and the IT Act, 2000, and preserve information as the law requires.
              </li>
            </ul>
          ),
        },
        {
          id: "contact",
          title: "Child safety contact",
          body: (
            <p>
              {IDENTITY.developer} is the designated point of contact for child safety: <a href={`mailto:${IDENTITY.supportEmail}`}>{IDENTITY.supportEmail}</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
