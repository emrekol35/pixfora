"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Beklemede",
  APPROVED: "Onaylandi",
  REJECTED: "Reddedildi",
  RECEIVED: "Teslim Alindi",
  REFUNDED: "Iade Edildi",
  CANCELLED: "Iptal Edildi",
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-warning text-white",
  APPROVED: "bg-primary text-white",
  REJECTED: "bg-danger text-white",
  RECEIVED: "bg-blue-500 text-white",
  REFUNDED: "bg-success text-white",
  CANCELLED: "bg-muted text-white",
};

const REASON_LABELS: Record<string, string> = {
  defective: "Kusurlu / Bozuk Urun",
  wrong_item: "Yanlis Urun Gonderildi",
  changed_mind: "Fikir Degisikligi",
  damaged: "Hasarli Urun (Kargo)",
  not_as_described: "Urun Tarifine Uymuyor",
  other: "Diger",
};

const ACTION_LABELS: Record<string, string> = {
  return_requested: "Iade talebi olusturuldu",
  return_approved: "Iade onaylandi",
  return_rejected: "Iade reddedildi",
  return_received: "Urun teslim alindi",
  return_refunded: "Iade tamamlandi",
  return_cancelled: "Iade iptal edildi",
};

interface Props {
  returnData: {
    id: string;
    returnNumber: string;
    status: string;
    reason: string;
    note: string | null;
    adminNote: string | null;
    refundAmount: number;
    refundMethod: string | null;
    createdAt: string;
    updatedAt: string;
    order: {
      id: string;
      orderNumber: string;
      total: number;
      paymentMethod: string;
      paymentStatus: string;
    };
    user: { name: string; email: string; phone: string | null };
    items: {
      id: string;
      quantity: number;
      reason: string | null;
      name: string;
      price: number;
      productSlug: string;
      productImage: string | null;
    }[];
    activityLogs: {
      id: string;
      action: string;
      details: Record<string, unknown> | null;
      createdAt: string;
    }[];
  };
}

const formatPrice = (p: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p);

export default function AdminReturnDetail({ returnData }: Props) {
  const router = useRouter();
  const [adminNote, setAdminNote] = useState(returnData.adminNote || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAction = async (newStatus: string) => {
    if (newStatus === "REJECTED" && !adminNote.trim()) {
      setMessage("Red nedeni belirtmelisiniz");
      return;
    }

    const confirmMsg =
      newStatus === "APPROVED"
        ? "Iade talebini onaylamak istediginize emin misiniz?"
        : newStatus === "REJECTED"
        ? "Iade talebini reddetmek istediginize emin misiniz?"
        : newStatus === "RECEIVED"
        ? "Urunu teslim aldiginizi onayliyor musunuz?"
        : newStatus === "REFUNDED"
        ? `${formatPrice(returnData.refundAmount)} tutarinda iade yapmak istediginize emin misiniz?`
        : "Devam etmek istediginize emin misiniz?";

    if (!confirm(confirmMsg)) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/returns/${returnData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminNote: adminNote.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Islem basarili!");
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        setMessage(data.error || "Islem basarisiz");
      }
    } catch {
      setMessage("Bir hata olustu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/iadeler" className="text-sm text-primary hover:underline mb-1 inline-block">
            ← Iadelere Don
          </Link>
          <h1 className="text-2xl font-bold">Iade #{returnData.returnNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(returnData.createdAt).toLocaleString("tr-TR")}
          </p>
        </div>
        <span className={`${STATUS_BADGE[returnData.status] || "bg-muted text-white"} text-sm font-medium px-4 py-1.5 rounded-full`}>
          {STATUS_LABELS[returnData.status] || returnData.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Iade Kalemleri */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-bold mb-4">Iade Kalemleri</h2>
            <div className="space-y-3">
              {returnData.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 pb-3 border-b border-border last:border-0">
                  <div className="w-14 h-14 bg-muted rounded-lg overflow-hidden shrink-0">
                    {item.productImage && (
                      <img src={item.productImage} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.reason && (
                      <p className="text-xs text-muted-foreground italic">{item.reason}</p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <p>{item.quantity} x {formatPrice(item.price)}</p>
                    <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between font-bold text-lg">
                <span>Iade Tutari</span>
                <span className="text-primary">{formatPrice(returnData.refundAmount)}</span>
              </div>
            </div>
          </div>

          {/* Iade Bilgileri */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-bold mb-3">Iade Bilgileri</h2>
            <div className="text-sm space-y-2">
              <p>
                <span className="text-muted-foreground">Neden:</span>{" "}
                <span className="font-medium">{REASON_LABELS[returnData.reason] || returnData.reason}</span>
              </p>
              {returnData.note && (
                <p>
                  <span className="text-muted-foreground">Musteri Notu:</span>{" "}
                  {returnData.note}
                </p>
              )}
              {returnData.adminNote && (
                <p>
                  <span className="text-muted-foreground">Admin Notu:</span>{" "}
                  {returnData.adminNote}
                </p>
              )}
              {returnData.refundMethod && (
                <p>
                  <span className="text-muted-foreground">Iade Yontemi:</span>{" "}
                  {returnData.refundMethod === "original" ? "Orijinal odeme yontemine" : returnData.refundMethod}
                </p>
              )}
            </div>
          </div>

          {/* Musteri & Siparis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="font-bold mb-3">Musteri Bilgileri</h2>
              <div className="text-sm space-y-1.5 text-muted-foreground">
                <p><span className="text-foreground font-medium">Ad:</span> {returnData.user.name}</p>
                <p><span className="text-foreground font-medium">E-posta:</span> {returnData.user.email}</p>
                {returnData.user.phone && (
                  <p><span className="text-foreground font-medium">Telefon:</span> {returnData.user.phone}</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="font-bold mb-3">Siparis Bilgileri</h2>
              <div className="text-sm space-y-1.5 text-muted-foreground">
                <p>
                  <span className="text-foreground font-medium">Siparis:</span>{" "}
                  <Link href={`/admin/siparisler/${returnData.order.id}`} className="text-primary hover:underline">
                    #{returnData.order.orderNumber}
                  </Link>
                </p>
                <p><span className="text-foreground font-medium">Toplam:</span> {formatPrice(returnData.order.total)}</p>
                <p>
                  <span className="text-foreground font-medium">Odeme:</span>{" "}
                  {returnData.order.paymentMethod === "CREDIT_CARD" ? "Kredi Karti" :
                   returnData.order.paymentMethod === "BANK_TRANSFER" ? "Havale/EFT" : "Kapida Odeme"}
                </p>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          {returnData.activityLogs.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="font-bold mb-4">Islem Gecmisi</h2>
              <div className="space-y-3">
                {returnData.activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">{ACTION_LABELS[log.action] || log.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("tr-TR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Action Buttons */}
          {(returnData.status === "PENDING" || returnData.status === "APPROVED" || returnData.status === "RECEIVED") && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="font-bold mb-4">Islemler</h2>

              {/* Admin Note */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">Admin Notu</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  placeholder={returnData.status === "PENDING" ? "Red durumunda neden belirtiniz..." : "Not ekleyin (opsiyonel)"}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                {returnData.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleAction("APPROVED")}
                      disabled={loading}
                      className="w-full py-2.5 bg-success text-white rounded-lg text-sm font-semibold hover:bg-success/90 disabled:opacity-50"
                    >
                      {loading ? "Isleniyor..." : "Onayla"}
                    </button>
                    <button
                      onClick={() => handleAction("REJECTED")}
                      disabled={loading}
                      className="w-full py-2.5 bg-danger text-white rounded-lg text-sm font-semibold hover:bg-danger/90 disabled:opacity-50"
                    >
                      {loading ? "Isleniyor..." : "Reddet"}
                    </button>
                  </>
                )}

                {returnData.status === "APPROVED" && (
                  <button
                    onClick={() => handleAction("RECEIVED")}
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Isleniyor..." : "Teslim Alindi"}
                  </button>
                )}

                {returnData.status === "RECEIVED" && (
                  <button
                    onClick={() => handleAction("REFUNDED")}
                    disabled={loading}
                    className="w-full py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? "Isleniyor..." : `Iade Et (${formatPrice(returnData.refundAmount)})`}
                  </button>
                )}
              </div>

              {message && (
                <p className={`text-sm text-center mt-3 ${
                  message.includes("basari") ? "text-success" : "text-danger"
                }`}>
                  {message}
                </p>
              )}
            </div>
          )}

          {/* Status Info */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-bold mb-3">Durum Bilgisi</h2>
            <div className="text-sm space-y-2">
              <p>
                <span className="text-muted-foreground">Durum:</span>{" "}
                <span className={`font-medium ${
                  returnData.status === "REFUNDED" ? "text-success" :
                  returnData.status === "REJECTED" ? "text-danger" :
                  returnData.status === "PENDING" ? "text-warning" : "text-primary"
                }`}>
                  {STATUS_LABELS[returnData.status]}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Olusturulma:</span>{" "}
                {new Date(returnData.createdAt).toLocaleString("tr-TR")}
              </p>
              <p>
                <span className="text-muted-foreground">Son Guncelleme:</span>{" "}
                {new Date(returnData.updatedAt).toLocaleString("tr-TR")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
