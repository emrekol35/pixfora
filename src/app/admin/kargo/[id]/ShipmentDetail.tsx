"use client";

import { useState } from "react";
import Link from "next/link";

interface TrackingEvent {
  date: string;
  status: string;
  location: string;
  description: string;
}

interface ShipmentData {
  id: string;
  shipmentNumber: string;
  provider: string;
  trackingNumber: string;
  barcode: string | null;
  status: string;
  type: string;
  senderName: string;
  senderPhone: string;
  senderCity: string;
  senderDistrict: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverCity: string;
  receiverDistrict: string;
  receiverAddress: string;
  carrierCost: number | null;
  chargedCost: number | null;
  events: TrackingEvent[] | null;
  lastPolledAt: string | null;
  returnId: string | null;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    items: { id: string; name: string; quantity: number; price: number; image: string | null }[];
  };
}

interface LogEntry {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

interface Props {
  shipment: ShipmentData;
  logs: LogEntry[];
}

const STATUS_LABELS: Record<string, string> = {
  CREATED: "Olusturuldu",
  PICKED_UP: "Teslim Alindi",
  IN_TRANSIT: "Yolda",
  OUT_FOR_DELIVERY: "Dagitimda",
  DELIVERED: "Teslim Edildi",
  RETURNED: "Iade Edildi",
  FAILED: "Basarisiz",
};

const STATUS_COLORS: Record<string, string> = {
  CREATED: "bg-primary/10 text-primary",
  PICKED_UP: "bg-info/10 text-info",
  IN_TRANSIT: "bg-warning/10 text-warning",
  OUT_FOR_DELIVERY: "bg-info/10 text-info",
  DELIVERED: "bg-success/10 text-success",
  RETURNED: "bg-muted-foreground/10 text-muted-foreground",
  FAILED: "bg-danger/10 text-danger",
};

const PROVIDER_NAMES: Record<string, string> = {
  yurtici: "Yurtici Kargo",
  aras: "Aras Kargo",
  mng: "MNG Kargo",
  ptt: "PTT Kargo",
  surat: "Surat Kargo",
};

const ALL_STATUSES = ["CREATED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "RETURNED", "FAILED"];

export default function ShipmentDetail({ shipment, logs }: Props) {
  const [status, setStatus] = useState(shipment.status);
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<TrackingEvent[]>(shipment.events || []);
  const [message, setMessage] = useState("");

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price);

  const handleStatusUpdate = async () => {
    if (status === shipment.status) return;
    setUpdating(true);
    setMessage("");
    try {
      const res = await fetch(`/api/shipping/shipments/${shipment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setMessage("Durum guncellendi");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const data = await res.json();
        setMessage(data.error || "Guncelleme basarisiz");
      }
    } catch {
      setMessage("Hata olustu");
    } finally {
      setUpdating(false);
    }
  };

  const handleRefreshTracking = async () => {
    setRefreshing(true);
    setMessage("");
    try {
      const res = await fetch(
        `/api/shipping/track/${shipment.trackingNumber}?provider=${shipment.provider}`
      );
      const data = await res.json();
      if (data.events && data.events.length > 0) {
        setEvents(data.events);
        setMessage(`Takip guncellendi: ${data.events.length} olay`);
      } else {
        setMessage("Yeni takip bilgisi yok");
      }
    } catch {
      setMessage("Takip sorgulama hatasi");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/kargo" className="text-muted-foreground hover:text-foreground text-sm">
          ← Kargo Listesi
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-mono">{shipment.shipmentNumber}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(shipment.createdAt).toLocaleDateString("tr-TR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {shipment.type === "return" && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">
              IADE KARGO
            </span>
          )}
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              STATUS_COLORS[shipment.status] || "bg-muted"
            }`}
          >
            {STATUS_LABELS[shipment.status] || shipment.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Ana Icerik */}
        <div className="lg:col-span-2 space-y-6">
          {/* Kargo Bilgileri */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-bold mb-4">Kargo Bilgileri</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Kargo Firmasi</p>
                <p className="font-medium">{PROVIDER_NAMES[shipment.provider] || shipment.provider}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Takip Numarasi</p>
                <p className="font-mono font-bold">{shipment.trackingNumber}</p>
              </div>
              {shipment.barcode && (
                <div>
                  <p className="text-muted-foreground">Barkod</p>
                  <p className="font-mono">{shipment.barcode}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Son Sorgu</p>
                <p>
                  {shipment.lastPolledAt
                    ? new Date(shipment.lastPolledAt).toLocaleString("tr-TR")
                    : "Henuz sorgulanmadi"}
                </p>
              </div>
            </div>

            {/* Maliyet */}
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Musteriye Fatura Edilen</p>
                <p className="font-bold">{shipment.chargedCost != null ? formatPrice(shipment.chargedCost) : "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Kargo Firmasi Maliyeti</p>
                <p className="font-bold">{shipment.carrierCost != null ? formatPrice(shipment.carrierCost) : "-"}</p>
              </div>
            </div>
          </div>

          {/* Adresler */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-bold mb-4">Adres Bilgileri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-muted-foreground font-medium mb-2">Gonderici</p>
                <p className="font-medium">{shipment.senderName}</p>
                <p>{shipment.senderPhone}</p>
                <p>{shipment.senderAddress}</p>
                <p>{shipment.senderDistrict}, {shipment.senderCity}</p>
              </div>
              <div>
                <p className="text-muted-foreground font-medium mb-2">Alici</p>
                <p className="font-medium">{shipment.receiverName}</p>
                <p>{shipment.receiverPhone}</p>
                <p>{shipment.receiverAddress}</p>
                <p>{shipment.receiverDistrict}, {shipment.receiverCity}</p>
              </div>
            </div>
          </div>

          {/* Takip Timeline */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Kargo Takip Gecmisi</h2>
              <button
                onClick={handleRefreshTracking}
                disabled={refreshing}
                className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50"
              >
                {refreshing ? "Sorgulanıyor..." : "Takibi Yenile"}
              </button>
            </div>

            {events.length > 0 ? (
              <div className="space-y-0">
                {events.map((event, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full shrink-0 ${
                          i === 0 ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                      />
                      {i < events.length - 1 && <div className="w-0.5 h-full bg-border min-h-[32px]" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">{event.description || event.status}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                        {event.location && <span>{event.location}</span>}
                        {event.date && (
                          <span>{new Date(event.date).toLocaleString("tr-TR")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Henuz takip bilgisi yok</p>
            )}
          </div>

          {/* Siparis Kalemleri */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Siparis Kalemleri</h2>
              <Link
                href={`/admin/siparisler/${shipment.order.id}`}
                className="text-xs text-primary hover:underline"
              >
                Siparis Detayi →
              </Link>
            </div>
            <div className="space-y-3">
              {shipment.order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-10 rounded object-cover border border-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs">📦</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} adet × {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sag: Sidebar */}
        <div className="space-y-6">
          {/* Durum Guncelleme */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-bold mb-4">Durum Guncelle</h2>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm mb-3"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s] || s}
                </option>
              ))}
            </select>
            <button
              onClick={handleStatusUpdate}
              disabled={updating || status === shipment.status}
              className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {updating ? "Guncelleniyor..." : "Guncelle"}
            </button>
            {message && (
              <p className="text-xs text-center mt-2 text-muted-foreground">{message}</p>
            )}
          </div>

          {/* Musteri Bilgisi */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-bold mb-4">Musteri</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Ad:</span>{" "}
                <span className="font-medium">{shipment.order.customerName}</span>
              </p>
              {shipment.order.customerEmail && (
                <p>
                  <span className="text-muted-foreground">E-posta:</span>{" "}
                  <span>{shipment.order.customerEmail}</span>
                </p>
              )}
              {shipment.order.customerPhone && (
                <p>
                  <span className="text-muted-foreground">Telefon:</span>{" "}
                  <span>{shipment.order.customerPhone}</span>
                </p>
              )}
            </div>
          </div>

          {/* Siparis Bilgisi */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-bold mb-4">Siparis</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Siparis No:</span>{" "}
                <Link href={`/admin/siparisler/${shipment.order.id}`} className="text-primary hover:underline font-medium">
                  {shipment.order.orderNumber}
                </Link>
              </p>
            </div>
          </div>

          {/* Iade Linki */}
          {shipment.returnId && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-bold mb-4">Iade</h2>
              <Link
                href={`/admin/iadeler/${shipment.returnId}`}
                className="text-sm text-primary hover:underline"
              >
                Iade Detayina Git →
              </Link>
            </div>
          )}

          {/* Activity Log */}
          {logs.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-bold mb-4">Islem Gecmisi</h2>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="text-xs border-b border-border pb-2 last:border-0">
                    <p className="font-medium">{log.action}</p>
                    {log.details && (
                      <p className="text-muted-foreground mt-0.5">
                        {Object.entries(log.details)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(", ")}
                      </p>
                    )}
                    <p className="text-muted-foreground mt-0.5">
                      {new Date(log.createdAt).toLocaleString("tr-TR")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
