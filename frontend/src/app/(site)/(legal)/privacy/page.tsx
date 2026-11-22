import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Table } from "@/components/legal/LegalPage";
import { IDENTITY } from "@/content/identity";
import { getConfig } from "@/lib/platform";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What NOTtEodo stores, where, for how long, who processes it, and the control you have. Written from the app's code.",
  alternates: { canonical: "/privacy" },
};
export const revalidate = 3600;

export default async function PrivacyPage() {
  const cfg = await getConfig();
  const optIn = cfg.nodo_cloud_opt_in;
  const zdr = cfg.groq_zdr;

  const groqRetention = zdr
    ? "Groq processes the request only to produce the answer. Its contract forbids using it to train models, and we have turned on its zero-data-retention setting, so it keeps no copy once the answer is returned."
    : "Groq processes the request to produce the answer. Its contract forbids using it to train or fine-tune models. Groq does not keep request content by default, but may keep it for up to 30 days when investigating errors or suspected abuse.";

  return (
    <LegalPage
      doc="privacy"
      title="Privacy policy"
      summary={
        <ul>
          <li>
            <strong>No account, no upload.</strong> Used without an account, everything you write stays on your phone,
            encrypted. We never receive it.
          </li>
          <li>
            <strong>An account is optional.</strong> If you sign in, your items are copied to our database in India so they
            survive a new phone. Add an encryption passphrase and we can&rsquo;t read them.
          </li>
          <li>
            <strong>Cloud Nodo{optIn ? " only with your yes" : " is on unless you turn it off"}.</strong> When it runs, your
            question and the items it needs go to an AI provider in the USA, which may not train on them.
          </li>
          <li>
            <strong>No ads, no trackers, no selling data.</strong> The app has no advertising or analytics code.
          </li>
          <li>
            <strong>You can delete everything</strong> from the app or at <Link href="/delete-account">/delete-account</Link>.
          </li>
        </ul>
      }
      sections={[
        {
          id: "who",
          title: "Who we are",
          body: (
            <>
              <p>
                NOTtEodo (the Android app <code>com.notteodo.notteodo</code> and this website) is run by {IDENTITY.developer},{" "}
                {IDENTITY.address} (&ldquo;we&rdquo;). For your personal data we are the <em>Data Fiduciary</em> under India&rsquo;s
                Digital Personal Data Protection Act, 2023 (&ldquo;DPDP Act&rdquo;) and the <em>controller</em> under the EU and UK
                GDPR where they apply.
              </p>
              <p>
                Questions or requests: <a href={`mailto:${IDENTITY.privacyEmail}`}>{IDENTITY.privacyEmail}</a>. Grievance Officer:{" "}
                {IDENTITY.grievanceOfficer}, <a href={`mailto:${IDENTITY.grievanceEmail}`}>{IDENTITY.grievanceEmail}</a>.
              </p>
            </>
          ),
        },
        {
          id: "on-device",
          title: "Using NOTtEodo without an account",
          body: (
            <>
              <p>
                Everything you create (notes, tasks, events, habits, expenses, wardrobe, trips, journal entries, voice memos,
                moodboard pins, shopping lists, settings) is stored on your phone and encrypted with AES-256-GCM. The key is held
                by Android&rsquo;s Keystore. If you set an app PIN, the key is additionally wrapped with a key derived from your
                PIN (PBKDF2-HMAC-SHA256, 600,000 iterations).
              </p>
              <p>
                Android backups are switched off for NOTtEodo, so this data is not copied to your Google backup. Uninstalling the
                app deletes it. We receive none of it.
              </p>
              <p className="callout">
                Even without an account, a few features contact other services directly from your phone. They are listed in{" "}
                <a href="#third-parties">Who else is involved</a>: font downloads, images you pin from web links, and the
                password check if you create an account.
              </p>
            </>
          ),
        },
        {
          id: "account",
          title: "With an account (optional)",
          body: (
            <>
              <p>If you sign in (email and password, or Google), we process:</p>
              <ul>
                <li>
                  <strong>Account data:</strong> your email address, a password hash (held by our authentication provider; we
                  never see your password), sign-in times, and two-step verification settings if you turn them on.
                </li>
                <li>
                  <strong>Synced items:</strong> a copy of each part of the app (notes, tasks, planner, habits, expenses, wardrobe,
                  travel, journal, moodboard, shopping, settings), so it survives a reinstall and appears on your other devices.
                </li>
                <li>
                  <strong>Photos and voice notes</strong> you add, uploaded to a folder only your account can use. Location data
                  embedded in photos (EXIF/GPS) is stripped on upload.
                </li>
                <li>
                  <strong>Profile details</strong> you choose to enter, such as display name, motto and location (a place name you
                  type; NOTtEodo does not use your device&rsquo;s location).
                </li>
              </ul>
              <h3>End-to-end encryption passphrase</h3>
              <p>
                In Settings → Account &amp; sync you can set an encryption passphrase. Your items are then encrypted on your phone
                (AES-256-GCM, with a key derived from your passphrase using PBKDF2-HMAC-SHA256, 600,000 iterations) before they are
                uploaded, and our database refuses unencrypted copies from then on. We cannot read them or recover them if you lose
                the passphrase.
              </p>
              <p className="callout">
                Without a passphrase, synced items are protected in transit (HTTPS) and at rest by our database provider, and
                database rules let each account read only its own rows. They are not end-to-end encrypted, so our database
                administrators could technically access them. We do not look at your content.
              </p>
            </>
          ),
        },
        {
          id: "nodo",
          title: "Nodo, the assistant",
          body: (
            <>
              <p>
                <strong>On the device:</strong> without an account, or with cloud AI turned off, Nodo answers by searching your own
                items on your phone. Nothing leaves the device for this.
              </p>
              <p>
                <strong>In the cloud:</strong>{" "}
                {optIn
                  ? "if you are signed in and say yes when NOTtEodo asks (you can change your answer in Settings → Nodo assistant),"
                  : "if you are signed in, cloud Nodo is on by default. You can turn it off at any time in Settings → Nodo assistant. While it is on,"}{" "}
                each request sends to our server: your question; short excerpts of the items that match it; a brief summary of your
                app state (for example what is due today and your budget); the personality you chose; and the last few messages of
                the chat. Our server forwards this to our AI provider to write the answer. With cloud AI on, Nodo may also write
                your morning notification from the same facts.
              </p>
              <p>
                <strong>Voice transcription:</strong> when you ask NOTtEodo to transcribe a voice memo in the cloud, the audio is
                sent the same way to the provider&rsquo;s speech-to-text service.
              </p>
              <p>
                <strong>The provider:</strong> Groq, Inc. (USA). {groqRetention} Requests are tagged with{" "}
                {optIn ? "a random-looking identifier that is not your account ID" : "your account's identifier"} so the provider
                can detect abuse.
              </p>
              <h3>What Nodo remembers</h3>
              <Table
                head={["What", "What's in it", "Kept", "Your control"]}
                rows={[
                  [
                    "Memories",
                    "Short facts, preferences, goals, routines and people you mention (up to 150, each under 300 characters)",
                    "Until you delete them or your account; oldest drop off past 150",
                    "See and delete each one, or all, in Settings → Nodo assistant",
                  ],
                  ["Conversation summary", "A rolling summary of your past chats (under 2,000 characters)", "Until you delete it or your account", "Deleted with Forget everything"],
                  [
                    "Recent answers",
                    "The general question about using the app and its answer, with personal details removed, so a thumbs up or down can be matched",
                    "30 days",
                    "Deleted with your account",
                  ],
                  [
                    "App insights",
                    "Common questions about using NOTtEodo and good answers, shared by everyone, holding no account ID or personal text; reviewed by our admins",
                    "Until removed by an admin",
                    "Contains nothing that identifies you",
                  ],
                ]}
              />
              <p>Each signed-in account can make up to 200 cloud Nodo requests a day; we count requests, not their content.</p>
            </>
          ),
        },
        {
          id: "feedback",
          title: "Feedback and support",
          body: (
            <p>
              When you send feedback from the app or this website, we store its title and description, the type and category you
              chose, your display name and email, and a short device description (model and Android version) so we can reply and
              fix bugs. Only you and our admins can read it. Replies appear in the app and on your <Link href="/account">account page</Link>.
              If you email us instead, we keep the conversation in our mailbox for as long as needed to help you, and at most two
              years.
            </p>
          ),
        },
        {
          id: "permissions",
          title: "Permissions the app asks for",
          body: (
            <Table
              head={["Permission", "Why", "When"]}
              rows={[
                ["Notifications", "Reminders, nudges, the focus timer and recaps you can tune or switch off", "When you first set a reminder"],
                ["Alarms & reminders (exact alarms)", "To deliver reminders at the exact minute you set", "When you set a timed reminder"],
                ["Microphone", "Voice memos and dictation, only while you record", "When you first record"],
                ["Biometrics", "To unlock the app or the Vault with your fingerprint or face, if you turn it on", "In Settings → Security & vault"],
                ["Internet", "Sign-in, sync, cloud Nodo, fonts and pinned web images", "Only when those features are used"],
                ["Run at start-up", "To set your reminders again after a restart, update or time-zone change", "Automatic"],
              ]}
            />
          ),
        },
        {
          id: "third-parties",
          title: "Who else is involved",
          body: (
            <>
              <p>
                We never sell or rent your data and never share it for advertising. These service providers process data on our
                behalf, only to run the feature listed:
              </p>
              <Table
                head={["Provider", "For", "Data", "Where"]}
                rows={[
                  ["Supabase", "Accounts, database, sync, edge functions", "Account and synced data", "India (Supabase region)"],
                  ["Cloudinary", "Photos and voice notes", "Files you add, without location metadata", "India"],
                  [
                    "Groq",
                    `Cloud Nodo and transcription${optIn ? ", only if you say yes" : ""}`,
                    "Questions, matching excerpts, a summary of your day, recent chat, audio",
                    "USA",
                  ],
                  ["Resend", "Release emails you sign up for on this website", "Email address", "USA"],
                  ["Vercel", "Hosting this website", "Standard server logs (see below)", "Global edge network"],
                  ["Google", "Sign in with Google (if you choose it)", "Sign-in exchange", "Global"],
                  [
                    "Google Fonts",
                    "Downloading a font you pick that isn't built into the app",
                    "Your IP address and device type, as in any web request",
                    "Global",
                  ],
                  [
                    "Have I Been Pwned",
                    "Checking a new password against known breaches",
                    "Only the first 5 characters of your password's SHA-1 hash, never the password",
                    "Global",
                  ],
                  [
                    "Websites you pin images from",
                    "Showing a moodboard image you added by link",
                    "Your IP address, when your phone fetches the image",
                    "Wherever that site is",
                  ],
                ]}
              />
              <p>
                Sharing into NOTtEodo from another app (text, links, photos) and importing or exporting calendar (.ics) or CSV
                files all happen on your phone. NOTtEodo does not read your calendar: it hands events to your calendar app only when
                you ask. We may disclose data if Indian or other applicable law requires it, and will tell you unless the law forbids
                us.
              </p>
            </>
          ),
        },
        {
          id: "website",
          title: "This website",
          body: (
            <>
              <ul>
                <li>
                  <strong>No tracking cookies and no analytics.</strong> There are no analytics scripts, pixels or ad tags. Fonts
                  and images are served from our own domain.
                </li>
                <li>
                  <strong>Preferences stay in your browser.</strong> Your theme, Cards/Editorial view, sound and &ldquo;Start where
                  you are&rdquo; choice, how far you have read long pages, and the last release you saw are kept in your
                  browser&rsquo;s local storage and never sent to us.
                </li>
                <li>
                  <strong>Sign-in cookies</strong> are set only when you sign in to <Link href="/account">your account</Link> or
                  the admin portal, and only to keep you signed in. See the <Link href="/cookies">cookie notice</Link>.
                </li>
                <li>
                  <strong>Server logs:</strong> our host (Vercel) keeps standard request logs (IP address, browser, page, time)
                  for a short period set by its plan, to keep the site running and secure.
                </li>
                <li>
                  <strong>Download counter:</strong> we count APK downloads with a one-way hash of your IP address and a secret
                  that changes daily. The raw IP is never stored, and the hash is deleted after two days.
                </li>
                <li>
                  <strong>&ldquo;Was this helpful?&rdquo;</strong> (optional): on help, guide and FAQ pages, your answer is stored
                  with the page it was about and any note you write, and nothing else: no account, IP address or cookie. Notes are
                  read only by our admins, and every answer is deleted after 180 days.
                </li>
                <li>
                  <strong>Release emails</strong> (optional): if you ask to hear when NOTtEodo reaches Google Play or ships a new
                  version, we keep your email and when you confirmed. Every email has an unsubscribe link. Unconfirmed sign-ups are
                  deleted after 7 days.
                </li>
                <li>
                  <strong>&ldquo;Ask Nodo about NOTtEodo&rdquo; and the simulator</strong> run entirely in your browser. Nothing
                  you type there is sent anywhere.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "retention",
          title: "How long we keep data",
          body: (
            <Table
              head={["Data", "Kept"]}
              rows={[
                ["On-device data", "Until you delete it, erase the app's data or uninstall"],
                ["Account and synced items, photos, voice notes", "Until you delete them or your account"],
                ["Nodo memories and conversation summary", "Until you delete them or your account"],
                ["Nodo recent answers (de-personalised)", "30 days"],
                ["Cloud Nodo usage counts", "35 days"],
                ["Security log (sign-ins, vault unlocks, rate limits)", "365 days, deleted with your account"],
                ["Rate-limit records", "1 day"],
                ["Feedback", "Until resolved and no longer needed, at most 3 years, or until you delete your account"],
                ["Release-email subscribers", "Until you unsubscribe (then removed within 30 days); unconfirmed after 7 days"],
                ["Download counter hashes", "2 days"],
              ]}
            />
          ),
        },
        {
          id: "security",
          title: "How we protect it",
          body: (
            <p>
              On-device encryption with keys in Android&rsquo;s Keystore; optional end-to-end encryption for synced data; HTTPS
              only (the app refuses unencrypted connections); database rules that let each account read only its own data;
              two-step verification; rate limits; secret keys kept on the server, never in the app; and an audit trail of
              security events and admin actions. More in <Link href="/security">Security</Link>. If a breach affects your data we
              will tell you and the Data Protection Board of India as the DPDP Act requires.
            </p>
          ),
        },
        {
          id: "rights",
          title: "Your rights",
          body: (
            <>
              <h3>Everyone</h3>
              <p>
                You can see, export, correct and delete your data yourself: Settings → Backup &amp; export (encrypted backup, CSV,
                .ics), Settings → Nodo assistant (memories), and Settings → Account &amp; sync → Delete my account, or{" "}
                <Link href="/delete-account">on this website</Link>. You can withdraw consent at any time (for example by turning
                cloud Nodo off or unsubscribing from emails); this does not affect what happened before.
              </p>
              <h3>India (DPDP Act, 2023)</h3>
              <p>
                You have the right to a summary of the personal data we process and who we share it with, to correction, completion,
                updating and erasure, to grievance redressal, and to nominate someone to exercise your rights if you die or become
                incapacitated. Write to our Grievance Officer; we reply within 30 days. If you are not satisfied, you can complain to
                the Data Protection Board of India.
              </p>
              <h3>EU, EEA and UK</h3>
              <p>
                Our legal bases are: performing our contract with you (running the app and your account), your consent (cloud Nodo,
                release emails), and our legitimate interests (security, abuse prevention, fixing bugs). You have the rights of
                access, rectification, erasure, restriction, portability and objection, and you can complain to your data
                protection authority. Transfers outside India and the EEA/UK rely on the providers&rsquo; standard contractual
                clauses.
              </p>
              <h3>California</h3>
              <p>
                You can ask to know, delete and correct personal information. We do not sell or share personal information for
                cross-context behavioural advertising, and we do not use sensitive personal information to infer characteristics.
              </p>
            </>
          ),
        },
        {
          id: "children",
          title: "Children",
          body: (
            <p>
              Anyone can use NOTtEodo on their phone without an account: nothing is sent to us in that mode. Accounts, sync and
              cloud Nodo are for people aged 18 or over, or under 18 with the verifiable consent of a parent or lawful guardian, as
              India&rsquo;s DPDP Act requires. We do not track, profile or show advertising to anyone, including children. If you
              believe a child has created an account without consent, write to us and we will delete it. See also our{" "}
              <Link href="/child-safety">child safety standards</Link>.
            </p>
          ),
        },
        {
          id: "transfers",
          title: "Where data is stored",
          body: (
            <p>
              Account data, synced items, photos and voice notes are stored in India. Cloud Nodo requests (when used) are processed
              in the USA, and release-email addresses are processed in the USA. These transfers are permitted under section 16 of
              the DPDP Act, and the providers&rsquo; data processing terms include standard contractual clauses for EU and UK
              data.
            </p>
          ),
        },
        {
          id: "changes",
          title: "Changes and contact",
          body: (
            <p>
              We update this policy when the app&rsquo;s handling of data changes, and note each version below. For significant
              changes we will tell you in the app before they take effect. Contact:{" "}
              <a href={`mailto:${IDENTITY.privacyEmail}`}>{IDENTITY.privacyEmail}</a> · {IDENTITY.address}.
            </p>
          ),
        },
      ]}
    />
  );
}
