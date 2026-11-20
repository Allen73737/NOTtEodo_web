import { Wordmark } from "@/components/brand/Wordmark";

export default function Home() {
  return (
    <section className="section wrap" style={{ paddingTop: 160 }}>
      <Wordmark as="h1" variant="kinetic" className="t-mega" />
    </section>
  );
}
