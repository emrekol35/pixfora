"use client";

import { useState } from "react";
import Link from "next/link";

interface Shipment {
  id: string;
  shipmentNumber: string;
  provider: string;
  trackingNumber: string;
  status: string;
  type: string;
  chargedCost: number | null;
  createdAt: string;
  order: {
    orderNumber: string;
    total: number;
    customerName: string;
    customerEmail: string;
  };
}

interface Props {
  shipments: Shipment[];
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

type TabKey = "ALL" | "CREATED" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "PROBLEM";

const TABS: { key: TabKey; label: string }[] = [
  { key: "ALL", label: "Tumu" },
  { key: "CREATED", label: "Olusturuldu" },
  { key: "IN_TRANSIT", label: "Yolda" },
  { key: "OUT_FOR_DELIVERY", label: "Dagitimda" },
  { key: "DELIVERED", label: "Teslim Edildi" },
  { key: "PROBLEM", label: "Sorunlu" },
];

export default function ShipmentList({ shipments }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("ALL");

  const filtered = shipments.filter((s) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "IN_TRANSIT") return ["PICKED_UP", "IN_TRANSIT"].includes(s.status);
    if (activeTab === "PROBLEM") return ["RETURNED", "FAILED"].includes(s.status);
    return s.status === activeTab;
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price);

  return (
    <>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table & Cards */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Gonderi No</th>
                <th className="text-left px-4 py-3 font-medium">Siparis</th>
                <th className="text-left px-4 py-3 font-medium">Musteri</th>
                <th className="text-left px-4 py-3 font-medium">Kargo</th>
                <th className="text-left px-4 py-3 font-medium">Takip No</th>
                <th className="text-left px-4 py-3 font-medium">Durum</th>
                <th className="text-left px-4 py-3 font-medium">Tarih</th>
                <th className="text-left px-4 py-3 font-medium">Islem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/kargo/${s.id}`}
                      className="font-medium text-primary hover:underline font-mono text-xs"
                    >
                      {s.shipmentNumber}
                    </Link>
                    {s.type === "return" && (
                      <span className="ml-1 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                        IADE
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{s.order.orderNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.order.customerName}</p>
                    {s.order.customerEmail && (
                      <p className="text-xs text-muted-foreground">{s.order.customerEmail}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {PROVIDER_NAMES[s.provider] || s.provider}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs">{s.trackingNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        STATUS_COLORS[s.status] || "bg-muted"
                      }`}
                    >
                      {STATUS_LABELS[s.status] || s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(s.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/kargo/${s.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Detay
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-border">
          {filtered.map((s) => (
            <div key={s.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/kargo/${s.id}`}
                    className="font-semibold text-primary hover:underline text-sm font-mono"
                  >
                    {s.shipmentNumber}
                  </Link>
                  {s.type === "return" && (
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                      IADE
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(s.createdAt).toLocaleDateString("tr-TR")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{s.order.customerName}</p>
                  <p className="text-xs text-muted-foreground">Siparis {s.order.orderNumber}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {PROVIDER_NAMES[s.provider] || s.provider}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    STATUS_COLORS[s.status] || "bg-muted"
                  }`}
                >
                  {STATUS_LABELS[s.status] || s.status}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{s.trackingNumber}</span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Gonderi bulunamadi
          </div>
        )}
      </div>
    </>
  );
}
