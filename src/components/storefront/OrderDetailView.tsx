"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  productName: string;
  productSlug: string;
  productImage: string | null;
}

interface ShippingAddress {
  title?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  address?: string;
  zipCode?: string;
  [key: string]: string | undefined;
}

interface TrackingEvent {
  date: string;
  status: string;
  location: string;
  description: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod?: string;
  subtotal?: number;
  shippingCost?: number;
  discount?: number;
  total: number;
  trackingNumber: string | null;
  shippingCompany?: string | null;
  shippingAddress: ShippingAddress | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

function getStatusLabels(t: ReturnType<typeof useTranslations>): Record<string, string> {
  return {
    PENDING: t("statusPending"),
    CONFIRMED: t("statusConfirmed"),
    PROCESSING: t("statusPreparing"),
    SHIPPED: t("statusShipped"),
    DELIVERED: t("statusDelivered"),
    CANCELLED: t("statusCancelled"),
    REFUNDED: t("statusReturned"),
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-warning",
  CONFIRMED: "bg-primary",
  PROCESSING: "bg-primary",
  SHIPPED: "bg-blue-500",
  DELIVERED: "bg-success",
  CANCELLED: "bg-danger",
  REFUNDED: "bg-muted",
};

function getPaymentLabels(t: ReturnType<typeof useTranslations>): Record<string, string> {
  return {
    CREDIT_CARD: t("paymentCreditCard"),
    BANK_TRANSFER: t("paymentBankTransfer"),
    CASH_ON_DELIVERY: t("paymentCashOnDelivery"),
  };
}

const SHIPPING_NAMES: Record<string, string> = {
  yurtici: "Yurtici Kargo",
  aras: "Aras Kargo",
  mng: "MNG Kargo",
  ptt: "PTT Kargo",
  surat: "Surat Kargo",
};

function getTimelineSteps(t: ReturnType<typeof useTranslations>) {
  return [
    { key: "PENDING", label: t("orderReceived") },
    { key: "CONFIRMED", label: t("statusConfirmed") },
    { key: "PROCESSING", label: t("statusPreparing") },
    { key: "SHIPPED", label: t("statusShipped") },
    { key: "DELIVERED", label: t("statusDelivered") },
  ];
}

const STEP_ORDER: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(amount);
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

export default function OrderDetailView({ order, hasActiveReturn, activeReturnId }: { order: Order; hasActiveReturn?: boolean; activeReturnId?: string }) {
  const t = useTranslations("order");
  const common = useTranslations("common");
  const STATUS_LABELS = getStatusLabels(t);
  const PAYMENT_LABELS = getPaymentLabels(t);
  const TIMELINE_STEPS = getTimelineSteps(t);
  const isCancelled = order.status === "CANCELLED" || order.status === "REFUNDED";
  const currentStepIndex = STEP_ORDER[order.status] ?? -1;
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const subtotal = order.subtotal ?? order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Kargo takip bilgisi
  useEffect(() => {
    if (order.trackingNumber && order.shippingCompany) {
      setTrackingLoading(true);
      fetch(`/api/shipping/track/${order.trackingNumber}?provider=${order.shippingCompany}`)
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.events) setTrackingEvents(data.events);
        })
        .catch(() => {})
        .finally(() => setTrackingLoading(false));
    }
  }, [order.trackingNumber, order.shippingCompany]);

  return (
    <div>
      {/* Back Button */}
      <Link
        href="/hesabim/siparislerim"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        &larr; {t("backToOrders")}
      </Link>

      {/* Order Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Siparis #{order.orderNumber}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <span
          className={`${
            STATUS_COLORS[order.status] || "bg-muted"
          } text-white text-sm font-medium px-4 py-1.5 rounded-full self-start`}
        >
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      {/* Status Timeline */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Siparis Durumu
        </h2>
        {isCancelled ? (
          <div className="flex items-center gap-3 p-4 bg-danger/10 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-danger flex items-center justify-center text-white text-sm font-bold">
              !
            </div>
            <div>
              <p className="font-medium text-foreground">
                {STATUS_LABELS[order.status]}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.status === "CANCELLED" ? t("cancelled") : t("refunded")}
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
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
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

      {/* Kargo Takip Timeline */}
      {order.trackingNumber && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">{t("shippingTracking")}</h2>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-4">
            <span className="text-lg">📦</span>
            <div>
              <p className="text-sm font-medium">
                {SHIPPING_NAMES[order.shippingCompany || ""] || order.shippingCompany || "Kargo"}
              </p>
              <p className="text-xs text-muted-foreground font-mono">{order.trackingNumber}</p>
            </div>
          </div>

          {trackingLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Kargo takip bilgileri yukleniyor...
            </div>
          ) : trackingEvents.length > 0 ? (
            <div className="relative pl-6">
              {trackingEvents.map((event, idx) => (
                <div key={idx} className="relative pb-6 last:pb-0">
                  {idx < trackingEvents.length - 1 && (
                    <div className="absolute left-[-16px] top-3 w-0.5 h-full bg-border" />
                  )}
                  <div className={`absolute left-[-20px] top-1.5 w-3 h-3 rounded-full border-2 ${
                    idx === 0 ? "bg-primary border-primary" : "bg-white border-border"
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{event.description || event.status}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {event.location && `${event.location} • `}{event.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noTrackingInfo")}</p>
          )}
        </div>
      )}

      {/* Items Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">{t("products")}</h2>
        </div>
        <div className="divide-y divide-border">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4">
              <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    width={64}
                    height={64}
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
                  href={`/urun/${item.productSlug}` as any}
                  className="text-sm font-medium text-foreground hover:text-primary"
                >
                  {item.productName}
                </Link>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.quantity} {t("piece")} x {formatCurrency(item.price)}
                </p>
              </div>
              <div className="text-sm font-semibold text-foreground">
                {formatCurrency(item.quantity * item.price)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address & Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">
              {t("shippingAddress")}
            </h2>
            <div className="space-y-1 text-sm text-muted-foreground">
              {order.shippingAddress.title && (
                <p className="font-medium text-foreground">
                  {order.shippingAddress.title}
                </p>
              )}
              <p>
                {order.shippingAddress.firstName}{" "}
                {order.shippingAddress.lastName}
              </p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.neighborhood &&
                  `${order.shippingAddress.neighborhood}, `}
                {order.shippingAddress.district} / {order.shippingAddress.city}
                {order.shippingAddress.zipCode &&
                  ` - ${order.shippingAddress.zipCode}`}
              </p>
              {order.shippingAddress.phone && (
                <p>Tel: {order.shippingAddress.phone}</p>
              )}
            </div>
          </div>
        )}

        {/* Payment Info */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            {t("paymentInfo")}
          </h2>
          <div className="space-y-1 text-sm text-muted-foreground">
            {order.paymentMethod && (
              <p>
                <span className="text-foreground font-medium">Yontem:</span>{" "}
                {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Iade Talebi */}
      {order.status === "DELIVERED" && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          {hasActiveReturn ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Iade Talebiniz Mevcut</p>
                <p className="text-xs text-muted-foreground mt-0.5">Bu siparis icin aktif bir iade talebi bulunuyor.</p>
              </div>
              <Link
                href={`/hesabim/iadelerim/${activeReturnId}` as any}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
              >
                Iade Detayi
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Iade Talebi Olustur</p>
                <p className="text-xs text-muted-foreground mt-0.5">Teslim tarihinden itibaren 14 gun icinde iade talebi olusturabilirsiniz.</p>
              </div>
              <Link
                href={`/hesabim/siparislerim/${order.id}/iade` as any}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
              >
                Iade Talebi
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Siparis Ozeti
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("subtotal")}</span>
            <span className="text-foreground">{formatCurrency(subtotal)}</span>
          </div>
          {(order.shippingCost !== undefined) && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("shippingCost")}</span>
              <span className={order.shippingCost === 0 ? "text-success font-medium" : "text-foreground"}>
                {order.shippingCost === 0 ? common("free") : formatCurrency(order.shippingCost)}
              </span>
            </div>
          )}
          {(order.discount !== undefined && order.discount > 0) && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("discount")}</span>
              <span className="text-success font-medium">-{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="border-t border-border pt-2 mt-2">
            <div className="flex justify-between text-base font-bold">
              <span className="text-foreground">{t("total")}</span>
              <span className="text-primary">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
