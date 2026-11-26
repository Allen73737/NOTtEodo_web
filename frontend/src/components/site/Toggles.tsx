"use client";

import { Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { ViewStyleGlyph } from "@/components/brand/ViewStyleGlyph";
import { useStoredFlag, useTheme, useView } from "@/lib/prefs";
import { haptic, play, setSound as applySound } from "@/lib/sound";
import { switchView, toggleTheme } from "@/motion/theme-wash";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const dark = useTheme() === "dark";
  return (
    <button
      type="button"
      className={`icon-btn ${className}`}
      aria-label={dark ? "Switch to Ivory (light) mode" : "Switch to OLED (dark) mode"}
      aria-pressed={dark}
      onClick={(e) => {
        haptic();
        play("drop");
        toggleTheme(e.detail === 0 ? undefined : { x: e.clientX, y: e.clientY });
      }}
    >
      {dark ? <Sun size={18} strokeWidth={1.6} /> : <Moon size={18} strokeWidth={1.6} />}
    </button>
  );
}

/** The app's Cards ↔ Editorial view toggle with the updated mobile app glyph. */
export function ViewToggle({ className = "" }: { className?: string }) {
  const editorial = useView() === "editorial";
  return (
    <button
      type="button"
      className={`icon-btn view-toggle ${className}`}
      aria-label={editorial ? "Switch to Cards view" : "Switch to Editorial view"}
      aria-pressed={editorial}
      title={editorial ? "Switch to Cards view" : "Switch to Editorial view"}
      onClick={() => {
        haptic();
        play("paper");
        switchView(editorial ? "cards" : "editorial");
      }}
    >
      <ViewStyleGlyph editorial={editorial} size={18} />
    </button>
  );
}

export function SoundToggle({ className = "" }: { className?: string }) {
  const [sound, setSound] = useStoredFlag("sound");
  const on = sound === "on";
  return (
    <button
      type="button"
      className={`icon-btn ${className}`}
      aria-label={on ? "Turn sound off" : "Turn sound on"}
      aria-pressed={on}
      onClick={() => {
        setSound(on ? null : "on");
        applySound(!on);
        if (!on) {
          play("bloom", true);
          toast("Sound enabled: subtle synthesizer cues", { duration: 2400 });
        } else {
          toast("Sound muted", { duration: 2000 });
        }
      }}
    >
      {on ? <Volume2 size={18} strokeWidth={1.6} /> : <VolumeX size={18} strokeWidth={1.6} />}
      <span className={`sound-bars${on ? " is-on" : ""}`} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </button>
  );
}
