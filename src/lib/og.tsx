import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { LOGO_MONOGRAM } from "@/components/brand/logo-paths";
import { colors } from "@/content/generated/tokens";

/**
 * Social preview cards (1200×630) for pages that don't have a hand-made poster: the eyebrow in
 * oxblood, the page's line in Bodoni with its last word in italic, and the ribbon N. Rendered at
 * build time from the poster studio's TTF faces (next/og can't read woff2).
 */
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const font = (file: string) => readFile(join(process.cwd(), "poster-studio/fonts", file));

export async function ogCard({ eyebrow, title, foot }: { eyebrow: string; title: string; foot?: string }) {
  const [bodoni, bodoniItalic, dm] = await Promise.all([font("BodoniModa-Regular.ttf"), font("BodoniModa-Italic.ttf"), font("DMSans-Medium.ttf")]);
  const c = colors.light;
  const words = title.trim().split(" ");
  const last = words.pop() ?? "";
  const size = title.length > 46 ? 76 : title.length > 30 ? 92 : 108;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: c.canvas, color: c.ink, position: "relative", padding: "72px 84px" }}>
        <svg
          width={420}
          height={420 * (LOGO_MONOGRAM.h / LOGO_MONOGRAM.w)}
          viewBox={`0 0 ${LOGO_MONOGRAM.w} ${LOGO_MONOGRAM.h}`}
          style={{ position: "absolute", right: -40, bottom: -70, opacity: 0.09 }}
        >
          <path d={LOGO_MONOGRAM.d} fill={c.oxblood} fillRule="evenodd" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", fontFamily: "DM Sans", fontSize: 24, letterSpacing: 5, textTransform: "uppercase", color: c.oxblood }}>{eyebrow}</div>
          <div style={{ display: "flex", flexWrap: "wrap", fontFamily: "Bodoni", fontSize: size, lineHeight: 1.02, letterSpacing: -2, maxWidth: 940 }}>
            {words.length ? <span style={{ marginRight: size * 0.24 }}>{words.join(" ")}</span> : null}
            <span style={{ fontFamily: "Bodoni Italic", color: c.oxblood }}>{last}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: "DM Sans", fontSize: 24, color: c.ink }}>
            <span style={{ fontFamily: "Bodoni", fontSize: 34 }}>NOTtEodo</span>
            {foot ? <span style={{ opacity: 0.55 }}>· {foot}</span> : null}
          </div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Bodoni", data: bodoni, style: "normal", weight: 400 },
        { name: "Bodoni Italic", data: bodoniItalic, style: "normal", weight: 400 },
        { name: "DM Sans", data: dm, style: "normal", weight: 500 },
      ],
    },
  );
}
