import type { NextConfig } from "next";

const config: NextConfig = {
  // A separate output folder for local production test builds, so they never collide with `next dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  reactStrictMode: true,
  images: { formats: ["image/avif", "image/webp"] },
  experimental: {
    turbopackFileSystemCacheForDev: false,
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    optimizePackageImports: [
      "@radix-ui/react-dialog",
      "@radix-ui/react-tabs",
      "motion",
      "gsap",
      "three",
      "@react-three/fiber",
      "@react-three/drei",
      "lucide-react",
      "sonner",
      "clsx",
      "tailwind-merge",
    ],
  },
  compress: true,
  async headers() {
    return [
      { source: "/screenshots/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/posters/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
      { source: "/gpu-benchmarks/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }] },
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
  },
};

export default config;
