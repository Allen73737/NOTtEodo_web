"use client";

import { Sparkles, Terminal } from "lucide-react";
import { haptic, play } from "@/lib/sound";

type Preset = { label: string; action: "capture" | "focus" | "tasks" | "seal" | "nodo"; text?: string };

const PRESETS: Preset[] = [
  { label: "Capture “Dentist Fri 4pm”", action: "capture", text: "Dentist Friday 4pm" },
  { label: "Capture “Coffee ₹180”", action: "capture", text: "Coffee 180" },
  { label: "Turn Focus Dial", action: "focus" },
  { label: "Check in with Seal", action: "seal" },
  { label: "Ask Nodo about privacy", action: "nodo", text: "Where is my data stored?" },
];

export function SimPresets() {
  const run = (p: Preset) => {
    play("tick");
    haptic();
    window.dispatchEvent(new CustomEvent("nt:sim-preset", { detail: p }));
  };

  return (
    <div className="sim-presets stack" style={{ gap: 10, marginTop: 16 }}>
      <p className="t-label" style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
        <Sparkles size={13} className="sim-presets__sparkle" aria-hidden />
        One-tap test presets
      </p>
      <div className="sim-presets__chips">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className="chip sim-presets__chip"
            onClick={() => run(p)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="sim-presets__keys hide-sm" aria-hidden="true">
        <span><kbd>Q</kbd> Quick capture</span>
        <span><kbd>Esc</kbd> Close</span>
        <span><kbd>&uarr;</kbd> <kbd>&darr;</kbd> Focus Dial</span>
        <span><kbd>Space</kbd> Check-in Seal</span>
      </div>
    </div>
  );
}
