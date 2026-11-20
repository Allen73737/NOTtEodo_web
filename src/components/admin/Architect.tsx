"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Sparkles, X } from "lucide-react";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

/**
 * Nodo Architect, the web twin of admin_ai_assistant_sheet.dart. Goes only through the
 * existing `ai-assist` edge function with the admin's own JWT (mode "admin"); the server
 * re-checks admin status. No provider key or model name ever reaches the browser.
 */
export function Architect() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);

  async function ask(query: string) {
    const sb = supabaseBrowser();
    if (!sb) return;
    const history = msgs.slice(-6);
    setMsgs((m) => [...m, { role: "user", content: query }]);
    setBusy(true);
    const { data, error } = await sb.functions.invoke("ai-assist", {
      body: { task: "ask", mode: "admin", query, scope: "Admin", history },
    });
    setBusy(false);
    setMsgs((m) => [
      ...m,
      { role: "assistant", content: error ? "Nodo can't answer right now." : String((data as { answer?: string })?.answer ?? "") },
    ]);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className="architect-fab" aria-label="Open Nodo Architect">
          <Sparkles size={18} strokeWidth={1.6} />
          <span className="mono-cap">Architect</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="scrim" />
        <Dialog.Content className="drawer architect" aria-describedby={undefined}>
          <div className="drawer__head">
            <Dialog.Title className="mono-cap">Nodo Architect</Dialog.Title>
            <Dialog.Close className="icon-btn" aria-label="Close">
              <X size={18} />
            </Dialog.Close>
          </div>
          <div className="architect__log" aria-live="polite">
            {msgs.length === 0 && (
              <p className="muted">
                Ask about the platform: release steps, what a config key does, how to read the audit log. Answers come from the
                server&rsquo;s admin mode.
              </p>
            )}
            {msgs.map((m, i) => (
              <p key={i} className={`architect__msg architect__msg--${m.role}`}>
                {m.content}
              </p>
            ))}
            {busy && <p className="muted">Thinking</p>}
          </div>
          <form
            className="row"
            style={{ flexWrap: "nowrap" }}
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem("q") as HTMLInputElement;
              const q = input.value.trim();
              if (q) void ask(q);
              input.value = "";
            }}
          >
            <input name="q" className="input" placeholder="Ask Nodo Architect" autoComplete="off" />
            <button className="btn" disabled={busy}>
              Ask
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
