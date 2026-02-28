"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  stockAlertEnabled: boolean;
  stockAlertThreshold: number;
  stockAlertEmail: string;
  lastStockAlertAt: string | null;
  lowStockCount: number;
  abandonedCartUserCount: number;
  pushSubscriberCount?: number;
}

export default function AutomationDashboard({
  stockAlertEnabled,
  stockAlertThreshold,
  stockAlertEmail,
  lastStockAlertAt,
  lowStockCount,
  abandonedCartUserCount,
  pushSubscriberCount = 0,
}: Props) {
  const [stockAlertLoading, setStockAlertLoading] = useState(false);
  const [stockAlertResult, setStockAlertResult] = useState<string | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartResult, setCartResult] = useState<string | null>(null);

  const triggerStockAlert = async () => {
    setStockAlertLoading(true);
    setStockAlertResult(null);
    try {
      const res = await fetch("/api/cron/stock-alerts", {
        headers: { Authorization: `Bearer ${prompt("CRON_SECRET girin:")}` },
      });
      const data = await res.json();
      if (res.ok) {
        setStockAlertResult(data.message || "Basarili");
      } else {
        setStockAlertResult(`Hata: ${data.error || "Bilinmeyen hata"}`);
      }
    } catch {
      setStockAlertResult("Baglanti hatasi");
    } finally {
      setStockAlertLoading(false);
    }
  };

  const triggerAbandonedCarts = async () => {
    setCartLoading(true);
    setCartResult(null);
    try {
      const res = await fetch("/api/cron/abandoned-carts", {
        headers: { Authorization: `Bearer ${prompt("CRON_SECRET girin:")}` },
      });
      const data = await res.json();
      if (res.ok) {
        setCartResult(data.message || "Basarili");
      } else {
        setCartResult(`Hata: ${data.error || "Bilinmeyen hata"}`);
      }
    } catch {
      setCartResult("Baglanti hatasi");
    } finally {
      setCartLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Stok Uyari Karti */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-lg">
            📦
          </div>
          <div>
            <h2 className="font-bold text-lg">Stok Uyarilari</h2>
            <p className="text-sm text-muted-foreground">
              Dusuk stoklu urunler icin admin e-postasi
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Durum</span>
            <span className={stockAlertEnabled ? "text-success font-medium" : "text-muted-foreground"}>
              {stockAlertEnabled ? "Aktif" : "Devre Disi"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Esik Degeri</span>
            <span>{stockAlertThreshold} adet</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Uyari E-postasi</span>
            <span className="truncate ml-2">{stockAlertEmail || "Ayarlanmamis"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Dusuk Stoklu Urun</span>
            <span className={lowStockCount > 0 ? "text-danger font-bold" : ""}>
              {lowStockCount} urun
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Son Uyari</span>
            <span>{lastStockAlertAt ? formatDate(lastStockAlertAt) : "Henuz gonderilmedi"}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={triggerStockAlert}
            disabled={stockAlertLoading || !stockAlertEnabled}
            className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {stockAlertLoading ? "Calisiyor..." : "Manuel Tetikle"}
          </button>
          <Link
            href="/admin/ayarlar"
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            Ayarlar
          </Link>
        </div>

        {stockAlertResult && (
          <p className={`mt-3 text-sm p-2 rounded ${stockAlertResult.startsWith("Hata") ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>
            {stockAlertResult}
          </p>
        )}
      </div>

      {/* Terk Edilen Sepet Karti */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg">
            🛒
          </div>
          <div>
            <h2 className="font-bold text-lg">Terk Edilen Sepetler</h2>
            <p className="text-sm text-muted-foreground">
              Sepetindeki urunleri birakanlara e-posta
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Bekleme Suresi</span>
            <span>2 saat</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tekrar Gonderim Arasi</span>
            <span>3 gun</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Bekleyen Kullanici</span>
            <span className={abandonedCartUserCount > 0 ? "text-warning font-bold" : ""}>
              {abandonedCartUserCount} kullanici
            </span>
          </div>
        </div>

        <button
          onClick={triggerAbandonedCarts}
          disabled={cartLoading}
          className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {cartLoading ? "Calisiyor..." : "Manuel Tetikle"}
        </button>

        {cartResult && (
          <p className={`mt-3 text-sm p-2 rounded ${cartResult.startsWith("Hata") ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>
            {cartResult}
          </p>
        )}
      </div>

      {/* Cron Bilgilendirme */}
      <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
        <h3 className="font-bold mb-3">Cron Yapılandırması</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Otomatik calisma icin asagidaki cron job'lari sunucunuza ekleyiniz:
        </p>
        <div className="space-y-3">
          <div className="bg-muted rounded-lg p-3 font-mono text-sm overflow-x-auto">
            <p className="text-muted-foreground text-xs mb-1"># Her gun sabah 09:00 - Stok uyarisi</p>
            <p>0 9 * * * curl -s -H &quot;Authorization: Bearer $CRON_SECRET&quot; https://YOUR_DOMAIN/api/cron/stock-alerts</p>
          </div>
          <div className="bg-muted rounded-lg p-3 font-mono text-sm overflow-x-auto">
            <p className="text-muted-foreground text-xs mb-1"># Her 6 saatte bir - Terk edilen sepet</p>
            <p>0 */6 * * * curl -s -H &quot;Authorization: Bearer $CRON_SECRET&quot; https://YOUR_DOMAIN/api/cron/abandoned-carts</p>
          </div>
          <div className="bg-muted rounded-lg p-3 font-mono text-sm overflow-x-auto">
            <p className="text-muted-foreground text-xs mb-1"># Haftada bir - Push subscription temizligi</p>
            <p>0 3 * * 1 curl -s -X POST -H &quot;Authorization: Bearer $CRON_SECRET&quot; https://YOUR_DOMAIN/api/cron/push-cleanup</p>
          </div>
        </div>
      </div>

      {/* Push Bildirimleri */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <h2 className="font-semibold">Push Bildirimler</h2>
              <p className="text-sm text-muted-foreground">Web push bildirim aboneleri</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-primary">{pushSubscriberCount}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Toplam {pushSubscriberCount} push bildirim abonesi. Toplu bildirim gondermek icin Push Bildirimler sayfasini kullanin.
        </p>
        <Link
          href="/admin/bildirimler"
          className="inline-block px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          Push Bildirim Gonder
        </Link>
      </div>
    </div>
  );
}
