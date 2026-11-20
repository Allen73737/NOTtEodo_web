"use client";

/** Last-resort error page (the root layout itself failed), so it carries its own minimal styles. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeContent: "center", gap: 16, background: "#F7F3EE", color: "#1D1C15", fontFamily: "Georgia, serif", textAlign: "center", padding: 24 }}>
        <p style={{ fontSize: 28, margin: 0 }}>
          NOT<i style={{ color: "#7A1F2B" }}>te</i>odo
        </p>
        <h1 style={{ fontWeight: 400, margin: 0 }}>The movement stopped.</h1>
        <p style={{ fontFamily: "Arial, sans-serif", color: "#424849", margin: 0 }}>Please try again in a moment. Your data is safe on your phone.</p>
        <button onClick={reset} style={{ justifySelf: "center", background: "#7A1F2B", color: "#FFFFFF", border: 0, borderRadius: 999, padding: "12px 22px", cursor: "pointer" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
