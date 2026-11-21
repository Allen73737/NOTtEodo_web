import { AnnouncementBanner } from "@/components/site/AnnouncementBanner";
import { Ambient } from "@/components/site/Ambient";
import { CommandPalette } from "@/components/site/CommandPalette";
import { Footer } from "@/components/site/Footer";
import { Nav } from "@/components/site/Nav";
import { Transitions } from "@/components/site/Transitions";
import { getAnnouncements, getConfig } from "@/lib/platform";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [config, announcements] = await Promise.all([getConfig(), getAnnouncements()]);
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
        {children}
      </main>
      <Footer />
      <CommandPalette />
      <Transitions />
      <Ambient
        downloadHref={config.play_live ? config.urls.play : "/download"}
        label={config.play_live ? "Get it on Google Play" : "Get NOTtEodo"}
      />
    </>
  );
}
