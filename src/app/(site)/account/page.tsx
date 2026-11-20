import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/site/PageHeader";
import type { Feedback } from "@/lib/db/types";
import { formatDate } from "@/lib/format";
import { getViewer } from "@/lib/supabase/server";
import { forgetAllMemories, forgetMemory } from "./actions";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS: Record<Feedback["status"], string> = {
  pending: "Received",
  reviewed: "Reviewed",
  planned: "Planned",
  resolved: "Resolved",
};

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { sb, user, isAdmin } = await getViewer();
  if (!sb) {
    return (
      <PageHeader eyebrow="Account" title="Accounts are offline here." italic={["offline"]} lede="This copy of the site isn't connected to NOTtEodo's servers." />
    );
  }
  if (!user) redirect("/auth/sign-in?next=/account");

  const [{ data: feedback }, { data: memories }, { data: collections }] = await Promise.all([
    sb.from("user_feedback").select("*").order("created_at", { ascending: false }).limit(50),
    sb.from("nodo_memories").select("id,kind,content,created_at").order("last_seen_at", { ascending: false }).limit(200),
    sb.from("user_collections").select("collection,updated_at"),
  ]);
  const synced = collections ?? [];
  const lastSync = synced.map((c) => c.updated_at as string).sort().at(-1);

  return (
    <>
      <PageHeader eyebrow="Your account" title="Everything in one place." italic={["one"]} lede={`Signed in as ${user.email}.`} />
      {sp.password === "updated" && (
        <p className="wrap" role="status">
          Password updated.
        </p>
      )}
      <section className="wrap grid-auto" style={{ paddingBottom: 96 }}>
        <div className="card pad stack">
          <p className="t-eyebrow">Sync</p>
          <p className="t-h3" style={{ margin: 0 }}>
            {synced.length ? `${synced.length} parts of the app synced` : "Nothing synced yet"}
          </p>
          <p className="muted" style={{ margin: 0 }}>
            {lastSync ? `Last change ${formatDate(lastSync)}.` : "Sign in from the app to start syncing."}
          </p>
          <a className="btn btn-ghost" href="/account/export" download>
            Download a copy of my synced data
          </a>
          <p className="t-label" style={{ margin: 0 }}>
            JSON. If you use an encryption passphrase, the items are encrypted; restore them in the app.
          </p>
        </div>

        <div className="card pad stack">
          <p className="t-eyebrow">What Nodo remembers</p>
          {memories?.length ? (
            <>
              <ul className="memories">
                {memories.map((m) => (
                  <li key={m.id}>
                    <span>
                      <span className="t-label">{m.kind}</span> {m.content}
                    </span>
                    <form action={forgetMemory}>
                      <input type="hidden" name="id" value={m.id} />
                      <button className="btn btn-quiet" aria-label={`Forget: ${m.content}`}>
                        Forget
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
              <form action={forgetAllMemories}>
                <button className="btn btn-ghost">Forget everything</button>
              </form>
            </>
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              Nothing yet. Nodo only remembers when you use it in the cloud.
            </p>
          )}
        </div>

        <div className="card pad stack" style={{ gridColumn: "1 / -1" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <p className="t-eyebrow">Your feedback</p>
            <Link className="btn btn-ghost" href="/support">
              Send feedback
            </Link>
          </div>
          {feedback?.length ? (
            <ul className="feedback-list">
              {(feedback as Feedback[]).map((f) => (
                <li key={f.id} id={f.id}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <strong>{f.title}</strong>
                    <span className="chip">{STATUS[f.status]}</span>
                  </div>
                  <p className="muted">{f.description}</p>
                  {f.admin_reply && (
                    <blockquote className="reply">
                      <p className="t-label">Reply · {formatDate(f.replied_at)}</p>
                      <p>{f.admin_reply}</p>
                    </blockquote>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">You haven&rsquo;t sent feedback yet.</p>
          )}
        </div>

        <div className="card pad stack">
          <p className="t-eyebrow">Security</p>
          <Link className="btn btn-ghost" href="/auth/update-password">
            Change password
          </Link>
          <form action="/auth/sign-out?scope=global" method="post">
            <button className="btn btn-ghost">Sign out everywhere</button>
          </form>
          <p className="t-label" style={{ margin: 0 }}>Signs out this browser, the app and every other device.</p>
        </div>

        <div className="card pad stack">
          <p className="t-eyebrow">Delete</p>
          <p style={{ margin: 0 }}>Permanently delete your account and everything stored with it.</p>
          <Link className="btn" href="/account/delete">
            Delete my account
          </Link>
        </div>

        {isAdmin && (
          <div className="card pad stack">
            <p className="t-eyebrow">Admin</p>
            <Link className="btn" href="/admin">
              Open the admin portal
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
