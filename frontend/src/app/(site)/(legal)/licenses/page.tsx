import type { Metadata } from "next";
import { Table } from "@/components/legal/LegalPage";
import { PageHeader } from "@/components/site/PageHeader";
import pkg from "../../../../../package.json";

export const metadata: Metadata = {
  title: "Licences",
  description: "Open-source licences for the fonts, libraries and code used by NOTtEodo and this website.",
  alternates: { canonical: "/licenses" },
};

const FONTS = [
  ["Bodoni Moda", "Owen Earl (indestructible type*)", "SIL Open Font License 1.1"],
  ["DM Sans", "Colophon Foundry, Jonny Pinhorn", "SIL Open Font License 1.1"],
  ["Space Grotesk", "Florian Karsten", "SIL Open Font License 1.1"],
];

const LICENCES: Record<string, string> = {
  next: "MIT",
  react: "MIT",
  "react-dom": "MIT",
  three: "MIT",
  "@react-three/fiber": "MIT",
  "@react-three/drei": "MIT",
  gsap: "GSAP Standard License (free)",
  "@gsap/react": "GSAP Standard License (free)",
  lenis: "MIT",
  motion: "MIT",
  "@supabase/ssr": "MIT",
  "@supabase/supabase-js": "MIT",
  zod: "MIT",
  "@radix-ui/react-dialog": "MIT",
  "@radix-ui/react-tabs": "MIT",
  cmdk: "MIT",
  "lucide-react": "ISC",
  minisearch: "MIT",
  qrcode: "MIT",
  sonner: "MIT",
  clsx: "MIT",
  "tailwind-merge": "MIT",
  "server-only": "MIT",
  "detect-gpu": "MIT",
};

export default function LicensesPage() {
  const deps = Object.entries(pkg.dependencies as Record<string, string>);
  return (
    <>
      <PageHeader
        eyebrow="Licences"
        title="Built on open work."
        italic={["open"]}
        lede="NOTtEodo's own source code is MIT-licensed. These are the fonts and libraries this website ships, with thanks."
      />
      <div className="prose-wrap legal__body">
        <section className="legal__section">
          <h2 className="t-h3">NOTtEodo</h2>
          <p>
            The app and this website are published under the MIT licence. The NOTtEodo name, wordmark and ribbon N monogram are
            trademarks and are not licensed for reuse.
          </p>
        </section>
        <section className="legal__section">
          <h2 className="t-h3">Fonts</h2>
          <Table head={["Family", "Designer", "Licence"]} rows={FONTS} />
        </section>
        <section className="legal__section">
          <h2 className="t-h3">Libraries</h2>
          <Table head={["Package", "Version", "Licence"]} rows={deps.map(([n, v]) => [n, v, LICENCES[n] ?? "See package"])} />
        </section>
        <section className="legal__section">
          <h2 className="t-h3">3D models and imagery</h2>
          <p>
            Every 3D object on this site (the phone, the watch movement, the wax seal, the paper) is generated in code. No
            third-party models, photographs or stock imagery are used. App screenshots are of NOTtEodo itself.
          </p>
        </section>
      </div>
    </>
  );
}
