import Link from "next/link";
import { Scene } from "@/components/site/Scene";

export default function NotFound() {
  return (
    <section className="wrap status-page">
      <Scene kind="ink" />
      <p className="t-eyebrow">404</p>
      <h1 className="t-h1">This page spilled.</h1>
      <p className="t-lede">The link may be old, or the page moved. Everything else is where you left it.</p>
      <div className="row">
        <Link className="btn" href="/">Back to NOTtEodo</Link>
        <Link className="btn btn-ghost" href="/help">Help centre</Link>
      </div>
    </section>
  );
}
