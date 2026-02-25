"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: "📊",
  },
  {
    title: "Urunler",
    href: "/admin/urunler",
    icon: "📦",
    children: [
      { title: "Tum Urunler", href: "/admin/urunler" },
      { title: "Yeni Urun", href: "/admin/urunler/yeni" },
    ],
  },
  {
    title: "Kategoriler",
    href: "/admin/kategoriler",
    icon: "📁",
  },
  {
    title: "Markalar",
    href: "/admin/markalar",
    icon: "🏷️",
  },
  {
    title: "Siparisler",
    href: "/admin/siparisler",
    icon: "🛒",
  },
  {
    title: "Musteriler",
    href: "/admin/musteriler",
    icon: "👥",
  },
  {
    title: "Indirimler",
    href: "/admin/indirimler",
    icon: "🎫",
  },
  {
    title: "Icerik",
    href: "/admin/icerik",
    icon: "📝",
    children: [
      { title: "Sayfalar", href: "/admin/icerik/sayfalar" },
      { title: "Blog", href: "/admin/icerik/blog" },
      { title: "Sliderlar", href: "/admin/icerik/sliderlar" },
      { title: "Menuler", href: "/admin/icerik/menuler" },
      { title: "Pop-uplar", href: "/admin/icerik/popuplar" },
    ],
  },
  {
    title: "SEO",
    href: "/admin/seo",
    icon: "🔍",
  },
  {
    title: "Medya",
    href: "/admin/medya",
    icon: "🖼️",
  },
  {
    title: "Raporlar",
    href: "/admin/raporlar",
    icon: "📈",
  },
  {
    title: "Entegrasyonlar",
    href: "/admin/entegrasyonlar",
    icon: "🔗",
  },
  {
    title: "Ayarlar",
    href: "/admin/ayarlar",
    icon: "⚙️",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <Link href="/admin" className="text-xl font-bold text-primary">
          Pixfora Admin
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.children &&
              item.children.some((child) => pathname === child.href));

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-sidebar-foreground hover:bg-muted"
                )}
              >
                <span>{item.icon}</span>
                <span>{item.title}</span>
              </Link>
              {isActive && item.children && (
                <div className="ml-9 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "block px-3 py-1.5 rounded text-sm transition-colors",
                        pathname === child.href
                          ? "text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {child.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Magazaya Don
        </Link>
      </div>
    </aside>
  );
}
