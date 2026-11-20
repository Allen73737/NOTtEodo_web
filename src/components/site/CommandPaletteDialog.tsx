"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import guide from "@/content/generated/app_guide.json";
import { footerGroups, modules } from "@/content/site";

type Item = { label: string; href: string; group: string; keywords?: string };

const items: Item[] = [
  ...modules.map((m) => ({ label: m.name, href: `/features/${m.slug}`, group: "Features", keywords: m.line })),
  ...footerGroups.flatMap((g) => g.links.map((l) => ({ label: l.label, href: l.href, group: g.title }))),
  ...guide.sections.map((s) => ({
    label: s.title,
    href: `/help/${s.id}`,
    group: "Help",
    keywords: (s as { keywords?: string[] }).keywords?.join(" "),
  })),
  { label: "Poster gallery", href: "/gallery", group: "Posters" },
];

/** ⌘K / Ctrl+K: the site's version of the app's Universal Spotlight. */
export default function CommandPaletteDialog({ initialOpen = true }: { initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("nt:palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("nt:palette", onOpen);
    };
  }, []);

  const groups = [...new Set(items.map((i) => i.group))];
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="scrim" />
        <Dialog.Content className="palette glass" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">Search NOTtEodo</Dialog.Title>
          <Command label="Search the site" loop>
            <div className="palette__input">
              <Search size={18} strokeWidth={1.6} aria-hidden />
              <Command.Input placeholder="Search features, help, pages" autoFocus />
              <kbd>esc</kbd>
            </div>
            <Command.List className="palette__list">
              <Command.Empty className="palette__empty">Nothing matches. Try budget, widgets or delete.</Command.Empty>
              {groups.map((g) => (
                <Command.Group key={g} heading={g}>
                  {items
                    .filter((i) => i.group === g)
                    .map((i) => (
                      <Command.Item
                        key={g + i.href}
                        value={`${i.label} ${i.keywords ?? ""} ${g} ${i.href}`}
                        onSelect={() => {
                          setOpen(false);
                          router.push(i.href);
                        }}
                      >
                        <span>{i.label}</span>
                        <span className="palette__path">{i.href}</span>
                      </Command.Item>
                    ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
