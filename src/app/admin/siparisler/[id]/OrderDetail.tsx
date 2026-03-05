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
      provider: string | null;
      createdAt: string;
      providerData: Record<string, unknown> | null;
    }[];
    coupon: {
      code: string;
      type: string;
      value: number;
    } | null;
    returns?: {
      id: string;
      returnNumber: string;
      status: string;
      refundAmount: number;
      createdAt: string;
    }[];
    bankTransferReceipts?: {
      id: string;
      mediaUrl: string;
      status: string;
      adminNote: string | null;
      createdAt: string;
    }[];
  };
}

const RETURN_STATUS_LABELS: Record<string, string> = {
  PENDING: "Beklemede",
  APPROVED: "Onaylandi",
  REJECTED: "Reddedildi",
  RECEIVED: "Teslim Alindi",
  REFUNDED: "Iade Edildi",
  CANCELLED: "Iptal Edildi",
};

const RETURN_STATUS_BADGE: Record<string, string> = {
  PENDING: "text-warning",
  APPROVED: "text-primary",
  REJECTED: "text-danger",
  RECEIVED: "text-blue-600",
  REFUNDED: "text-success",
  CANCELLED: "text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Beklemede",
  CONFIRMED: "Onaylandi",
  PROCESSING: "Hazirlaniyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "Iptal Edildi",
  REFUNDED: "Iade Edildi",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Beklemede",
  PAID: "Odendi",
  FAILED: "Basarisiz",
  REFUNDED: "Iade Edildi",
};

export default function OrderDetail({ order }: Props) {
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
  const [shippingCompany, setShippingCompany] = useState(order.shippingCompany || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [shippingLoading, setShippingLoading] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [refundAmount, setRefundAmount] = useState(String(order.total));
  const [refunding, setRefunding] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [receipts, setReceipts] = useState(order.bankTransferReceipts || []);
  const [reviewingReceipt, setReviewingReceipt] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null);

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

  // Kargo olustur
  const handleCreateShipment = async () => {
    if (!shippingCompany) {
      setMessage("Kargo firmasi seciniz");
      return;
    }
    setShippingLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/shipping/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          provider: shippingCompany,
        }),
      });
      const data = await res.json();
      if (res.ok && data.trackingNumber) {
        setTrackingNumber(data.trackingNumber);
        setStatus("SHIPPED");
        setMessage(`Kargo olusturuldu! Takip No: ${data.trackingNumber}`);
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage(data.error || "Kargo olusturulamadi");
      }
    } catch {
      setMessage("Kargo olusturma hatasi");
    } finally {
      setShippingLoading(false);
    }
  };

  // Havale onaylama
  const handleConfirmPayment = async () => {
    setConfirmingPayment(true);
    setMessage("");
    try {
      const res = await fetch("/api/payment/bank-transfer/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      if (res.ok) {
        setPaymentStatus("PAID");
        setStatus("CONFIRMED");
        setMessage("Odeme onaylandi!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await res.json();
        setMessage(data.error || "Onay hatasi");
      }
    } catch {
      setMessage("Onay hatasi");
    } finally {
      setConfirmingPayment(false);
    }
  };

  // Dekont onayla
  const handleApproveReceipt = async (receiptId: string) => {
    setReviewingReceipt(receiptId);
    try {
      const res = await fetch(`/api/payment/bank-transfer/receipt/${receiptId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        setReceipts((prev) => prev.map((r) => r.id === receiptId ? { ...r, status: "APPROVED" } : r));
        setPaymentStatus("PAID");
        setStatus("CONFIRMED");
        setMessage("Dekont onaylandi, odeme alindi!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await res.json();
        setMessage(data.error || "Onay hatasi");
      }
    } catch {
      setMessage("Onay hatasi");
    } finally {
      setReviewingReceipt(null);
    }
  };

  // Dekont reddet
  const handleRejectReceipt = async (receiptId: string) => {
    if (!rejectNote.trim()) {
      setMessage("Red sebebi giriniz");
      return;
    }
    setReviewingReceipt(receiptId);
    try {
      const res = await fetch(`/api/payment/bank-transfer/receipt/${receiptId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", adminNote: rejectNote }),
      });
      if (res.ok) {
        setReceipts((prev) => prev.map((r) => r.id === receiptId ? { ...r, status: "REJECTED", adminNote: rejectNote } : r));
        setShowRejectForm(null);
        setRejectNote("");
        setMessage("Dekont reddedildi");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await res.json();
        setMessage(data.error || "Red hatasi");
      }
    } catch {
      setMessage("Red hatasi");
    } finally {
      setReviewingReceipt(null);
    }
  };

  // Iade baslat
  const handleRefund = async () => {
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0 || amount > order.total) {
      setMessage("Gecerli bir iade tutari giriniz");
      return;
    }
    if (!confirm(`${amount.toFixed(2)} TL tutarinda iade yapmak istediginize emin misiniz?`)) return;
    setRefunding(true);
    setMessage("");
    try {
      const res = await fetch("/api/payment/iyzico/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          amount,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentStatus("REFUNDED");
        setStatus("REFUNDED");
        setShowRefundForm(false);
        setMessage("Iade basariyla gerceklestirildi!");
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage(data.error || "Iade hatasi olustu");
      }
    } catch {
      setMessage("Iade islemi basarisiz");
    } finally {
      setRefunding(false);
    }
  };

  // Fatura indir
  const handleDownloadInvoice = () => {
    window.open(`/api/orders/${order.id}/invoice`, "_blank");
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
        <div className="flex gap-2">
          <button
            onClick={handleDownloadInvoice}
            className="px-4 py-2 bg-muted rounded-lg text-sm font-medium hover:bg-border"
          >
            📄 Fatura Indir
          </button>
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

          {/* Payment History */}
          {order.payments.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="font-bold mb-4">Odeme Gecmisi</h2>
              <div className="space-y-3">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                    <div>
                      <p className="font-medium">
                        {payment.method === "CREDIT_CARD" && "Kredi Karti"}
                        {payment.method === "BANK_TRANSFER" && "Havale/EFT"}
                        {payment.method === "CASH_ON_DELIVERY" && "Kapida Odeme"}
                        {payment.provider && ` (${payment.provider})`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleString("tr-TR")}
                        {payment.transactionId && ` • ${payment.transactionId}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatPrice(payment.amount)}</p>
                      <span className={`text-xs font-medium ${
                        payment.status === "PAID" ? "text-success" :
                        payment.status === "FAILED" ? "text-danger" :
                        payment.status === "REFUNDED" ? "text-purple-600" : "text-warning"
                      }`}>
                        {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.note && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="font-bold mb-2">Siparis Notu</h2>
              <p className="text-sm text-muted-foreground">{order.note}</p>
            </div>
          )}

          {/* Returns */}
          {order.returns && order.returns.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="font-bold mb-4">Iade Talepleri</h2>
              <div className="space-y-3">
                {order.returns.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                    <div>
                      <p className="font-medium">{r.returnNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-medium ${RETURN_STATUS_BADGE[r.status] || "text-muted-foreground"}`}>
                        {RETURN_STATUS_LABELS[r.status] || r.status}
                      </span>
                      <span className="font-bold">{formatPrice(r.refundAmount)}</span>
                      <Link
                        href={`/admin/iadeler/${r.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        Detay
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          {order.paymentMethod === "BANK_TRANSFER" && paymentStatus === "PENDING" && (
            <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
              <h2 className="font-bold mb-2 text-yellow-800">Havale Bekliyor</h2>
              <p className="text-sm text-yellow-700 mb-4">
                Bu siparis havale/EFT ile odenmek uzere bekliyor.
              </p>

              {/* Yuklenen dekontlar */}
              {receipts.length > 0 && (
                <div className="space-y-3 mb-4">
                  <p className="text-sm font-semibold text-yellow-800">Yuklenen Dekontlar:</p>
                  {receipts.map((receipt) => (
                    <div key={receipt.id} className="bg-white rounded-lg border border-yellow-200 p-3">
                      <div className="flex items-center gap-3 mb-2">
                        <a
                          href={receipt.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 w-16 h-16 bg-muted rounded-lg overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity"
                        >
                          {receipt.mediaUrl.endsWith(".pdf") ? (
                            <span className="text-2xl">📄</span>
                          ) : (
                            <img src={receipt.mediaUrl} alt="Dekont" className="w-full h-full object-cover" />
                          )}
                        </a>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {new Date(receipt.createdAt).toLocaleString("tr-TR")}
                          </p>
                          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded mt-1 ${
                            receipt.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                            receipt.status === "APPROVED" ? "bg-green-100 text-green-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {receipt.status === "PENDING" ? "Inceleniyor" :
                             receipt.status === "APPROVED" ? "Onaylandi" :
                             "Reddedildi"}
                          </span>
                          {receipt.adminNote && (
                            <p className="text-xs text-red-600 mt-1">Red: {receipt.adminNote}</p>
                          )}
                        </div>
                      </div>

                      {/* Onay/Ret butonlari */}
                      {receipt.status === "PENDING" && (
                        <div className="space-y-2">
                          {showRejectForm === receipt.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="Red sebebi..."
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRejectReceipt(receipt.id)}
                                  disabled={reviewingReceipt === receipt.id}
                                  className="flex-1 py-2 bg-danger text-white rounded-lg text-xs font-semibold hover:bg-danger/90 disabled:opacity-50"
                                >
                                  {reviewingReceipt === receipt.id ? "..." : "Reddet"}
                                </button>
                                <button
                                  onClick={() => { setShowRejectForm(null); setRejectNote(""); }}
                                  className="px-3 py-2 bg-muted rounded-lg text-xs font-medium hover:bg-border"
                                >
                                  Iptal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveReceipt(receipt.id)}
                                disabled={reviewingReceipt === receipt.id}
                                className="flex-1 py-2 bg-success text-white rounded-lg text-xs font-semibold hover:bg-success/90 disabled:opacity-50"
                              >
                                {reviewingReceipt === receipt.id ? "..." : "Onayla"}
                              </button>
                              <button
                                onClick={() => setShowRejectForm(receipt.id)}
                                className="flex-1 py-2 bg-danger/10 text-danger rounded-lg text-xs font-semibold hover:bg-danger/20"
                              >
                                Reddet
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Dekont yoksa veya tumu reddedildiyse - manuel onay butonu */}
              {receipts.filter((r) => r.status === "PENDING").length === 0 && (
                <>
                  <p className="text-xs text-yellow-600 mb-3">
                    {receipts.length === 0
                      ? "Henuz dekont yuklenmedi. Banka ekstresinden kontrol edip manuel onaylayabilirsiniz."
                      : "Tum dekontlar incelendi. Banka ekstresinden kontrol edip manuel onaylayabilirsiniz."}
                  </p>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={confirmingPayment}
                    className="w-full py-2.5 bg-success text-white rounded-lg text-sm font-semibold hover:bg-success/90 disabled:opacity-50"
                  >
                    {confirmingPayment ? "Onaylaniyor..." : "Manuel Havale Onayla"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Iade Butonu - Kredi karti + odendi durumlu siparisler */}
          {order.paymentMethod === "CREDIT_CARD" && paymentStatus === "PAID" && status !== "REFUNDED" && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="font-bold mb-2">Iade Islemi</h2>
              {!showRefundForm ? (
                <button
                  onClick={() => setShowRefundForm(true)}
                  className="w-full py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700"
                >
                  Iade Baslat
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Iade Tutari (TL)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={order.total}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Siparis toplami: {formatPrice(order.total)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRefund}
                      disabled={refunding}
                      className="flex-1 py-2.5 bg-danger text-white rounded-lg text-sm font-semibold hover:bg-danger/90 disabled:opacity-50"
                    >
                      {refunding ? "Iade Yapiliyor..." : "Iade Onayla"}
                    </button>
                    <button
                      onClick={() => setShowRefundForm(false)}
                      className="px-4 py-2.5 bg-muted rounded-lg text-sm font-medium hover:bg-border"
                    >
                      Iptal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
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

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark disabled:opacity-50"
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
                {shippingCompany && !trackingNumber && (
                  <button
                    onClick={handleCreateShipment}
                    disabled={shippingLoading}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {shippingLoading ? "Olusturuluyor..." : "Kargo Olustur"}
                  </button>
                )}
              </div>

              {message && (
                <p className={`text-sm text-center ${
                  message.includes("Hata") || message.includes("hatasi") ? "text-danger" : "text-success"
                }`}>
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
                {order.paymentMethod === "CREDIT_CARD" && "Kredi Karti (iyzico)"}
                {order.paymentMethod === "BANK_TRANSFER" && "Havale/EFT"}
                {order.paymentMethod === "CASH_ON_DELIVERY" && "Kapida Odeme"}
              </p>
              <p>
                <span className="text-muted-foreground">Durum:</span>{" "}
                <span className={`font-medium ${
                  paymentStatus === "PAID" ? "text-success" :
                  paymentStatus === "FAILED" ? "text-danger" :
                  paymentStatus === "REFUNDED" ? "text-purple-600" : "text-warning"
                }`}>
                  {PAYMENT_STATUS_LABELS[paymentStatus] || paymentStatus}
                </span>
              </p>
              {trackingNumber && (
                <p>
                  <span className="text-muted-foreground">Takip No:</span>{" "}
                  <span className="font-mono font-medium">{trackingNumber}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
