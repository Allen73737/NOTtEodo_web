import type { Metadata } from "next";
import Link from "next/link";
import { AskNodo } from "@/components/film/interactive";
import { Table } from "@/components/legal/LegalPage";
import { PageHeader } from "@/components/site/PageHeader";
import { Screenshot } from "@/components/shots/Screenshot";
import { getConfig } from "@/lib/platform";

export const metadata: Metadata = {
  title: "Nodo",
  description: "Nodo, the companion inside NOTtEodo: what it can do, what runs on your phone, what goes to the cloud, and how to see and erase what it remembers.",
  alternates: { canonical: "/nodo" },
  openGraph: { images: ["/posters/og/og-nodo-light.png"] },
};
export const revalidate = 3600;

export default async function NodoPage() {
  const cfg = await getConfig();
  return (
    <>
      <PageHeader
        eyebrow="Nodo"
        title="A companion that forgets on request."
        italic={["forgets"]}
        lede="Nodo knows your tasks, notes, habits, budget and schedule, can add tasks, notes and expenses for you, and remembers what you tell it. You decide how much of that happens in the cloud."
      />
      <section className="wrap split" style={{ paddingBottom: 60 }}>
        <AskNodo />
        <Screenshot screen="nodo" />
      </section>
      <section className="prose-wrap legal__body">
        <div className="legal__section">
          <h2 className="t-h2">Where Nodo runs</h2>
          <Table
            head={["", "On your phone", "In the cloud"]}
            rows={[
              ["When", "No account, or cloud AI off", cfg.nodo_cloud_opt_in ? "Signed in and you said yes" : "Signed in with cloud AI on (the default today)"],
              ["How", "Searches your own items; answers how-to questions from the app's guide", "Your question and matching excerpts go to our server, then to an AI provider"],
              ["Leaves the phone", "Nothing", "The question, matching excerpts, a short summary of your day, recent chat"],
              ["Training", "None", "The provider's contract forbids training on it"],
            ]}
          />
          <p>
            Turn cloud AI off any time in <strong>Settings → Nodo assistant</strong>. Details are in the{" "}
            <Link href="/privacy#nodo">privacy policy</Link>.
          </p>
        </div>
        <div className="legal__section">
          <h2 className="t-h2">Memory you can see</h2>
          <p>
            Nodo keeps short memories (facts, preferences, goals, routines, people you mention), at most 150, and a rolling summary of
            your chats. Read and delete each one in <strong>Settings → Nodo assistant</strong>, or on your{" "}
            <Link href="/account">web account page</Link>. &ldquo;Forget everything&rdquo; clears them all. Deleting your account deletes them too.
          </p>
        </div>
        <div className="legal__section">
          <h2 className="t-h2">Personalities</h2>
          <p>Witty, scholarly, stoic or energetic. On Home, Nodo&rsquo;s pulse card offers Inspire Me and a playful Roast My Focus.</p>
        </div>
      </section>
    </>
  );
}
