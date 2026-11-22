"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Calls the same `delete-account` edge function the app uses, with the user's own session. */
export function DeleteFlow() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ready = text.trim() === "DELETE";

  return (
    <form
      className="card pad stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!ready) return;
        const sb = supabaseBrowser();
        if (!sb) return;
        setBusy(true);
        setErr(null);
        const { error } = await sb.functions.invoke("delete-account", { body: { confirm: "DELETE" } });
        if (error) {
          setBusy(false);
          return setErr("Your account could not be deleted just now. Please try again, or email us.");
        }
        await sb.auth.signOut({ scope: "local" });
        router.replace("/account/deleted");
      }}
    >
      <label className="field">
        Type DELETE to confirm
        <input
          className="input t-num"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-describedby="del-help"
        />
      </label>
      <p id="del-help" className="t-label" style={{ margin: 0 }}>
        Deletion is immediate and permanent.
      </p>
      {err && (
        <p role="alert" style={{ color: "var(--c-error)", margin: 0 }}>
          {err}
        </p>
      )}
      <button className="btn" disabled={!ready || busy} aria-disabled={!ready || busy}>
        {busy ? "Deleting" : "Delete my account permanently"}
      </button>
    </form>
  );
}
