import type { Metadata } from "next";
import { StepsCard } from "@/components/site/HeadVisuals";
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
      <section className="stage-band" aria-label="The simulator">
        <div className="wrap stage-band__inner">
          <p className="stage-band__label t-label">
            <span className="stage-band__dot" aria-hidden="true" /> Live · running in this tab
          </p>
          <Simulator />
        </div>
      </section>
      <section className="wrap" style={{ paddingBlock: "48px 96px" }}>
        <ContinueOnPhone />
      </section>
    </>
  );
}
