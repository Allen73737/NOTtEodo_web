"use client";

import { useState } from "react";
import { washTo } from "@/motion/theme-wash";
import { CountUp, InkStrike, KineticText, Magnetic, RollingText, Scramble, Sheen, useHoldToPeek } from "@/motion/primitives";
import { currentTheme } from "@/lib/prefs";
import { play } from "@/lib/sound";

/** Live demos of every ported primitive, for /design. */
export function MotionDemos() {
  const [struck, setStruck] = useState(false);
  const [n, setN] = useState(18420);
  const [replay, setReplay] = useState(0);
  const [peek, setPeek] = useState(false);
  const hold = useHoldToPeek(() => setPeek(true));

  return (
    <div className="grid-auto">
      <Demo name="ink_strike" note="460 ms · cubic(0.45, 0, 0.2, 1)">
        <p className="t-h3" style={{ fontFamily: "var(--font-display)" }}>
          <InkStrike struck={struck}>Call the bank</InkStrike>
        </p>
        <button className="btn btn-ghost" onClick={() => (setStruck((s) => !s), play("paper"))}>
          {struck ? "Lift the ink" : "Complete task"}
        </button>
      </Demo>

      <Demo name="kinetic_text" note="words on a hinge, 1100 ms">
        <p className="t-h2" key={replay}>
          <KineticText text="Time, well kept." italicWords={["kept"]} start="mount" />
        </p>
        <button className="btn btn-ghost" onClick={() => setReplay((r) => r + 1)}>
          Replay
        </button>
      </Demo>

      <Demo name="count_up + rolling_text" note="1250 ms count, 520 ms odometer">
        <p className="t-h2 t-num">
          <CountUp text="₹18,420" />
        </p>
        <p className="t-h3">
          <RollingText value={`₹${n.toLocaleString("en-IN")}`} />
        </p>
        <button className="btn btn-ghost" onClick={() => setN((v) => v + Math.round(Math.random() * 900 + 100))}>
          Add an expense
        </button>
      </Demo>

      <Demo name="touch_sheen + edge_light" note="bloom follows the pointer; rim to a hairline">
        <Sheen className="card pad" style={{ minHeight: 120 }}>
          <p className="t-label">Hover or touch</p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", margin: 0 }}>Light, not tilt.</p>
        </Sheen>
      </Demo>

      <Demo name="card_peek" note="hold 450 ms; the edge light charges first">
        <div className="card pad sheen" {...hold} ref={hold.ref as React.Ref<HTMLDivElement>} style={{ userSelect: "none", touchAction: "manipulation" }}>
          <p style={{ margin: 0 }}>Press and hold this card</p>
        </div>
        {peek && (
          <div className="peek" role="dialog" aria-modal="true" aria-label="Card preview" onClick={() => setPeek(false)}>
            <div className="card pad peek__card">
              <p className="t-eyebrow">Preview</p>
              <p className="t-h2">A larger look, without opening.</p>
              <button className="btn" autoFocus onClick={() => setPeek(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Demo>

      <Demo name="theme_wash" note="ink disc from the touch point, 460 ms">
        <button
          className="btn"
          onClick={(e) => washTo(currentTheme() === "dark" ? "light" : "dark", { x: e.clientX, y: e.clientY })}
        >
          Wash the page
        </button>
      </Demo>

      <Demo name="pressable + magnetic" note="90 ms down, 420 ms easeOutBack up">
        <Magnetic>
          <button className="btn">Press me</button>
        </Magnetic>
      </Demo>

      <Demo name="scramble" note="technical labels only">
        <p className="t-label" key={replay}>
          <Scramble text="AES-256-GCM · ANDROID KEYSTORE" />
        </p>
      </Demo>
    </div>
  );
}

function Demo({ name, note, children }: { name: string; note: string; children: React.ReactNode }) {
  return (
    <section className="card pad demo" aria-label={name}>
      <div className="demo__stage stack">{children}</div>
      <div>
        <p className="t-eyebrow" style={{ margin: 0 }}>
          {name}
        </p>
        <p className="t-label" style={{ margin: "4px 0 0" }}>
          {note}
        </p>
      </div>
    </section>
  );
}
