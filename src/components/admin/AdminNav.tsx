"use client";

import {
  Bot,
  Cloud,
  Database,
  LayoutDashboard,
  MessageSquareHeart,
  PackageCheck,
  PanelsTopLeft,
  Scale,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Terminal,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_TABS } from "@/lib/admin-tabs";

const ICONS = { LayoutDashboard, Users, Cloud, Database, Bot, Terminal, MessageSquareHeart, Smartphone, PackageCheck, SlidersHorizontal, Sparkles, Scale, PanelsTopLeft };

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="admin__nav">
      {ADMIN_TABS.map((t) => {
        const Icon = ICONS[t.icon as keyof typeof ICONS];
        const active = t.href === "/admin" ? path === "/admin" : path?.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined}>
            <Icon size={15} strokeWidth={1.7} aria-hidden className="cards-only" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
