"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Dialog = dynamic(() => import("./CommandPaletteDialog"), { ssr: false });

/** Ctrl/Cmd+K. The palette (cmdk, Radix, the help index) loads only the first time it is opened. */
export function CommandPalette() {
  const [wanted, setWanted] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setWanted(true);
      }
    };
    const onOpen = () => setWanted(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("nt:palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("nt:palette", onOpen);
    };
  }, []);
  return wanted ? <Dialog /> : null;
}
