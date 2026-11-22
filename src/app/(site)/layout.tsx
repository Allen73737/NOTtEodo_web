import { AnnouncementBanner } from "@/components/site/AnnouncementBanner";
import { Ambient } from "@/components/site/Ambient";
import { CommandPalette } from "@/components/site/CommandPalette";
import { Footer } from "@/components/site/Footer";
import { Nav } from "@/components/site/Nav";
import { PageSwap } from "@/components/site/PageSwap";
import { ReleaseNote } from "@/components/site/ReleaseNote";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { Transitions } from "@/components/site/Transitions";
import { getAnnouncements, getConfig, getLatestRelease } from "@/lib/platform";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [config, announcements, release] = await Promise.all([getConfig(), getAnnouncements(), getLatestRelease()]);
  // The first line of the release notes, as one plain sentence for the "New in" card.
  const firstNote = release?.release_notes_md.split("\n").find((l) => l.trim())?.replace(/^[-*]\s*/, "").trim() ?? "";
  return (
    <>
      <div className="atmos" aria-hidden="true" />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <AnnouncementBanner initial={announcements} />
      {config.maintenance.on && config.maintenance.message ? (
        <div className="banner banner--warning" role="status">
          <p>{config.maintenance.message}</p>
        </div>
      ) : null}
      <Nav />
      <main id="main" tabIndex={-1}>
        <PageSwap>{children}</PageSwap>
      </main>
      <Footer />
      <CommandPalette />
      <Transitions />
      <SmoothScroll />
      {release && <ReleaseNote code={release.version_code} name={release.version_name} line={firstNote.slice(0, 140)} />}
      <Ambient
        downloadHref={config.play_live ? config.urls.play : "/download"}
        label={config.play_live ? "Get it on Google Play" : "Get NOTtEodo"}
      />
    </>
  );
}
