"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Beklemede",
  APPROVED: "Onaylandi",
  REJECTED: "Reddedildi",
  RECEIVED: "Teslim Alindi",
  REFUNDED: "Iade Edildi",
  CANCELLED: "Iptal Edildi",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-warning",
  APPROVED: "bg-primary",
  REJECTED: "bg-danger",
  RECEIVED: "bg-blue-500",
  REFUNDED: "bg-success",
  CANCELLED: "bg-muted",
};

const REASON_LABELS: Record<string, string> = {
  defective: "Kusurlu / Bozuk Urun",
  wrong_item: "Yanlis Urun Gonderildi",
  changed_mind: "Fikir Degisikligi",
  damaged: "Hasarli Urun (Kargo)",
  not_as_described: "Urun Tarifine Uymuyor",
  other: "Diger",
};

const TIMELINE_STEPS = [
  { key: "PENDING", label: "Talep Olusturuldu" },
  { key: "APPROVED", label: "Onaylandi" },
  { key: "RECEIVED", label: "Teslim Alindi" },
  { key: "REFUNDED", label: "Iade Edildi" },
];

const STEP_ORDER: Record<string, number> = {
  PENDING: 0,
  APPROVED: 1,
  RECEIVED: 2,
  REFUNDED: 3,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

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
    order: { id: string; orderNumber: string; total: number };
    items: {
      id: string;
      quantity: number;
      reason: string | null;
      name: string;
      price: number;
      productSlug: string;
      productImage: string | null;
    }[];
  };
}

export default function ReturnDetailView({ returnData }: Props) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);

  const isRejectedOrCancelled =
    returnData.status === "REJECTED" || returnData.status === "CANCELLED";
  const currentStepIndex = STEP_ORDER[returnData.status] ?? -1;

  const handleCancel = async () => {
    if (!confirm("Iade talebini iptal etmek istediginize emin misiniz?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/returns/${returnData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div>
      <Link
        href="/hesabim/iadelerim"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        &larr; Iadelerime Don
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
        <div>
          <h1 className="text-2xl font-bold">Iade #{returnData.returnNumber}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDate(returnData.createdAt)} &bull; Siparis{" "}
            <Link
              href={`/hesabim/siparislerim/${returnData.order.id}`}
              className="text-primary hover:underline"
            >
              #{returnData.order.orderNumber}
            </Link>
          </p>
        </div>
        <span
          className={`${STATUS_COLORS[returnData.status] || "bg-muted"} text-white text-sm font-medium px-4 py-1.5 rounded-full self-start`}
        >
          {STATUS_LABELS[returnData.status] || returnData.status}
        </span>
      </div>

      {/* Timeline */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold mb-4">Iade Durumu</h2>
        {isRejectedOrCancelled ? (
          <div className="flex items-center gap-3 p-4 bg-danger/10 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-danger flex items-center justify-center text-white text-sm font-bold">
              !
            </div>
            <div>
              <p className="font-medium">{STATUS_LABELS[returnData.status]}</p>
              <p className="text-sm text-muted-foreground">
                {returnData.status === "REJECTED"
                  ? "Iade talebiniz reddedildi."
                  : "Iade talebiniz iptal edildi."}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            {TIMELINE_STEPS.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isPast = index < currentStepIndex;
              const isFuture = index > currentStepIndex;

              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-colors ${
                        isPast
                          ? "bg-success"
                          : isActive
                          ? "bg-primary ring-4 ring-primary/20"
                          : "bg-muted"
                      }`}
                    >
                      {isPast ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 text-center whitespace-nowrap ${
                        isFuture ? "text-muted-foreground" : "text-foreground font-medium"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < TIMELINE_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mt-[-1rem] ${
                        index < currentStepIndex ? "bg-success" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Iade Nedeni */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold mb-2">Iade Nedeni</h2>
        <p className="text-sm text-muted-foreground">
          {REASON_LABELS[returnData.reason] || returnData.reason}
        </p>
        {returnData.note && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground font-medium mb-1">Ek Not:</p>
            <p className="text-sm text-muted-foreground">{returnData.note}</p>
          </div>
        )}
      </div>

      {/* Admin Notu */}
      {returnData.adminNote && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-primary mb-2">Magaza Notu</h2>
          <p className="text-sm text-muted-foreground">{returnData.adminNote}</p>
        </div>
      )}

      {/* Iade Kalemleri */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Iade Edilecek Urunler</h2>
        </div>
        <div className="divide-y divide-border">
          {returnData.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4">
              <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.name}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    Gorsel
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/urun/${item.productSlug}`}
                  className="text-sm font-medium hover:text-primary"
                >
                  {item.name}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.quantity} adet x {formatCurrency(item.price)}
                </p>
                {item.reason && (
                  <p className="text-xs text-muted-foreground mt-0.5 italic">
                    {item.reason}
                  </p>
                )}
              </div>
              <div className="text-sm font-semibold">
                {formatCurrency(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Iade Ozeti */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold mb-3">Iade Ozeti</h2>
        <div className="flex justify-between text-base font-bold">
          <span>Iade Tutari</span>
          <span className="text-primary">{formatCurrency(returnData.refundAmount)}</span>
        </div>
        {returnData.refundMethod && (
          <p className="text-xs text-muted-foreground mt-2">
            Iade yontemi: {returnData.refundMethod === "original" ? "Orijinal odeme yontemine" : "Magaza kredisine"}
          </p>
        )}
      </div>

      {/* Iptal Butonu */}
      {returnData.status === "PENDING" && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full py-2.5 border border-danger text-danger rounded-xl text-sm font-medium hover:bg-danger/5 disabled:opacity-50 transition-colors"
        >
          {cancelling ? "Iptal Ediliyor..." : "Iade Talebini Iptal Et"}
        </button>
      )}
    </div>
  );
}
