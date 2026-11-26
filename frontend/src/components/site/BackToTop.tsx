"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { haptic, play } from "@/lib/sound";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setVisible(window.scrollY > 600);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    haptic(8);
    play("whoosh");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      className="back-to-top glass no-print"
      aria-label="Back to top"
      onClick={scrollToTop}
    >
      <ArrowUp size={16} strokeWidth={2} aria-hidden />
      <span>Top</span>
    </button>
  );
}
