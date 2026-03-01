"use client";

import { useState, useEffect } from "react";

interface TrendyolConfig {
  supplierId: string;
  apiKey: string;
  apiSecret: string;
}

interface Stats {
  totalProducts: number;
  syncedProducts: number;
  failedProducts: number;
  pendingProducts: number;
  totalOrders: number;
}

export default function TrendyolSettingsPage() {
  const [config, setConfig] = useState<TrendyolConfig>({
    supplierId: "",
    apiKey: "",
    apiSecret: "",
  });
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetchConfig();
    fetchStats();
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch("/api/admin/integrations");
      const data = await res.json();
      const trendyol = data.find?.((i: any) => i.service === "trendyol");
      if (trendyol) {
        setIsActive(trendyol.isActive);
        if (trendyol.config) {
          setConfig({
            supplierId: trendyol.config.supplierId || "",
            apiKey: trendyol.config.apiKey || "",
            apiSecret: trendyol.config.apiSecret || "",
          });
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        fetch("/api/admin/marketplace/trendyol/products?size=1"),
        fetch("/api/admin/marketplace/trendyol/orders?size=1"),
      ]);
      const products = await productsRes.json();
      const orders = await ordersRes.json();
      
      // Ayrıntılı istatistikler
      const syncedRes = await fetch("/api/admin/marketplace/trendyol/products?size=1&syncStatus=SYNCED");
      const failedRes = await fetch("/api/admin/marketplace/trendyol/products?size=1&syncStatus=FAILED");
      const pendingRes = await fetch("/api/admin/marketplace/trendyol/products?size=1&syncStatus=PENDING");
      const synced = await syncedRes.json();
      const failed = await failedRes.json();
      const pending = await pendingRes.json();

      setStats({
        totalProducts: products.total || 0,
        syncedProducts: synced.total || 0,
        failedProducts: failed.total || 0,
        pendingProducts: pending.total || 0,
        totalOrders: orders.total || 0,
      });
    } catch {}
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Upsert integration
      await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: "trendyol",
          isActive,
          config,
        }),
      });
      alert("Ayarlar kaydedildi");
    } catch {
      alert("Kaydetme hatası");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      // Geçici kaydet
      await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: "trendyol", isActive: true, config }),
      });

      // Kategori çekmeyi test et
      const res = await fetch("/api/admin/marketplace/trendyol/categories", {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setTestResult({ success: true, message: `Bağlantı başarılı! ${data.total} kategori bulundu.` });
      } else {
        setTestResult({ success: false, message: data.error || "Bağlantı başarısız" });
      }
    } catch (err) {
      setTestResult({ success: false, message: "Bağlantı hatası" });
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-40 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trendyol Entegrasyonu</h1>
        <p className="text-muted-foreground mt-1">
          Trendyol pazaryeri API bağlantı ayarları ve senkronizasyon durumu
        </p>
      </div>

      {/* İstatistikler */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Toplam Ürün", value: stats.totalProducts, color: "text-blue-600" },
            { label: "Senkronize", value: stats.syncedProducts, color: "text-green-600" },
            { label: "Bekleyen", value: stats.pendingProducts, color: "text-yellow-600" },
            { label: "Başarısız", value: stats.failedProducts, color: "text-red-600" },
            { label: "Siparişler", value: stats.totalOrders, color: "text-purple-600" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* API Ayarları */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">API Kimlik Bilgileri</h2>
        <p className="text-sm text-muted-foreground">
          Trendyol Satıcı Paneli → Hesap Bilgilerim → Entegrasyon Bilgileri'nden alabilirsiniz.
        </p>

        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Supplier ID (Satıcı No)</label>
            <input
              type="text"
              value={config.supplierId}
              onChange={(e) => setConfig((c) => ({ ...c, supplierId: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
              placeholder="123456"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">API Key</label>
            <input
              type="text"
              value={config.apiKey}
              onChange={(e) => setConfig((c) => ({ ...c, apiKey: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
              placeholder="API anahtarınız"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">API Secret</label>
            <input
              type="password"
              value={config.apiSecret}
              onChange={(e) => setConfig((c) => ({ ...c, apiSecret: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
              placeholder="API gizli anahtarınız"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Entegrasyon Aktif</span>
          </label>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-lg text-sm ${
              testResult.success
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {testResult.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <button
            onClick={handleTest}
            disabled={testing || !config.supplierId || !config.apiKey || !config.apiSecret}
            className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50"
          >
            {testing ? "Test Ediliyor..." : "Bağlantıyı Test Et"}
          </button>
        </div>
      </div>
    </div>
  );
}
