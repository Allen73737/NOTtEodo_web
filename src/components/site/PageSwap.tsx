"use client";

import { usePathname } from "next/navigation";
import { ViewTransition } from "react";

/**
 * Page-to-page motion on the View Transitions API. The old page stays on screen until the new
 * one has rendered (no blank sheet, no fixed wait), then sinks back while the new page opens up
 * from the bottom through a rounded window (see `page-out` / `page-in` in editorial.css).
 * Going deeper (Transitions tags it `nav-forward`) slides the pages left, going back up slides
 * them right; the browser's own back button gets the plain opening.
 * Browsers without the API swap instantly, and Transitions keeps its curtain for slow loads.
 */
export function PageSwap({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <ViewTransition
      key={path}
      enter={{ "nav-forward": "page-in-fwd", "nav-back": "page-in-back", default: "page-in" }}
      exit={{ "nav-forward": "page-out-fwd", "nav-back": "page-out-back", default: "page-out" }}
      default="none"
    >
      <div className="page-swap">{children}</div>
    </ViewTransition>
  );
}
