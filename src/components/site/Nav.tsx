"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { footerGroups, nav } from "@/content/site";
import { SoundToggle, ThemeToggle, ViewToggle } from "./Toggles";

/** Floating glass nav that compresses after the first screen of scroll. */
export function Nav() {
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    const on = () => setCompact(window.scrollY > 80);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [path]);

  return (
    <header className={`nav no-print${compact ? " nav--compact" : ""}`}>
      <div className="nav__bar glass">
        <Link href="/" className="nav__brand" aria-label="NOTtEodo home">
          <Wordmark />
        </Link>
        <nav aria-label="Primary" className="nav__links">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={path?.startsWith(n.href) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="nav__tools">
          <button
            type="button"
            className="icon-btn"
            aria-label="Search the site (Ctrl+K)"
            onClick={() => window.dispatchEvent(new Event("nt:palette"))}
          >
            <Search size={18} strokeWidth={1.6} />
          </button>
          <ViewToggle />
          <ThemeToggle />
          <SoundToggle className="hide-sm" />
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button type="button" className="icon-btn nav__menu" aria-label="Open menu">
                <Menu size={20} strokeWidth={1.6} />
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
                <nav aria-label="Menu" className="drawer__nav">
                  {nav.map((n, i) => (
                    <Link key={n.href} href={n.href} className="drawer__big" style={{ ["--i" as string]: i }}>
                      {n.label}
                    </Link>
                  ))}
                  {footerGroups.map((g) => (
                    <div key={g.title} className="drawer__group">
                      <p className="t-label">{g.title}</p>
                      {g.links.map((l) => (
                        <Link key={l.href} href={l.href}>
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  ))}
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
