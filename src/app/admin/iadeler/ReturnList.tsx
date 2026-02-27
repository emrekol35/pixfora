"use client";

import { useState } from "react";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Beklemede",
  APPROVED: "Onaylandi",
  REJECTED: "Reddedildi",
  RECEIVED: "Teslim Alindi",
  REFUNDED: "Iade Edildi",
  CANCELLED: "Iptal Edildi",
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning",
  APPROVED: "bg-primary/10 text-primary",
  REJECTED: "bg-danger/10 text-danger",
  RECEIVED: "bg-blue-500/10 text-blue-600",
  REFUNDED: "bg-success/10 text-success",
  CANCELLED: "bg-muted-foreground/10 text-muted-foreground",
};

const REASON_LABELS: Record<string, string> = {
  defective: "Kusurlu",
  wrong_item: "Yanlis Urun",
  changed_mind: "Fikir Degisikligi",
  damaged: "Hasarli",
  not_as_described: "Tarifine Uymuyor",
  other: "Diger",
};

interface ReturnItem {
  id: string;
  returnNumber: string;
  status: string;
  reason: string;
  refundAmount: number;
  createdAt: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  itemNames: string;
}

const TABS = [
  { key: "all", label: "Tumu" },
  { key: "PENDING", label: "Bekleyen" },
  { key: "APPROVED", label: "Onaylanan" },
  { key: "RECEIVED", label: "Teslim Alinan" },
  { key: "REFUNDED", label: "Iade Edilen" },
  { key: "REJECTED", label: "Reddedilen" },
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price);

export default function ReturnList({ returns }: { returns: ReturnItem[] }) {
  const [activeTab, setActiveTab] = useState("all");

  const filtered =
    activeTab === "all"
      ? returns
      : returns.filter((r) => r.status === activeTab);

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {TABS.map((tab) => {
          const count =
            tab.key === "all"
              ? returns.length
              : returns.filter((r) => r.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-border"
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Iade No</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Siparis</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Musteri</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Neden</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Durum</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Tutar</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Tarih</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Islem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Bu durumda iade talebi bulunamadi
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold">{r.returnNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">#{r.orderNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{r.customerName}</p>
                      <p className="text-xs text-muted-foreground">{r.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{REASON_LABELS[r.reason] || r.reason}</span>
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">{r.itemNames}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_BADGE[r.status] || "bg-muted"}`}>
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold">{formatPrice(r.refundAmount)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/iadeler/${r.id}`}
                        className="text-sm text-primary hover:underline font-medium"
                      >
                        Detay
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
