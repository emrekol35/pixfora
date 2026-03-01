"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Genel Ayarlar", href: "/admin/pazaryerleri/n11" },
  { label: "Kategoriler", href: "/admin/pazaryerleri/n11/kategoriler" },
  { label: "Ürünler", href: "/admin/pazaryerleri/n11/urunler" },
  { label: "Siparişler", href: "/admin/pazaryerleri/n11/siparisler" },
];

export default function N11Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      {/* N11 Header */}
      <div className="border-b border-border bg-card px-6 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🟣</span>
          <h1 className="text-xl font-bold">N11</h1>
        </div>
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
