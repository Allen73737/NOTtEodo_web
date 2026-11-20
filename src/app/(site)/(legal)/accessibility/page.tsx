import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { IDENTITY } from "@/content/identity";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "NOTtEodo's accessibility statement for this website, and how to tell us about a barrier.",
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return (
    <LegalPage
      doc="accessibility"
      title="Accessibility statement"
      summary={
        <p style={{ margin: 0 }}>
          We aim for WCAG 2.2 level AA on this website. Every animated chapter has a plain text equivalent, motion can be reduced,
          and everything works with a keyboard. Tell us about any barrier and we&rsquo;ll fix it.
        </p>
      }
      sections={[
        {
          id: "measures",
          title: "What we do",
          body: (
            <ul>
              <li>All 3D and animated scenes are decorative; the same content is in the page as headings, text and images with descriptions.</li>
              <li>
                Your system&rsquo;s &ldquo;reduce motion&rdquo; setting is honoured: no scroll-jacking, parallax or autoplay, only
                gentle fades. Ambient loops pause when off screen.
              </li>
              <li>Every interactive element is reachable by keyboard, with a visible oxblood focus ring and a skip link.</li>
              <li>Colour pairs are checked for AA contrast in both Ivory and OLED themes.</li>
              <li>Sound is off by default. Legal and help pages work without JavaScript and print cleanly.</li>
              <li>The in-browser app simulator can be operated with a keyboard.</li>
            </ul>
          ),
        },
        {
          id: "known",
          title: "Known limitations",
          body: (
            <ul>
              <li>App screenshots are images of the real app; their text is described in the surrounding copy rather than read out in full.</li>
              <li>The poster gallery&rsquo;s artwork is decorative; each poster has a short description.</li>
            </ul>
          ),
        },
        {
          id: "contact",
          title: "Feedback",
          body: (
            <p>
              Email <a href={`mailto:${IDENTITY.supportEmail}?subject=Accessibility`}>{IDENTITY.supportEmail}</a>. We reply within
              5 working days.
            </p>
          ),
        },
      ]}
    />
  );
}
