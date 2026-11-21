import Link from "next/link";
import QRCode from "qrcode";
import { Monogram } from "@/components/brand/Monogram";
import { Wordmark } from "@/components/brand/Wordmark";
import { GITHUB_URL, footerGroups } from "@/content/site";
import { siteUrl } from "@/lib/env";
import { getConfig, getRoadmap } from "@/lib/platform";
import { SoundToggle, ThemeToggle, ViewToggle } from "./Toggles";

export async function Footer() {
  const [config, roadmap] = await Promise.all([getConfig(), getRoadmap()]);
  // The roadmap page only exists once an admin has published something on it.
  const hidden = new Set(config.flags.roadmap && roadmap.length > 0 ? [] : ["/roadmap"]);
  const qr = await QRCode.toString(`${siteUrl}/open/release/latest`, {
    type: "svg",
    margin: 0,
    color: { dark: "#1A1614", light: "#00000000" },
  });

  return (
    <footer className="footer no-print">
      <div className="endband">
        <Monogram size="min(70vw, 760px)" className="endband__mark" />
        <div className="wrap endband__inner">
          <p className="t-label endband__kicker">Free · Android · no ads, no trackers</p>
          <p className="endband__line">
            Curate your <span className="it">everyday.</span>
          </p>
          <div className="endband__cta">
            <Link href="/download" className="btn btn--light">
              Get NOTtEodo
            </Link>
            <Link href="/try" className="endband__try">
              Try it in your browser →
            </Link>
          </div>
        </div>
      </div>
      <div className="wrap">
        <div className="footer__top">
          <div className="footer__brand">
            <Monogram size={44} />
            <Wordmark className="footer__wordmark" />
            <p className="footer__line it">Curate your everyday.</p>
            <p className="footer__promise">No ads. No trackers.</p>
          </div>
          <div className="footer__qr">
            <div className="qr" aria-hidden="true" dangerouslySetInnerHTML={{ __html: qr }} />
            <p className="t-label">Scan to get NOTtEodo on your phone</p>
            <p className="footer__play">
              {config.play_live ? (
                <a href={config.urls.play} rel="noopener">
                  Get it on Google Play
                </a>
              ) : (
                <span>Google Play · coming soon</span>
              )}
            </p>
          </div>
        </div>

        <nav className="footer__grid" aria-label="Footer">
          {footerGroups.map((g) => (
            <div key={g.title}>
              <p className="t-label">{g.title}</p>
              <ul>
                {g.links.filter((l) => !hidden.has(l.href)).map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="footer__bottom">
          <p>
            <Link href="/status" className="status-dot" data-state={config.maintenance.on ? "maintenance" : "ok"}>
              {config.maintenance.on ? "Maintenance in progress" : "All systems normal"}
            </Link>
          </p>
          <p>
            <a href={GITHUB_URL} rel="noopener">
              Source on GitHub
            </a>{" "}
            · MIT licence · Made in India
          </p>
          <div className="footer__tools">
            <ViewToggle />
            <ThemeToggle />
            <SoundToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
