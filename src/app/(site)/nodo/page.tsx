import type { Metadata } from "next";
import Link from "next/link";
import { AskNodo } from "@/components/film/interactive";
import { Table } from "@/components/legal/LegalPage";
import { Chapter } from "@/components/site/Chapter";
import { PageHeader } from "@/components/site/PageHeader";
import { Screenshot } from "@/components/shots/Screenshot";
import { getConfig } from "@/lib/platform";

export const metadata: Metadata = {
  title: "Nodo",
  description:
    "Nodo, the companion inside NOTtEodo: what it can do, what runs on your phone, what goes to the cloud, and how to see and erase what it remembers.",
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
        aside={<Screenshot screen="nodo" priority />}
      />
      <Chapter
        id="ask"
        n="01"
        label="Ask it"
        title="Go on, ask it something."
        lede="This is the same guide Nodo reads inside the app, answering here in your browser."
        tone="ink"
      >
        <AskNodo />
      </Chapter>
      <Chapter id="where" n="02" label="Where Nodo runs" title="On your phone, or in the cloud. Your choice.">
        <Table
          head={["", "On your phone", "In the cloud"]}
          rows={[
            [
              "When",
              "No account, or cloud AI off",
              cfg.nodo_cloud_opt_in
                ? "Signed in and you said yes"
                : "Signed in with cloud AI on (the default today)",
            ],
            [
              "How",
              "Searches your own items; answers how-to questions from the app's guide",
              "Your question and matching excerpts go to our server, then to an AI provider",
            ],
            [
              "Leaves the phone",
              "Nothing",
              "The question, matching excerpts, a short summary of your day, recent chat",
            ],
            ["Training", "None", "The provider's contract forbids training on it"],
          ]}
        />
        <p>
          Turn cloud AI off any time in <strong>Settings → Nodo assistant</strong>. Details are in the{" "}
          <Link href="/privacy#nodo">privacy policy</Link>.
        </p>
      </Chapter>
      <Chapter
        id="memory"
        n="03"
        label="Memory you can see"
        title="It remembers what you tell it. It forgets on request."
      >
        <p className="t-lede">
          Nodo keeps short memories (facts, preferences, goals, routines, people you mention), at most 150,
          and a rolling summary of your chats. Read and delete each one in{" "}
          <strong>Settings → Nodo assistant</strong>, or on your <Link href="/account">web account page</Link>
          . &ldquo;Forget everything&rdquo; clears them all. Deleting your account deletes them too.
        </p>
      </Chapter>
      <Chapter id="voices" n="04" label="Personalities" title="Four voices.">
        <ul className="voices">
          {[
            ["Witty & Sarcastic", "Clever dry humour, playful irony and banter."],
            ["Scholarly & Poetic", "Reflective, eloquent and analytical."],
            ["Stoic & Concise", "Direct, disciplined, no filler."],
            ["Sprightly & Energetic", "Passionate encouragement and high momentum."],
          ].map(([h, b]) => (
            <li key={h} className="card pad">
              <p className="t-h3 it" style={{ margin: 0 }}>
                {h}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                {b}
              </p>
            </li>
          ))}
        </ul>
        <p className="muted">
          On Home, Nodo&rsquo;s pulse card offers Inspire Me and a playful Roast My Focus.
        </p>
      </Chapter>
    </>
  );
}
