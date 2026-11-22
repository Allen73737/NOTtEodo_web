"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { LayoutDashboard, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Monogram } from "@/components/brand/Monogram";
import { Wordmark } from "@/components/brand/Wordmark";
import { footerGroups, modules, nav } from "@/content/site";
import { SoundToggle, ThemeToggle, ViewToggle } from "./Toggles";
import { useViewer } from "./useViewer";

/**
 * Floating glass nav that compresses after the first screen of scroll. Menu opens every page of the
 * site: on phones as a sheet from the side, on wider screens the bar expands down into a full index.
 * Signed-in admins get a way straight back to the admin portal.
 */
export function Nav() {
  const [compact, setCompact] = useState(false);
  const [tucked, setTucked] = useState(false);
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const links = useRef<HTMLElement>(null);
  const { admin } = useViewer();

  // Compact after the first screen; tucked away while reading down, back on any scroll up.
  useEffect(() => {
    let last = window.scrollY;
    let travel = 0;
    const on = () => {
      const y = window.scrollY;
      const dy = y - last;
      last = y;
      setCompact(y > 80);
      // A little hysteresis, so a trackpad's jitter never makes the bar flicker.
      travel = Math.sign(dy) === Math.sign(travel) ? travel + dy : dy;
      if (y < innerHeight * 0.6 || travel < -24) setTucked(false);
      else if (travel > 48) setTucked(true);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    setOpen(false);
    setTucked(false);
  }, [path]);

  // A soft pill glides to whichever link the pointer is over, and back to the current page.
  const glide = (to: Element | null) => {
    const box = links.current;
    if (!box) return;
    const el = (to ?? box.querySelector("[aria-current=page]")) as HTMLElement | null;
    box.classList.toggle("has-glide", Boolean(el));
    if (!el) return;
    box.style.setProperty("--gx", `${el.offsetLeft}px`);
    box.style.setProperty("--gw", `${el.offsetWidth}px`);
  };
  useEffect(() => {
    glide(null);
  }, [path]);

  return (
    <header
      className={`nav no-print${compact ? " nav--compact" : ""}${tucked && !open ? " nav--tucked" : ""}`}
      onFocus={() => setTucked(false)}
    >
      <div className="nav__bar glass">
        <Link href="/" className="nav__brand" aria-label="NOTtEodo home">
          <Monogram size={26} className="nav__mark" />
          <Wordmark />
        </Link>
        <nav
          aria-label="Primary"
          className="nav__links"
          ref={links}
          onPointerOver={(e) => glide((e.target as Element).closest("a"))}
          onPointerLeave={() => glide(null)}
        >
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={path?.startsWith(n.href) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="nav__tools">
          <button
            type="button"
            className="icon-btn hide-sm"
            aria-label="Search the site (Ctrl+K)"
            onClick={() => window.dispatchEvent(new Event("nt:palette"))}
          >
            <Search size={18} strokeWidth={1.6} />
          </button>
          <span className="nav__opt">
            <ViewToggle />
          </span>
          <ThemeToggle />
          <span className="nav__opt">
            <SoundToggle />
          </span>
          {admin && (
            <Link href="/admin" className="nav__admin" aria-label="Admin portal">
              <LayoutDashboard size={16} strokeWidth={1.7} aria-hidden />
              <span>Admin</span>
            </Link>
          )}
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button type="button" className="nav__menu" aria-label="Open menu: every page">
                <Menu size={20} strokeWidth={1.6} aria-hidden />
                <span className="nav__menu-label">Menu</span>
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="scrim" />
              <Dialog.Content className="drawer" aria-describedby={undefined}>
                <div className="drawer__head">
                  <Dialog.Title asChild>
                    <span>
                      <Wordmark />
                    </span>
                  </Dialog.Title>
                  <Dialog.Close className="icon-btn" aria-label="Close menu">
                    <X size={20} strokeWidth={1.6} />
                  </Dialog.Close>
                </div>
                <button
                  type="button"
                  className="drawer__search"
                  onClick={() => {
                    setOpen(false);
                    // Let the drawer close first, so the palette takes focus cleanly.
                    setTimeout(() => window.dispatchEvent(new Event("nt:palette")), 120);
                  }}
                >
                  <Search size={18} strokeWidth={1.6} aria-hidden />
                  Search features, help and guides
                </button>
                <nav aria-label="Menu" className="drawer__nav">
                  <div className="drawer__bigs">
                    <Link href="/" className="drawer__big" style={{ ["--i" as string]: 0 }} aria-current={path === "/" ? "page" : undefined}>
                      Home
                    </Link>
                    {nav.map((n, i) => (
                      <Link
                        key={n.href}
                        href={n.href}
                        className="drawer__big"
                        style={{ ["--i" as string]: i + 1 }}
                        aria-current={path?.startsWith(n.href) ? "page" : undefined}
                      >
                        {n.label}
                      </Link>
                    ))}
                  </div>
                  {admin && (
                    <Link href="/admin" className="drawer__admin">
                      <LayoutDashboard size={18} strokeWidth={1.7} aria-hidden />
                      <span>
                        Admin portal
                        <span className="t-label">You&rsquo;re signed in as an admin</span>
                      </span>
                    </Link>
                  )}
                  <div className="drawer__groups">
                    <div className="drawer__group drawer__group--features">
                      <p className="t-label">Features</p>
                      {modules.map((m) => (
                        <Link key={m.slug} href={`/features/${m.slug}`} aria-current={path === `/features/${m.slug}` ? "page" : undefined}>
                          {m.name}
                        </Link>
                      ))}
                    </div>
                    {footerGroups.map((g) => (
                      <div key={g.title} className="drawer__group">
                        <p className="t-label">{g.title}</p>
                        {g.links.filter((l) => l.href !== "/roadmap").map((l) => (
                          <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>
                            {l.label}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </nav>
                <div className="drawer__tools">
                  <ViewToggle />
                  <ThemeToggle />
                  <SoundToggle />
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
