import localFont from "next/font/local";

// The app's own bundled fonts (frontend/assets/google_fonts), subset to Latin + ₹ as woff2.
// Only the hero faces preload; the rest load on first use. No requests to Google Fonts.
export const bodoni = localFont({
  variable: "--font-bodoni",
  display: "swap",
  preload: true,
  src: [
    { path: "../fonts/BodoniModa-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/BodoniModa-Italic.woff2", weight: "400", style: "italic" },
    { path: "../fonts/BodoniModa-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/BodoniModa-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/BodoniModa-Bold.woff2", weight: "700", style: "normal" },
  ],
  fallback: ["Didot", "Georgia", "serif"],
});

export const dmSans = localFont({
  variable: "--font-dm",
  display: "swap",
  preload: true,
  src: [
    { path: "../fonts/DMSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/DMSans-Italic.woff2", weight: "400", style: "italic" },
    { path: "../fonts/DMSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/DMSans-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/DMSans-Bold.woff2", weight: "700", style: "normal" },
  ],
  fallback: ["system-ui", "sans-serif"],
});

export const grotesk = localFont({
  variable: "--font-grotesk",
  display: "swap",
  preload: false,
  src: [
    { path: "../fonts/SpaceGrotesk-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/SpaceGrotesk-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/SpaceGrotesk-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/SpaceGrotesk-Bold.woff2", weight: "700", style: "normal" },
  ],
  fallback: ["ui-monospace", "monospace"],
});
