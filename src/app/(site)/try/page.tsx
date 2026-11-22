import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { SimTour } from "@/simulator/SimTour";
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
        word="Touch"
      />
      <section className="stage-band" aria-label="The simulator">
        <div className="wrap stage-band__inner">
          <div className="stage-band__copy">
            <p className="stage-band__label t-label">
              <span className="stage-band__dot" aria-hidden="true" /> Live · running in this tab
            </p>
            <h2 className="stage-band__title">
              It&rsquo;s running. <span className="it">Go on, touch it.</span>
            </h2>
            <p className="stage-band__lede">A working sketch of the app: the same screens, colours and motion. Nothing you do here leaves this tab.</p>
            <SimTour />
            <ContinueOnPhone />
          </div>
          <Simulator />
        </div>
      </section>
    </>
  );
}
