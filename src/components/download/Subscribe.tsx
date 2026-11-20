"use client";

import { useRef, useState } from "react";

/** Double opt-in email form (Resend). Honeypot + time-on-form instead of a third-party CAPTCHA. */
export function Subscribe({ topic, label }: { topic: "play_launch" | "releases"; label: string }) {
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");
  const started = useRef(Date.now());
  return (
    <form
      className="subscribe"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setState("busy");
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: fd.get("email"), topic, website: fd.get("website") ?? "", t: started.current }),
        }).catch(() => null);
        const body = (await res?.json().catch(() => ({}))) as { error?: string };
        if (res?.ok) setState("sent");
        else {
          setState("error");
          setMsg(body?.error ?? "Something went wrong.");
        }
      }}
    >
      {state === "sent" ? (
        <p role="status">Check your inbox for a confirmation link. Nothing else is sent until you click it.</p>
      ) : (
        <>
          <label className="field">
            {label}
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <input className="input" type="email" name="email" required autoComplete="email" placeholder="you@example.com" />
              <button className="btn" type="submit" disabled={state === "busy"}>
                {state === "busy" ? "Sending" : "Notify me"}
              </button>
            </div>
          </label>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />
          <p className="t-label" style={{ margin: 0 }}>
            One email when it happens, then nothing. Unsubscribe in one click. See the privacy policy.
          </p>
          {state === "error" && <p role="alert" style={{ color: "var(--c-error)" }}>{msg}</p>}
        </>
      )}
    </form>
  );
}
