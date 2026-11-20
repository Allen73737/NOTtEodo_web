import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Table } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Data safety",
  description: "A plain mirror of NOTtEodo's Google Play Data safety answers: what is collected, shared, optional, and why.",
  alternates: { canonical: "/data-safety" },
};

const Y = "Yes";
const N = "No";

export default function DataSafetyPage() {
  return (
    <LegalPage
      doc="data-safety"
      title="Data safety"
      summary={
        <ul>
          <li>No data is collected unless you create an account or use cloud features.</li>
          <li>No data is shared with third parties for their own use. Service providers only process it for us.</li>
          <li>All data in transit is encrypted (HTTPS). You can delete your data at any time.</li>
        </ul>
      }
      sections={[
        {
          id: "definitions",
          title: "How to read this",
          body: (
            <p>
              Google Play defines <em>collected</em> as data sent off your device to us or our service providers, and{" "}
              <em>shared</em> as data given to another company for its own purposes. Data that stays on your phone, or that only
              goes to service providers working for us, is not &ldquo;shared&rdquo;. Details are in the{" "}
              <Link href="/privacy">privacy policy</Link>.
            </p>
          ),
        },
        {
          id: "collected",
          title: "Data collected",
          body: (
            <Table
              head={["Data type (Play category)", "Collected", "Shared", "Optional", "Purpose"]}
              rows={[
                ["Email address (Personal info)", Y, N, "Yes: only with an account", "Account management"],
                ["Name, other info: display name, motto, location you type (Personal info)", Y, N, "Yes", "App functionality, personalisation"],
                ["User IDs (Personal info)", Y, N, "Yes: only with an account", "Account management, security"],
                ["Other user-generated content: notes, tasks, journal, etc. (App activity)", Y, N, "Yes: only if you sync", "App functionality"],
                ["Calendar events you create in NOTtEodo (Calendar)", Y, N, "Yes: only if you sync", "App functionality"],
                ["Expenses and budgets you log (Financial info: other financial info)", Y, N, "Yes: only if you sync", "App functionality"],
                ["Photos (Photos and videos)", Y, N, "Yes: only if you add them and sync", "App functionality"],
                ["Voice or sound recordings (Audio)", Y, N, "Yes", "App functionality (sync, transcription)"],
                ["In-app messages: chats with Nodo, feedback (Messages / App activity)", Y, N, "Yes", "App functionality, developer communications"],
                ["Crash logs and diagnostics", N, N, "", "Not collected: no crash or analytics SDKs"],
                ["Device or other IDs, advertising ID", N, N, "", "Not collected"],
                ["Location", N, N, "", "Not collected. Photo location data is stripped on upload"],
                ["Contacts, SMS, call logs, web history", N, N, "", "Not collected"],
              ]}
            />
          ),
        },
        {
          id: "practices",
          title: "Security practices",
          body: (
            <Table
              head={["Practice", "Answer"]}
              rows={[
                ["Data is encrypted in transit", "Yes: HTTPS only; the app refuses plain HTTP"],
                ["You can request that data be deleted", <>Yes: in the app, at <Link href="/delete-account">/delete-account</Link>, or by email</>],
                ["Committed to the Play Families policy", "No: the app's target audience on Play is 13+"],
                ["Independent security review", "Not yet"],
              ]}
            />
          ),
        },
        {
          id: "processors",
          title: "Service providers (not “sharing”)",
          body: (
            <p>
              Supabase (India) stores accounts and synced data; Cloudinary (India) stores photos and voice notes; Groq (USA)
              processes cloud Nodo requests when you use them; Resend (USA) sends release emails you sign up for. None may use
              your data for their own purposes.
            </p>
          ),
        },
      ]}
    />
  );
}
