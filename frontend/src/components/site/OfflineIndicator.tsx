"use client";

import { Check, WifiOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import { haptic, play } from "@/lib/sound";

type Status = "online" | "offline" | "restored";

export function OfflineIndicator() {
  const [status, setStatus] = useState<Status>("online");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus("offline");
    }

    const onOffline = () => {
      setStatus("offline");
      setDismissed(false);
      haptic(15);
      play("drop");
    };

    const onOnline = () => {
      setStatus("restored");
      haptic(10);
      play("tick");
      const t = setTimeout(() => {
        setStatus("online");
      }, 2600);
      return () => clearTimeout(t);
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (status === "online" || dismissed) return null;

  return (
    <aside
      className={`offline-pill offline-pill--${status} glass no-print`}
      role="status"
      aria-live="polite"
    >
      <span className="offline-pill__dot" aria-hidden="true" />
      <div className="offline-pill__body">
        {status === "offline" ? (
          <>
            <WifiOff size={15} strokeWidth={1.8} aria-hidden />
            <span>You&rsquo;re offline · The app itself works completely on-device</span>
          </>
        ) : (
          <>
            <Check size={15} strokeWidth={2} aria-hidden />
            <span>Back online · Connection restored</span>
          </>
        )}
      </div>
      <button
        type="button"
        className="offline-pill__close"
        aria-label="Dismiss offline notice"
        onClick={() => setDismissed(true)}
      >
        <X size={14} strokeWidth={1.8} />
      </button>
    </aside>
  );
}
