"use client";

import { useState } from "react";
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

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
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

type FilterTab = "all" | "active" | "delivered" | "cancelled";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Tumu" },
  { key: "active", label: "Aktif" },
  { key: "delivered", label: "Teslim Edildi" },
  { key: "cancelled", label: "Iptal" },
];

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"];
const CANCELLED_STATUSES = ["CANCELLED", "REFUNDED"];

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
  }).format(new Date(dateStr));
}

export default function OrderHistory({ orders }: { orders: Order[] }) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filteredOrders = orders.filter((order) => {
    switch (activeTab) {
      case "active":
        return ACTIVE_STATUSES.includes(order.status);
      case "delivered":
        return order.status === "DELIVERED";
      case "cancelled":
        return CANCELLED_STATUSES.includes(order.status);
      default:
        return true;
    }
  });

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">
            Henuz siparisiniz yok.
          </p>
          <Link
            href="/kategori"
            className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-muted transition-colors"
          >
            Alisverise Basla
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="border border-border rounded-xl bg-card overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Siparis No:
                    </span>{" "}
                    <span className="font-medium text-foreground">
                      #{order.orderNumber}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </div>
                </div>
                <span
                  className={`${
                    STATUS_COLORS[order.status] || "bg-muted"
                  } text-white text-xs font-medium px-3 py-1 rounded-full`}
                >
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

              {/* Items */}
              <div className="p-4 space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          width={48}
                          height={48}
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
                        className="text-sm font-medium text-foreground hover:text-primary truncate block"
                      >
                        {item.productName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} adet x {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {formatCurrency(item.quantity * item.price)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
                <div className="text-sm">
                  <span className="text-muted-foreground">Toplam:</span>{" "}
                  <span className="font-bold text-foreground text-base">
                    {formatCurrency(order.total)}
                  </span>
                </div>
                <Link
                  href={`/hesabim/siparislerim/${order.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Detay &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
