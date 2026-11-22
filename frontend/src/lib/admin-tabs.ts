/** The 13 tabs, in the app's order first, then the web additions. Labels match the app. */
export const ADMIN_TABS = [
  { href: "/admin", label: "Overview", icon: "LayoutDashboard" },
  { href: "/admin/users", label: "Users & Sub-Admins", icon: "Users" },
  { href: "/admin/cloud", label: "Cloud & Network", icon: "Cloud" },
  { href: "/admin/database", label: "Database & Vault", icon: "Database" },
  { href: "/admin/ai", label: "AI Engine", icon: "Bot" },
  { href: "/admin/alerts", label: "Alerts & Logs", icon: "Terminal" },
  { href: "/admin/feedback", label: "User Voice", icon: "MessageSquareHeart" },
  { href: "/admin/screens", label: "Screen Inspector & Flows", icon: "Smartphone" },
  { href: "/admin/releases", label: "Releases & APK", icon: "PackageCheck" },
  { href: "/admin/config", label: "Platform Config", icon: "SlidersHorizontal" },
  { href: "/admin/nodo", label: "Nodo Learning", icon: "Sparkles" },
  { href: "/admin/legal", label: "Legal Versions", icon: "Scale" },
  { href: "/admin/cms", label: "Website CMS", icon: "PanelsTopLeft" },
] as const;
