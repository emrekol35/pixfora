"use client";

import { useState } from "react";
import Link from "next/link";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  guestEmail: string | null;
  guestName: string | null;
  trackingNumber: string | null;
  shippingCompany: string | null;
  createdAt: string;
  items: OrderItem[];
  user: { name: string; email: string } | null;
}

interface Props {
  orders: Order[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Beklemede", color: "bg-warning/10 text-warning" },
  CONFIRMED: { label: "Onaylandi", color: "bg-info/10 text-info" },
  PROCESSING: { label: "Hazirlaniyor", color: "bg-primary/10 text-primary" },
  SHIPPED: { label: "Kargoda", color: "bg-primary/10 text-primary" },
  DELIVERED: { label: "Teslim Edildi", color: "bg-success/10 text-success" },
  CANCELLED: { label: "Iptal", color: "bg-danger/10 text-danger" },
  REFUNDED: { label: "Iade", color: "bg-muted-foreground/10 text-muted-foreground" },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Beklemede", color: "text-warning" },
  PAID: { label: "Odendi", color: "text-success" },
  FAILED: { label: "Basarisiz", color: "text-danger" },
  REFUNDED: { label: "Iade Edildi", color: "text-muted-foreground" },
};

export default function OrderList({ orders }: Props) {
  const [filter, setFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [batchProvider, setBatchProvider] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResults, setBatchResults] = useState<{ success: number; failed: number } | null>(null);

  const filteredOrders = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Durum guncellenemedi");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleOrder = (id: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      const eligible = filteredOrders.filter((o) => ["CONFIRMED", "PROCESSING"].includes(o.status));
      setSelectedOrders(new Set(eligible.map((o) => o.id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleBatchShipping = async () => {
    if (!batchProvider || selectedOrders.size === 0) return;
    if (!confirm(`${selectedOrders.size} siparis icin kargo olusturulacak. Devam?`)) return;

    setBatchLoading(true);
    setBatchResults(null);
    try {
      const res = await fetch("/api/shipping/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: Array.from(selectedOrders),
          provider: batchProvider,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBatchResults({ success: data.successCount, failed: data.failedCount });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        alert(data.error || "Toplu kargo olusturma hatasi");
      }
    } catch {
      alert("Bir hata olustu");
    } finally {
      setBatchLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price);

  return (
    <>
      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: "ALL", label: "Tumu" },
          { key: "PENDING", label: "Beklemede" },
          { key: "CONFIRMED", label: "Onaylandi" },
          { key: "PROCESSING", label: "Hazirlaniyor" },
          { key: "SHIPPED", label: "Kargoda" },
          { key: "DELIVERED", label: "Teslim" },
          { key: "CANCELLED", label: "Iptal" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f.key
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Batch Shipping Bar */}
      {selectedOrders.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <span className="text-sm font-medium">{selectedOrders.size} siparis secili</span>
          <select
            value={batchProvider}
            onChange={(e) => setBatchProvider(e.target.value)}
            className="px-3 py-1.5 border border-border rounded-lg text-sm"
          >
            <option value="">Kargo Firmasi Sec</option>
            <option value="yurtici">Yurtici Kargo</option>
            <option value="aras">Aras Kargo</option>
            <option value="mng">MNG Kargo</option>
          </select>
          <button
            onClick={handleBatchShipping}
            disabled={!batchProvider || batchLoading}
            className="px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {batchLoading ? "Olusturuluyor..." : "Toplu Kargo Olustur"}
          </button>
          <button
            onClick={() => setSelectedOrders(new Set())}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Temizle
          </button>
          {batchResults && (
            <span className="text-sm text-success font-medium">
              {batchResults.success} basarili, {batchResults.failed} basarisiz
            </span>
          )}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="w-4 h-4"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium">Siparis No</th>
                <th className="text-left px-4 py-3 font-medium">Musteri</th>
                <th className="text-left px-4 py-3 font-medium">Urunler</th>
                <th className="text-left px-4 py-3 font-medium">Toplam</th>
                <th className="text-left px-4 py-3 font-medium">Odeme</th>
                <th className="text-left px-4 py-3 font-medium">Durum</th>
                <th className="text-left px-4 py-3 font-medium">Tarih</th>
                <th className="text-left px-4 py-3 font-medium">Islem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map((order) => {
                const status = STATUS_MAP[order.status] || { label: order.status, color: "bg-muted" };
                const payStatus = PAYMENT_STATUS_MAP[order.paymentStatus] || { label: order.paymentStatus, color: "" };
                const customerName = order.user?.name || order.guestName || "-";
                const customerEmail = order.user?.email || order.guestEmail || "";

                return (
                  <tr key={order.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => toggleOrder(order.id)}
                        disabled={!["CONFIRMED", "PROCESSING"].includes(order.status)}
                        className="w-4 h-4 disabled:opacity-30"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/siparisler/${order.id}`} className="font-medium text-primary hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{customerName}</p>
                      {customerEmail && (
                        <p className="text-xs text-muted-foreground">{customerEmail}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {order.items.slice(0, 2).map((item) => (
                        <div key={item.id}>{item.quantity}x {item.name}</div>
                      ))}
                      {order.items.length > 2 && (
                        <span className="text-muted-foreground">+{order.items.length - 2} urun</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${payStatus.color}`}>
                        {payStatus.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        className="text-xs border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="PENDING">Beklemede</option>
                        <option value="CONFIRMED">Onaylandi</option>
                        <option value="PROCESSING">Hazirlaniyor</option>
                        <option value="SHIPPED">Kargoda</option>
                        <option value="DELIVERED">Teslim</option>
                        <option value="CANCELLED">Iptal</option>
                        <option value="REFUNDED">Iade</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Siparis bulunamadi
          </div>
        )}
      </div>
    </>
  );
}
