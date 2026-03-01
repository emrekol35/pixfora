"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MarketplaceStatItem {
  connected: boolean;
  totalProducts: number;
  syncedProducts: number;
  pendingProducts: number;
  failedProducts: number;
}

interface MarketplaceStats {
  trendyol: MarketplaceStatItem;
  hepsiburada: MarketplaceStatItem;
  n11: MarketplaceStatItem;
}

const defaultStat: MarketplaceStatItem = {
  connected: false,
  totalProducts: 0,
  syncedProducts: 0,
  pendingProducts: 0,
  failedProducts: 0,
};

export default function PazaryerleriPage() {
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const intRes = await fetch("/api/integrations");
        const intData = await intRes.json();
        const integrations = intData.integrations || (Array.isArray(intData) ? intData : []);

        const trendyolInt = integrations.find(
          (i: { service: string }) => i.service === "trendyol"
        );
        const hepsiburadaInt = integrations.find(
          (i: { service: string }) => i.service === "hepsiburada"
        );

        // Trendyol stats
        let trendyolStats = { ...defaultStat };
        if (trendyolInt?.isActive) {
          trendyolStats.connected = true;
          try {
            const prodRes = await fetch("/api/admin/marketplace/trendyol/products?size=1");
            const prodData = await prodRes.json();
            trendyolStats.totalProducts = prodData.total || 0;
          } catch {}
        }

        // Hepsiburada stats
        let hepsiburadaStats = { ...defaultStat };
        if (hepsiburadaInt?.isActive) {
          hepsiburadaStats.connected = true;
          try {
            const prodRes = await fetch("/api/admin/marketplace/hepsiburada/products?size=1");
            const prodData = await prodRes.json();
            hepsiburadaStats.totalProducts = prodData.total || 0;
          } catch {}
        }

        // N11 stats
        const n11Int = integrations.find(
          (i: { service: string }) => i.service === "n11"
        );
        let n11Stats = { ...defaultStat };
        if (n11Int?.isActive) {
          n11Stats.connected = true;
          try {
            const prodRes = await fetch("/api/admin/marketplace/n11/products?size=1");
            const prodData = await prodRes.json();
            n11Stats.totalProducts = prodData.total || 0;
          } catch {}
        }

        setStats({
          trendyol: trendyolStats,
          hepsiburada: hepsiburadaStats,
          n11: n11Stats,
        });
      } catch {
        setStats({
          trendyol: { ...defaultStat },
          hepsiburada: { ...defaultStat },
          n11: { ...defaultStat },
        });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const marketplaces = [
    {
      name: "Trendyol",
      icon: "🛍️",
      href: "/admin/pazaryerleri/trendyol",
      color: "from-orange-500 to-orange-600",
      connected: stats?.trendyol.connected || false,
      stats: stats?.trendyol,
      available: true,
    },
    {
      name: "Hepsiburada",
      icon: "🟠",
      href: "/admin/pazaryerleri/hepsiburada",
      color: "from-amber-500 to-amber-600",
      connected: stats?.hepsiburada.connected || false,
      stats: stats?.hepsiburada,
      available: true,
    },
    {
      name: "N11",
      icon: "🟣",
      href: "/admin/pazaryerleri/n11",
      color: "from-purple-500 to-purple-600",
      connected: stats?.n11.connected || false,
      stats: stats?.n11,
      available: true,
    },
    {
      name: "Amazon",
      icon: "📦",
      href: "#",
      color: "from-yellow-500 to-yellow-600",
      connected: false,
      stats: null,
      available: false,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pazaryerleri</h1>
        <p className="text-muted-foreground mt-1">
          Tum pazaryeri entegrasyonlarinizi buradan yonetin.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Yukleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketplaces.map((mp) => (
            <div
              key={mp.name}
              className={`bg-card border border-border rounded-xl overflow-hidden ${
                !mp.available ? "opacity-60" : ""
              }`}
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${mp.color} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{mp.icon}</span>
                    <span className="text-lg font-bold">{mp.name}</span>
                  </div>
                  {mp.available ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        mp.connected
                          ? "bg-white/20 text-white"
                          : "bg-white/10 text-white/70"
                      }`}
                    >
                      {mp.connected ? "Bagli" : "Bagli Degil"}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/70">
                      Yakin Zamanda
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                {mp.available && mp.stats ? (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold">{mp.stats.totalProducts}</div>
                        <div className="text-xs text-muted-foreground">Toplam Urun</div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-green-600">{mp.stats.syncedProducts}</div>
                        <div className="text-xs text-muted-foreground">Senkronize</div>
                      </div>
                    </div>
                    <Link
                      href={mp.href}
                      className="block w-full text-center px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
                    >
                      Yonet
                    </Link>
                  </>
                ) : mp.available ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Entegrasyonu baslatmak icin ayarlari yapilandirin.
                    </p>
                    <Link
                      href={mp.href}
                      className="block w-full text-center px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
                    >
                      Ayarlari Yap
                    </Link>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Bu pazaryeri entegrasyonu yakin zamanda eklenecektir.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
