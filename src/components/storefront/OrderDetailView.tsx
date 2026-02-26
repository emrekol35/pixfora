"use client";

import Link from "next/link";
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

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  trackingNumber: string | null;
  shippingAddress: ShippingAddress | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  CONFIRMED: "Onaylandi",
  PROCESSING: "Hazirlaniyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "Iptal Edildi",
  REFUNDED: "Iade Edildi",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-warning",
  CONFIRMED: "bg-primary",
  PROCESSING: "bg-primary",
  SHIPPED: "bg-blue-500",
  DELIVERED: "bg-success",
  CANCELLED: "bg-danger",
  REFUNDED: "bg-muted",
};

const TIMELINE_STEPS = [
  { key: "PENDING", label: "Siparis Alindi" },
  { key: "CONFIRMED", label: "Onaylandi" },
  { key: "PROCESSING", label: "Hazirlaniyor" },
  { key: "SHIPPED", label: "Kargoda" },
  { key: "DELIVERED", label: "Teslim Edildi" },
];

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

export default function OrderDetailView({ order }: { order: Order }) {
  const isCancelled = order.status === "CANCELLED" || order.status === "REFUNDED";
  const currentStepIndex = STEP_ORDER[order.status] ?? -1;

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div>
      {/* Back Button */}
      <Link
        href="/hesabim/siparislerim"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        &larr; Siparislerime Don
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
                Bu siparis {order.status === "CANCELLED" ? "iptal edilmistir" : "iade edilmistir"}.
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

      {/* Items Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Urunler</h2>
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
                  href={`/urun/${item.productSlug}`}
                  className="text-sm font-medium text-foreground hover:text-primary"
                >
                  {item.productName}
                </Link>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.quantity} adet x {formatCurrency(item.price)}
                </p>
              </div>
              <div className="text-sm font-semibold text-foreground">
                {formatCurrency(item.quantity * item.price)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address & Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">
              Teslimat Adresi
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

        {/* Tracking Number */}
        {order.trackingNumber && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">
              Kargo Takip
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Takip Numarasi:
              </span>
              <span className="text-sm font-mono font-medium text-foreground bg-muted px-3 py-1 rounded">
                {order.trackingNumber}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Siparis Ozeti
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ara Toplam</span>
            <span className="text-foreground">{formatCurrency(subtotal)}</span>
          </div>
          {order.total !== subtotal && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Kargo</span>
              <span className="text-foreground">
                {formatCurrency(order.total - subtotal)}
              </span>
            </div>
          )}
          <div className="border-t border-border pt-2 mt-2">
            <div className="flex justify-between text-base font-bold">
              <span className="text-foreground">Toplam</span>
              <span className="text-foreground">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
