import type { Metadata } from "next";
import { LegalPage, Table } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Cookies",
  description: "This website uses no tracking cookies, so there is no cookie banner. Here is everything it does store.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalPage
      doc="cookies"
      title="Cookies and local storage"
      summary={
        <p style={{ margin: 0 }}>
          No tracking cookies, no analytics, no advertising, so there is no cookie banner to click through. The only cookies keep you
          signed in, and only after you sign in.
        </p>
      }
      sections={[
        {
          id: "cookies",
          title: "Cookies",
          body: (
            <Table
              head={["Name", "Set when", "Purpose", "Expires"]}
              rows={[
                ["sb-*-auth-token (Supabase)", "You sign in to your account or the admin portal", "Keeps you signed in; strictly necessary", "When you sign out, or after the session ends"],
              ]}
            />
          ),
        },
        {
          id: "storage",
          title: "Local storage in your browser",
          body: (
            <>
              <Table
                head={["Key", "What it remembers"]}
                rows={[
                  ["nt-theme", "Ivory (light) or OLED (dark), if you chose one"],
                  ["nt-view", "Cards view or Editorial view"],
                  ["nt-sound", "Whether site sounds are on"],
                  ["nt-motion", "Whether you reduced motion on this site"],
                  ["nt-persona", "Your “Start where you are” choice"],
                  ["nt-read", "How far you read long pages (guides, legal pages), so you can pick up where you left off"],
                  ["nt-seen-release", "The last app version you were told about, so “New in” appears only once"],
                  ["nt-sim, nt-tour (session)", "The Try it simulator's state and which tour steps you've done, this visit"],
                  ["nt-helpful:… (session)", "That you already answered “Was this helpful?” on a page, this visit"],
                  ["nt-hidden-ann (session)", "Announcements you dismissed this visit"],
                  ["nt-preloaded (session)", "That the opening animation already played this visit"],
                ]}
              />
              <p>These never leave your browser. Clear them any time from your browser&rsquo;s site settings.</p>
            </>
          ),
        },
      ]}
    />
  );
}
