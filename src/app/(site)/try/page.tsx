import type { Metadata } from "next";
import { CipherCard, PosterFan, StepsCard } from "@/components/site/HeadVisuals";
import { PageHeader } from "@/components/site/PageHeader";
import { ContinueOnPhone, Simulator } from "@/simulator/Simulator";

export const metadata: Metadata = {
  title: "Try it in your browser",
  description:
    "A working simulation of NOTtEodo: capture a line, strike a task, set the Focus Dial, press the check-in seal and ask Nodo. Nothing leaves your browser.",
  alternates: { canonical: "/try" },
  openGraph: { images: ["/posters/og/og-try-light.png"] },
};

export default function TryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Try it"
        title="Don’t take our word for it. Touch it."
        italic={["Touch", "it."]}
        lede="Capture a line, strike a task, spin the Focus Dial, press and hold the seal, and switch Cards ↔ Editorial or Ivory ↔ OLED. Everything stays in this tab."
        aside={<StepsCard title="Five things to try" steps={["Type a line into Capture", "Tap a task to strike it", "Turn the Focus Dial", "Press and hold the seal", "Flip Aa and the theme"]} />}
        word="Touch"
      />
      <section className="wrap" style={{ paddingBottom: 96, display: "grid", gap: 28 }}>
        <Simulator />
        <ContinueOnPhone />
      </section>
    </>
  );
}
