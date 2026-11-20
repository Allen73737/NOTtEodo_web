"use client";

import { useEffect, useState } from "react";

/** "Open in app" via the app's custom scheme (notteodo://shortcut/<target>), shown on Android only. */
export function OpenInApp({ target }: { target: string }) {
  const [android, setAndroid] = useState(false);
  useEffect(() => setAndroid(/Android/i.test(navigator.userAgent)), []);
  if (!android) return null;
  return (
    <p style={{ margin: "28px 0" }}>
      <a className="btn" href={`notteodo://shortcut/${target}`}>
        Open in the app
      </a>
    </p>
  );
}
