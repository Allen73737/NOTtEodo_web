"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Scene } from "@/components/site/Scene";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(JSON.stringify({ level: "error", msg: "route error", digest: error.digest }));
  }, [error]);
  return (
    <section className="wrap status-page">
      <Scene kind="movement" />
      <p className="t-eyebrow">500</p>
      <h1 className="t-h1">The movement stopped.</h1>
      <p className="t-lede">Something went wrong on our side. Your data is safe on your phone.</p>
      <div className="row">
        <button className="btn" onClick={reset}>Wind it again</button>
        <Link className="btn btn-ghost" href="/status">Check status</Link>
      </div>
      {error.digest && <p className="t-label">Reference {error.digest}</p>}
    </section>
  );
}
