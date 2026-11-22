"use client";

import { useSearchParams } from "next/navigation";

/** Confirmation notes after an email link (read on the client, so the page itself stays static and fast). */
export function Notices() {
  const sp = useSearchParams();
  const msg =
    sp.get("subscribed") === "1"
      ? "You’re confirmed. We’ll write once, when it’s time."
      : sp.get("unsubscribed") === "1"
        ? "You’re unsubscribed. We won’t email you again."
        : sp.get("missing") === "1"
          ? "That release isn’t available any more. Here is the latest."
          : null;
  if (!msg) return null;
  return (
    <div className="wrap" role="status">
      <p className="card pad" style={{ margin: "0 0 24px" }}>
        {msg}
      </p>
    </div>
  );
}
