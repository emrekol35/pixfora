"use client";

import { useState } from "react";

interface TrackingEvent {
  date: string;
  status: string;
  location: string;
  description: string;
}

interface TrackingOrder {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  trackingNumber: string | null;
  shippingCompany: string | null;
  createdAt: string;
  updatedAt: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    total: number;
    image: string | null;
  }[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    city: string;
    district: string;
  } | null;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Beklemede",
  CONFIRMED: "Onaylandi",
  PROCESSING: "Hazirlaniyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "Iptal Edildi",
  REFUNDED: "Iade Edildi",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

const SHIPPING_NAMES: Record<string, string> = {
  yurtici: "Yurtici Kargo",
  aras: "Aras Kargo",
  mng: "MNG Kargo",
  ptt: "PTT Kargo",
  surat: "Surat Kargo",
};

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export default function OrderTrackingClient() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !email) return;

    setLoading(true);
    setError("");
    setOrder(null);
    setTrackingEvents([]);

    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(data.order);
        setTrackingEvents(data.trackingEvents || []);
      } else {
        setError(data.error || "Siparis bulunamadi");
      }
    } catch {
      setError("Bir hata olustu. Lutfen tekrar deneyiniz.");
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Form */}
      <div className="bg-white rounded-xl border border-border p-6 mb-8">
        <h2 className="text-lg font-bold mb-4">Siparisinizi Takip Edin</h2>
        <form onSubmit={handleTrack} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Siparis Numarasi</label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="ORD-XXXXXX"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">E-posta Adresiniz</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="ornek@email.com"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !orderNumber || !email}
            className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:bg-muted disabled:text-muted-foreground transition-colors"
          >
            {loading ? "Sorgulanıyor..." : "Siparis Sorgula"}
          </button>
        </form>
        {error && (
          <div className="mt-4 p-3 bg-danger/10 text-danger text-sm rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Sonuc */}
      {order && (
        <div className="space-y-6">
          {/* Durum ozeti */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg">Siparis #{order.orderNumber}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] || "bg-muted text-muted-foreground"}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>

            {/* Timeline */}
            {order.status !== "CANCELLED" && order.status !== "REFUNDED" && (
              <div className="relative">
                <div className="flex items-center justify-between">
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    return (
                      <div key={step} className="flex flex-col items-center relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          isCompleted
                            ? isCurrent
                              ? "bg-primary text-white ring-4 ring-primary/20"
                              : "bg-success text-white"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {isCompleted && !isCurrent ? "✓" : idx + 1}
                        </div>
                        <span className={`text-[10px] sm:text-xs mt-1.5 text-center ${isCurrent ? "font-bold text-primary" : "text-muted-foreground"}`}>
                          {STATUS_LABELS[step]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Connecting line */}
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted -z-0">
                  <div
                    className="h-full bg-success transition-all"
                    style={{ width: `${Math.max(0, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Kargo takip */}
          {order.trackingNumber && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="font-bold mb-4">Kargo Takibi</h3>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-4">
                <span className="text-lg">📦</span>
                <div>
                  <p className="text-sm font-medium">
                    {SHIPPING_NAMES[order.shippingCompany || ""] || order.shippingCompany || "Kargo"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">{order.trackingNumber}</p>
                </div>
              </div>

              {trackingEvents.length > 0 ? (
                <div className="relative pl-6">
                  {trackingEvents.map((event, idx) => (
                    <div key={idx} className="relative pb-6 last:pb-0">
                      {/* Line */}
                      {idx < trackingEvents.length - 1 && (
                        <div className="absolute left-[-16px] top-3 w-0.5 h-full bg-border" />
                      )}
                      {/* Dot */}
                      <div className={`absolute left-[-20px] top-1.5 w-3 h-3 rounded-full border-2 ${
                        idx === 0 ? "bg-primary border-primary" : "bg-white border-border"
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{event.description || event.status}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {event.location && `${event.location} • `}
                          {event.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Kargo takip bilgisi henuz mevcut degil.</p>
              )}
            </div>
          )}

          {/* Siparis detaylari */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-bold mb-4">Siparis Detaylari</h3>
            <div className="space-y-3 mb-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <div className="w-12 h-12 bg-muted rounded overflow-hidden shrink-0">
                    {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} adet x {formatPrice(item.price)}</p>
                  </div>
                  <span className="font-medium">{formatPrice(item.total)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ara Toplam</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kargo</span>
                <span>{order.shippingCost === 0 ? "Ucretsiz" : formatPrice(order.shippingCost)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Indirim</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                <span>Toplam</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Teslimat adresi */}
          {order.shippingAddress && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="font-bold mb-2">Teslimat Adresi</h3>
              <p className="text-sm text-muted-foreground">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName} — {order.shippingAddress.district}/{order.shippingAddress.city}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
