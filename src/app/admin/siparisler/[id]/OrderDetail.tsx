"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    subtotal: number;
    shippingCost: number;
    discount: number;
    total: number;
    note: string | null;
    trackingNumber: string | null;
    shippingCompany: string | null;
    guestEmail: string | null;
    guestName: string | null;
    guestPhone: string | null;
    createdAt: string;
    updatedAt: string;
    items: {
      id: string;
      name: string;
      sku: string | null;
      price: number;
      quantity: number;
      total: number;
      options: Record<string, string> | null;
      product: {
        id: string;
        slug: string;
        images: { url: string }[];
      };
    }[];
    user: { name: string; email: string; phone: string | null } | null;
    shippingAddress: {
      firstName: string;
      lastName: string;
      phone: string;
      city: string;
      district: string;
      address: string;
    } | null;
    payments: {
      id: string;
      method: string;
      status: string;
      amount: number;
      transactionId: string | null;
      createdAt: string;
    }[];
    coupon: {
      code: string;
      type: string;
      value: number;
    } | null;
  };
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

export default function OrderDetail({ order }: Props) {
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
  const [shippingCompany, setShippingCompany] = useState(order.shippingCompany || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          paymentStatus,
          trackingNumber: trackingNumber || null,
          shippingCompany: shippingCompany || null,
        }),
      });
      if (res.ok) {
        setMessage("Kaydedildi!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Hata olustu");
      }
    } catch {
      setMessage("Hata olustu");
    } finally {
      setSaving(false);
    }
  };

  const customer = order.user || {
    name: order.guestName || "-",
    email: order.guestEmail || "-",
    phone: order.guestPhone || "-",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/siparisler" className="text-sm text-primary hover:underline mb-1 inline-block">
            ← Siparislere Don
          </Link>
          <h1 className="text-2xl font-bold">Siparis #{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleString("tr-TR")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-bold mb-4">Siparis Kalemleri</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 pb-3 border-b border-border last:border-0">
                  <div className="w-14 h-14 bg-muted rounded-lg overflow-hidden shrink-0">
                    {item.product.images[0] && (
                      <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.sku && <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>}
                    {item.options && (
                      <p className="text-xs text-muted-foreground">
                        {Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <p>{item.quantity} x {formatPrice(item.price)}</p>
                    <p className="font-bold">{formatPrice(item.total)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
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
                  <span>Indirim {order.coupon && `(${order.coupon.code})`}</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                <span>Toplam</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Customer & Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="font-bold mb-3">Musteri Bilgileri</h2>
              <div className="text-sm space-y-1.5 text-muted-foreground">
                <p><span className="text-foreground font-medium">Ad:</span> {customer.name}</p>
                <p><span className="text-foreground font-medium">E-posta:</span> {customer.email}</p>
                <p><span className="text-foreground font-medium">Telefon:</span> {customer.phone}</p>
              </div>
            </div>

            {order.shippingAddress && (
              <div className="bg-white rounded-xl border border-border p-6">
                <h2 className="font-bold mb-3">Teslimat Adresi</h2>
                <div className="text-sm text-muted-foreground">
                  <p className="text-foreground font-medium">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  <p>{order.shippingAddress.address}</p>
                  <p>{order.shippingAddress.district}/{order.shippingAddress.city}</p>
                  <p>{order.shippingAddress.phone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {order.note && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="font-bold mb-2">Siparis Notu</h2>
              <p className="text-sm text-muted-foreground">{order.note}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-bold mb-4">Durum Guncelle</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Siparis Durumu</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Odeme Durumu</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                >
                  <option value="PENDING">Beklemede</option>
                  <option value="PAID">Odendi</option>
                  <option value="FAILED">Basarisiz</option>
                  <option value="REFUNDED">Iade Edildi</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Kargo Firmasi</label>
                <select
                  value={shippingCompany}
                  onChange={(e) => setShippingCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                >
                  <option value="">Seciniz</option>
                  <option value="yurtici">Yurtici Kargo</option>
                  <option value="aras">Aras Kargo</option>
                  <option value="mng">MNG Kargo</option>
                  <option value="ptt">PTT Kargo</option>
                  <option value="surat">Surat Kargo</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Takip Numarasi</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  placeholder="Kargo takip no"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark disabled:opacity-50"
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>

              {message && (
                <p className={`text-sm text-center ${message === "Kaydedildi!" ? "text-success" : "text-danger"}`}>
                  {message}
                </p>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-bold mb-3">Odeme Bilgileri</h2>
            <div className="text-sm space-y-2">
              <p>
                <span className="text-muted-foreground">Yontem:</span>{" "}
                {order.paymentMethod === "CREDIT_CARD" && "Kredi Karti"}
                {order.paymentMethod === "BANK_TRANSFER" && "Havale/EFT"}
                {order.paymentMethod === "CASH_ON_DELIVERY" && "Kapida Odeme"}
              </p>
              <p>
                <span className="text-muted-foreground">Durum:</span>{" "}
                <span className={`font-medium ${
                  order.paymentStatus === "PAID" ? "text-success" :
                  order.paymentStatus === "FAILED" ? "text-danger" : "text-warning"
                }`}>
                  {order.paymentStatus === "PAID" && "Odendi"}
                  {order.paymentStatus === "PENDING" && "Beklemede"}
                  {order.paymentStatus === "FAILED" && "Basarisiz"}
                  {order.paymentStatus === "REFUNDED" && "Iade Edildi"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
