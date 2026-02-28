"use client";

import Link from "next/link";
import { useState } from "react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  groupName: string | null;
  orderCount: number;
  isBlacklisted: boolean;
  createdAt: string;
}

export default function CustomerList({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState("");

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Musteri ara (ad veya e-posta)..."
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">Musteri bulunamadi.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ad</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">E-posta</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Grup</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Siparis</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Durum</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Islemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id} className="border-b border-border hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{customer.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{customer.email}</td>
                    <td className="px-4 py-3 text-sm">{customer.groupName || "-"}</td>
                    <td className="px-4 py-3 text-center text-sm">{customer.orderCount}</td>
                    <td className="px-4 py-3 text-center">
                      {customer.isBlacklisted ? (
                        <span className="px-2 py-0.5 text-xs bg-danger/10 text-danger rounded-full">Kara Liste</span>
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-success" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={"/admin/musteriler/" + customer.id}
                        className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 transition-colors"
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
            {filtered.map((customer) => (
              <div key={customer.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{customer.name}</p>
                    {customer.isBlacklisted ? (
                      <span className="px-1.5 py-0.5 text-[10px] bg-danger/10 text-danger rounded-full">Kara Liste</span>
                    ) : (
                      <span className="inline-block w-2 h-2 rounded-full bg-success" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {customer.orderCount} siparis
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {customer.groupName && (
                      <span className="px-2 py-0.5 bg-muted rounded-full">{customer.groupName}</span>
                    )}
                    {customer.phone && <span>{customer.phone}</span>}
                  </div>
                  <Link
                    href={"/admin/musteriler/" + customer.id}
                    className="px-3 py-1.5 text-sm bg-muted rounded-lg hover:bg-muted/80 transition-colors"
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
  );
}
