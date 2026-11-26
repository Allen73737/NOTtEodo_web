"use client";

import React from "react";

/**
 * The exact icon from the Flutter mobile app for the Cards / Editorial switch (core/editorial/view_style_glyph.dart).
 * - Cards: two stacked cards (back card raised, front card with knockout fill).
 * - Editorial: a solid headline bar over three horizontal ruled lines of type.
 * Transitions smoothly between the two states.
 */
export function ViewStyleGlyph({
  editorial,
  size = 20,
  className = "",
}: {
  editorial: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className={`view-style-glyph ${editorial ? "is-editorial" : "is-cards"} ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <style>{`
        .view-style-glyph rect,
        .view-style-glyph line {
          transition: transform 420ms var(--e-silk, cubic-bezier(0.16, 1, 0.3, 1)),
                      opacity 320ms var(--e-silk, cubic-bezier(0.16, 1, 0.3, 1)),
                      stroke-dashoffset 420ms var(--e-silk, cubic-bezier(0.16, 1, 0.3, 1));
        }
        .view-style-glyph .vsg-back {
          transform-origin: 10px 7px;
        }
        .view-style-glyph.is-editorial .vsg-back {
          transform: translate(-4px, 1px) scale(0.95, 0.28);
          fill: currentColor;
          stroke: transparent;
        }
        .view-style-glyph.is-cards .vsg-back {
          transform: translate(0, 0) scale(1, 1);
          fill: none;
          stroke: currentColor;
        }

        .view-style-glyph.is-editorial .vsg-front {
          opacity: 0;
          transform: translateY(2px) scale(0.92);
        }
        .view-style-glyph.is-cards .vsg-front {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .view-style-glyph.is-cards .vsg-line {
          opacity: 0;
          stroke-dasharray: 16;
          stroke-dashoffset: 16;
        }
        .view-style-glyph.is-editorial .vsg-line {
          opacity: 1;
          stroke-dasharray: 16;
          stroke-dashoffset: 0;
        }
        .view-style-glyph.is-editorial .vsg-line-2 {
          transition-delay: 50ms;
        }
        .view-style-glyph.is-editorial .vsg-line-3 {
          transition-delay: 100ms;
        }
      `}</style>

      {/* Back card: in Cards it is the outlined back card; in Editorial it flattens into the headline bar */}
      <rect
        className="vsg-back"
        x="6.5"
        y="2"
        width="11.5"
        height="10.5"
        rx="2.6"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Front card: shown in Cards view, knocked out to float over the back card */}
      <rect
        className="vsg-front"
        x="2"
        y="7"
        width="11.5"
        height="11"
        rx="2.6"
        fill="var(--c-sheet, #FAF8F5)"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ruled lines of type: arrival sequence in Editorial view */}
      <line
        className="vsg-line vsg-line-1"
        x1="2.5"
        y1="9.5"
        x2="17.5"
        y2="9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        className="vsg-line vsg-line-2"
        x1="2.5"
        y1="13"
        x2="17.5"
        y2="13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        className="vsg-line vsg-line-3"
        x1="2.5"
        y1="16.5"
        x2="12"
        y2="16.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
