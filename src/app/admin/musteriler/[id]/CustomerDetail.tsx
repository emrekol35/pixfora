"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Address {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  city: string;
  district: string;
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  groupId: string | null;
  isBlacklisted: boolean;
  createdAt: string;
  addresses: Address[];
  orders: Order[];
}

interface Group {
  id: string;
  name: string;
  discountPercent: number;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Beklemede",
  CONFIRMED: "Onaylandi",
  PROCESSING: "Hazirlaniyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "Iptal",
  REFUNDED: "Iade",
};

export default function CustomerDetail({
  customer,
  groups,
}: {
  customer: Customer;
  groups: Group[];
}) {
  const router = useRouter();
  const [groupId, setGroupId] = useState(customer.groupId || "");
  const [isBlacklisted, setIsBlacklisted] = useState(customer.isBlacklisted);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch("/api/customers/" + customer.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: groupId || null, isBlacklisted }),
      });

      if (res.ok) {
        router.refresh();
        alert("Musteri guncellendi.");
      } else {
        alert("Guncelleme basarisiz.");
      }
    } catch {
      alert("Bir hata olustu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Musteri Bilgileri */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Musteri Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Ad:</span> <span className="font-medium ml-2">{customer.name}</span></div>
          <div><span className="text-muted-foreground">E-posta:</span> <span className="font-medium ml-2">{customer.email}</span></div>
          <div><span className="text-muted-foreground">Telefon:</span> <span className="font-medium ml-2">{customer.phone || "-"}</span></div>
          <div><span className="text-muted-foreground">Kayit Tarihi:</span> <span className="font-medium ml-2">{new Date(customer.createdAt).toLocaleDateString("tr-TR")}</span></div>
        </div>
      </div>

      {/* Grup ve Durum */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Grup ve Durum</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Musteri Grubu</label>
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Grup Yok</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name} (%{g.discountPercent})</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4 pt-6">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="blacklist" checked={isBlacklisted} onChange={(e) => setIsBlacklisted(e.target.checked)} className="w-4 h-4" />
              <label htmlFor="blacklist" className="text-sm text-danger">Kara Listeye Al</label>
            </div>
            <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm">
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      </div>

      {/* Adresler */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Adresler ({customer.addresses.length})</h2>
        {customer.addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Kayitli adres yok.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {customer.addresses.map((addr) => (
              <div key={addr.id} className="border border-border rounded-lg p-3 text-sm">
                <p className="font-medium">{addr.title}</p>
                <p className="text-muted-foreground">{addr.firstName} {addr.lastName}</p>
                <p className="text-muted-foreground">{addr.district}, {addr.city}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Son Siparisler */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Son Siparisler ({customer.orders.length})</h2>
        {customer.orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henuz siparis yok.</p>
        ) : (
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left text-sm font-medium text-muted-foreground">Siparis No</th>
                <th className="px-3 py-2 text-right text-sm font-medium text-muted-foreground">Tutar</th>
                <th className="px-3 py-2 text-center text-sm font-medium text-muted-foreground">Durum</th>
                <th className="px-3 py-2 text-left text-sm font-medium text-muted-foreground">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.map((order) => (
                <tr key={order.id} className="border-b border-border">
                  <td className="px-3 py-2">
                    <Link href={"/admin/siparisler/" + order.id} className="text-primary hover:underline text-sm font-mono">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right text-sm">{order.total.toFixed(2)} TL</td>
                  <td className="px-3 py-2 text-center text-sm">{STATUS_LABELS[order.status] || order.status}</td>
                  <td className="px-3 py-2 text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("tr-TR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
