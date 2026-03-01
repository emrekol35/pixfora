"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface TrendyolOrderItem {
  id: string;
  trendyolOrderNumber: string;
  trendyolPackageId: string | null;
  shipmentPackageStatus: string | null;
  syncedAt: string;
  rawData: any;
  order: { id: string; orderNumber: string; status: string; total: number } | null;
}

const STATUS_COLORS: Record<string, string> = {
  Created: "bg-blue-100 text-blue-700",
  Picking: "bg-yellow-100 text-yellow-700",
  Invoiced: "bg-orange-100 text-orange-700",
  Shipped: "bg-purple-100 text-purple-700",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
  UnSupplied: "bg-gray-100 text-gray-600",
};

export default function TrendyolOrdersPage() {
  const [orders, setOrders] = useState<TrendyolOrderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<TrendyolOrderItem | null>(null);
  const [statusModal, setStatusModal] = useState<{ id: string; packageId: string } | null>(null);
  const [newStatus, setNewStatus] = useState("Picking");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [cargoCode, setCargoCode] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: "20" });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/marketplace/trendyol/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch {} finally { setLoading(false); }
  }, [search, status, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function handlePull() {
    setPulling(true);
    try {
      const res = await fetch("/api/admin/marketplace/trendyol/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || `${data.synced} sipariş senkronize edildi`);
        fetchOrders();
      } else { alert(data.error || "Sipariş çekme hatası"); }
    } catch { alert("Sipariş çekme hatası"); } finally { setPulling(false); }
  }

  async function handleStatusUpdate() {
    if (!statusModal) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/marketplace/trendyol/orders/${statusModal.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, trackingNumber: trackingNumber || undefined, cargoProviderCode: cargoCode || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Durum güncellendi");
        setStatusModal(null);
        setTrackingNumber("");
        setCargoCode("");
        fetchOrders();
      } else { alert(data.error || "Güncelleme hatası"); }
    } catch { alert("Güncelleme hatası"); } finally { setUpdatingStatus(false); }
  }

  function getTotalFromRawData(rawData: any): string {
    try {
      return `${(rawData?.totalPrice || 0).toFixed(2)} ₺`;
    } catch { return "—"; }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Trendyol Siparişleri</h1>
          <p className="text-muted-foreground mt-1">Toplam: {total} sipariş</p>
        </div>
        <button onClick={handlePull} disabled={pulling}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
          {pulling ? "Çekiliyor..." : "Siparişleri Çek"}
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Sipariş no ara..." className="flex-1 min-w-48 px-3 py-2 border border-border rounded-lg bg-background text-sm" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-border rounded-lg bg-background text-sm">
          <option value="">Tüm Durumlar</option>
          <option value="Created">Oluşturuldu</option>
          <option value="Picking">Hazırlanıyor</option>
          <option value="Invoiced">Faturalandı</option>
          <option value="Shipped">Kargoya Verildi</option>
          <option value="Delivered">Teslim Edildi</option>
          <option value="Cancelled">İptal</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Trendyol Sipariş No</th>
              <th className="text-left p-3 font-medium">Paket ID</th>
              <th className="text-center p-3 font-medium">Durum</th>
              <th className="text-right p-3 font-medium">Tutar</th>
              <th className="text-left p-3 font-medium">Yerel Sipariş</th>
              <th className="text-left p-3 font-medium">Tarih</th>
              <th className="text-center p-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Yükleniyor...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">
                Sipariş bulunamadı. &quot;Siparişleri Çek&quot; butonuna tıklayarak Trendyol siparişlerini çekin.
              </td></tr>
            ) : (
              orders.map((order) => {
                const statusColor = STATUS_COLORS[order.shipmentPackageStatus || ""] || "bg-gray-100 text-gray-600";
                return (
                  <tr key={order.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3 font-medium">{order.trendyolOrderNumber}</td>
                    <td className="p-3 text-muted-foreground text-xs">{order.trendyolPackageId || "—"}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${statusColor}`}>
                        {order.shipmentPackageStatus || "—"}
                      </span>
                    </td>
                    <td className="p-3 text-right">{getTotalFromRawData(order.rawData)}</td>
                    <td className="p-3">
                      {order.order ? (
                        <Link href={`/admin/siparisler/${order.order.id}`} className="text-primary text-xs hover:underline">
                          {order.order.orderNumber}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">Eşleşmedi</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(order.syncedAt).toLocaleString("tr-TR")}
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => setStatusModal({ id: order.id, packageId: order.trendyolPackageId || "" })}
                        className="px-2 py-1 text-xs border border-border rounded hover:bg-muted">
                        Durum Güncelle
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50">Önceki</button>
          <span className="px-3 py-1 text-sm text-muted-foreground">Sayfa {page + 1} / {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * 20 >= total}
            className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50">Sonraki</button>
        </div>
      )}

      {/* Durum Güncelleme Modal */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Sipariş Durumunu Güncelle</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Yeni Durum</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm">
                <option value="Picking">Hazırlanıyor (Picking)</option>
                <option value="Invoiced">Faturalandı (Invoiced)</option>
                <option value="UnSupplied">Tedarik Edilemedi (UnSupplied)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kargo Takip No (Opsiyonel)</label>
              <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" placeholder="Takip numarası" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kargo Firma Kodu (Opsiyonel)</label>
              <input type="text" value={cargoCode} onChange={(e) => setCargoCode(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" placeholder="ör: ARASKG, YURTICIKG" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setStatusModal(null)} className="px-4 py-2 border border-border rounded-lg text-sm">İptal</button>
              <button onClick={handleStatusUpdate} disabled={updatingStatus}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50">
                {updatingStatus ? "Güncelleniyor..." : "Güncelle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
