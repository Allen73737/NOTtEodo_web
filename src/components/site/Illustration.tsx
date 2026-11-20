import type { Module } from "@/content/site";

/**
 * Faithful HTML/CSS recreations for parts of the app that have no screenshot yet,
 * built from the Flutter source and clearly labelled as illustrations.
 */
export function Illustration({ kind }: { kind: NonNullable<Module["illustration"]> }) {
  const body: Record<string, React.ReactNode> = {
    widgets: (
      <div className="illo-grid">
        {["Sticky memo", "Daily checklist", "Polaroid pin", "Outfit of the day", "Budget meter", "Voice memo", "Boarding pass", "Focus clock"].map((w) => (
          <span key={w} className="illo-tile">{w}</span>
        ))}
      </div>
    ),
    vault: (
      <div className="illo-center">
        <p className="t-h3" style={{ margin: 0 }}>Vault</p>
        <div className="illo-pin" aria-hidden="true">{"• • • •"}</div>
        <p className="muted">Enter PIN or use fingerprint</p>
      </div>
    ),
    shopping: (
      <ul className="illo-list">
        {[["Fruit & veg", "Tomatoes"], ["Bakery", "Sourdough"], ["Dairy & eggs", "Curd"], ["Pantry", "Basmati rice"]].map(([aisle, item]) => (
          <li key={item}><span className="t-label">{aisle}</span>{item}</li>
        ))}
      </ul>
    ),
    wardrobe: (
      <div className="illo-grid">
        {["Linen shirt · Summer", "Wool coat · Winter", "Oxblood scarf · All", "Loafers · All"].map((w) => (
          <span key={w} className="illo-tile">{w}</span>
        ))}
      </div>
    ),
    capture: (
      <div className="illo-center">
        <p className="illo-input">call mom tomorrow 5pm</p>
        <p className="t-label">Becomes a task · tomorrow, 5:00 pm</p>
      </div>
    ),
    rewards: (
      <div className="illo-center">
        <p className="t-display" style={{ margin: 0 }}>12</p>
        <p className="t-label">day streak · Level 4 · Curator</p>
      </div>
    ),
    notifications: (
      <ul className="illo-list">
        <li><span className="t-label">08:00</span>Today: 3 tasks, dinner at 8</li>
        <li><span className="t-label">13:30</span>&ldquo;Submit the lab report&rdquo; is due in 2 hours</li>
        <li><span className="t-label">21:30</span>Your streak is safe. Evening review?</li>
      </ul>
    ),
    sync: (
      <ul className="illo-list">
        <li><span className="t-label">Account &amp; sync</span>Signed in · synced 2 minutes ago</li>
        <li><span className="t-label">Encryption passphrase</span>On: encrypted before upload</li>
        <li><span className="t-label">Backup &amp; export</span>Encrypted backup · CSV · .ics</li>
      </ul>
    ),
  };
  return (
    <figure className="illo card pad">
      {body[kind]}
      <figcaption className="t-label">Illustration recreated from the app&rsquo;s design, not a screenshot.</figcaption>
    </figure>
  );
}
