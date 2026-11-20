import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { colors } from "@/content/generated/tokens";
import { siteUrl } from "@/lib/env";
import { bodoni, dmSans, grotesk } from "@/lib/fonts";
import { themeScript } from "@/lib/theme-script";
import "@/styles/globals.css";
import "@/styles/brand.css";
import "@/styles/chrome.css";
import "@/styles/motion.css";
import "@/styles/sections.css";
import "@/styles/film.css";
import "@/styles/simulator.css";
import "@/styles/pages.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "NOTtEodo: Notes. Tasks. Life.", template: "%s · NOTtEodo" },
  description:
    "A private, offline-first daily organiser for Android: notes, tasks, planner, habits, focus, expenses, wardrobe, travel, journal and moodboards in one calm app. Free, no ads, no trackers.",
  applicationName: "NOTtEodo",
  authors: [{ name: "[DEVELOPER NAME]" }],
  openGraph: { type: "website", siteName: "NOTtEodo", locale: "en_IN" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icon-light.svg", type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark.svg", type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: colors.light.canvas },
    { media: "(prefers-color-scheme: dark)", color: colors.dark.canvas },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      dir="ltr"
      className={`no-js ${bodoni.variable} ${dmSans.variable} ${grotesk.variable}`}
      data-view="cards"
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content={colors.light.canvas} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="grain">
        {children}
        <Toaster position="bottom-center" toastOptions={{ className: "toast" }} />
      </body>
    </html>
  );
}
