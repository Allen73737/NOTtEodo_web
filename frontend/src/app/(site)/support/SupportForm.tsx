"use client";

import { useActionState, useRef } from "react";
import { sendFeedback, type FeedbackState } from "./actions";

export function SupportForm() {
  const started = useRef(String(Date.now()));
  const [state, action, pending] = useActionState<FeedbackState, FormData>(sendFeedback, { ok: false });
  if (state.ok)
    return (
      <p className="card pad" role="status">
        Thank you. We read everything; you&rsquo;ll see our reply on your account page and in the app.
      </p>
    );
  return (
    <form action={action} className="card pad stack">
      <label className="field">
        What is it about?
        <select className="input" name="type" defaultValue="general_feedback">
          <option value="bug_report">Something isn&rsquo;t working</option>
          <option value="feature_suggestion">An idea</option>
          <option value="ui_enhancement">Design or ease of use</option>
          <option value="general_feedback">Something else</option>
        </select>
      </label>
      <label className="field">
        Title
        <input className="input" name="title" required maxLength={200} />
      </label>
      <label className="field">
        Details
        <textarea className="input" name="description" required maxLength={5000} rows={6} />
      </label>
      <label className="field">
        How much does it matter?
        <select className="input" name="impact" defaultValue="nice_to_have">
          <option value="nice_to_have">Nice to have</option>
          <option value="important">Important</option>
          <option value="critical">Critical</option>
        </select>
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />
      <input type="hidden" name="t" value={started.current} />
      {state.error && (
        <p role="alert" style={{ color: "var(--c-error)", margin: 0 }}>
          {state.error}
        </p>
      )}
      <button className="btn" disabled={pending}>
        {pending ? "Sending" : "Send"}
      </button>
    </form>
  );
}
