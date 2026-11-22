import type { MetadataRoute } from "next";
import { colors } from "@/content/generated/tokens";

/** PWA manifest for the website (not the app). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NOTtEodo",
    short_name: "NOTtEodo",
    description: "Notes. Tasks. Life. The official NOTtEodo website.",
    start_url: "/",
    display: "standalone",
    background_color: colors.light.canvas,
    theme_color: colors.light.canvas,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
