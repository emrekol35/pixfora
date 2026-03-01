"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
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
    children: [
      { title: "Tum Siparisler", href: "/admin/siparisler" },
      { title: "Iadeler", href: "/admin/iadeler" },
    ],
  },
  {
    title: "Kargo",
    href: "/admin/kargo",
    icon: "🚚",
  },
  {
    title: "Musteriler",
    href: "/admin/musteriler",
    icon: "👥",
    children: [
      { title: "Tum Musteriler", href: "/admin/musteriler" },
      { title: "Musteri Gruplari", href: "/admin/musteriler/gruplar" },
    ],
  },
  {
    title: "Mesajlar",
    href: "/admin/mesajlar",
    icon: "💬",
  },
  {
    title: "Indirimler",
    href: "/admin/indirimler",
    icon: "🎫",
    children: [
      { title: "Kuponlar", href: "/admin/indirimler" },
      { title: "Kampanyalar", href: "/admin/indirimler/kampanyalar" },
      { title: "Yorumlar", href: "/admin/indirimler/yorumlar" },
    ],
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
      { title: "Duyurular", href: "/admin/icerik/duyurular" },
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
    children: [
      { title: "Genel Bakis", href: "/admin/raporlar" },
      { title: "Satis Raporu", href: "/admin/raporlar/satis" },
      { title: "Urun Performansi", href: "/admin/raporlar/urunler" },
      { title: "Musteri Analizi", href: "/admin/raporlar/musteriler" },
      { title: "Kargo Performansi", href: "/admin/raporlar/kargo" },
      { title: "Iade Analizi", href: "/admin/raporlar/iadeler" },
    ],
  },
  {
    title: "A/B Testleri",
    href: "/admin/ab-testleri",
    icon: "🧪",
    children: [
      { title: "Tüm Testler", href: "/admin/ab-testleri" },
      { title: "Yeni Test", href: "/admin/ab-testleri/yeni" },
      { title: "Dönüşüm Hunisi", href: "/admin/ab-testleri/huni" },
      { title: "Event Analizi", href: "/admin/ab-testleri/eventler" },
    ],
  },
  {
    title: "Entegrasyonlar",
    href: "/admin/entegrasyonlar",
    icon: "🔗",
    children: [
      { title: "Tum Entegrasyonlar", href: "/admin/entegrasyonlar" },
      { title: "E-posta Sablonlari", href: "/admin/entegrasyonlar/sablonlar" },
    ],
  },
  {
    title: "E-Bulten",
    href: "/admin/bueltenler",
    icon: "📧",
  },
  {
    title: "Push Bildirimler",
    href: "/admin/bildirimler",
    icon: "🔔",
  },
  {
    title: "Sorular",
    href: "/admin/sorular",
    icon: "❓",
  },
  {
    title: "Otomasyon",
    href: "/admin/otomasyon",
    icon: "🤖",
  },
  {
    title: "Aktiviteler",
    href: "/admin/aktiviteler",
    icon: "📋",
  },
  {
    title: "Çeviriler",
    href: "/admin/ceviriler",
    icon: "🌐",
    children: [
      { title: "Genel Bakış", href: "/admin/ceviriler" },
      { title: "Ürünler", href: "/admin/ceviriler/product" },
      { title: "Kategoriler", href: "/admin/ceviriler/category" },
      { title: "Markalar", href: "/admin/ceviriler/brand" },
      { title: "Sayfalar", href: "/admin/ceviriler/page" },
      { title: "Blog", href: "/admin/ceviriler/blogPost" },
    ],
  },
  {
    title: "Ayarlar",
    href: "/admin/ayarlar",
    icon: "⚙️",
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  // Mobilde sayfa degistiginde sidebar'i kapat
  useEffect(() => {
    if (onClose) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Mobilde body scroll kilitle
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <Link href="/admin" className="text-xl font-bold text-primary">
          Pixfora Admin
        </Link>
        {/* Mobilde kapat butonu */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1 text-muted-foreground hover:text-foreground"
            aria-label="Menuyu kapat"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
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
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 min-h-screen bg-sidebar border-r border-border flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobil Sidebar Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside className="relative z-10 w-72 max-w-[85vw] bg-sidebar flex flex-col shadow-2xl animate-slide-in-left">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
