"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  product: { name: string; slug: string };
  user: { name: string | null; email: string };
}

type FilterTab = "all" | "pending" | "approved";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "text-yellow-500" : "text-gray-300"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function ReviewList({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>("all");

  const filteredReviews = reviews.filter((r) => {
    if (filter === "pending") return !r.isApproved;
    if (filter === "approved") return r.isApproved;
    return true;
  });

  async function handleApprove(id: string, approve: boolean) {
    const res = await fetch(`/api/reviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: approve }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      alert("Islem basarisiz.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu yorumu silmek istediginize emin misiniz?")) return;

    const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      alert("Silme islemi basarisiz.");
    }
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: `Tumu (${reviews.length})` },
    { key: "pending", label: `Beklemede (${reviews.filter((r) => !r.isApproved).length})` },
    { key: "approved", label: `Onaylandi (${reviews.filter((r) => r.isApproved).length})` },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === tab.key
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredReviews.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">Bu filtreye uygun yorum bulunamadi.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Urun</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Musteri</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Puan</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Yorum</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Durum</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tarih</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Islemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((review) => (
                  <tr key={review.id} className="border-b border-border hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium max-w-[200px] truncate">
                      {review.product.name}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{review.user.name || "-"}</div>
                      <div className="text-xs text-muted-foreground">{review.user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Stars rating={review.rating} />
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-[250px] truncate">
                      {review.comment || "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          review.isApproved
                            ? "bg-success/10 text-success"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {review.isApproved ? "Onaylandi" : "Beklemede"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!review.isApproved ? (
                          <button
                            onClick={() => handleApprove(review.id, true)}
                            className="px-3 py-1 text-xs bg-success/10 text-success rounded hover:bg-success/20 transition-colors"
                          >
                            Onayla
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApprove(review.id, false)}
                            className="px-3 py-1 text-xs bg-warning/10 text-warning rounded hover:bg-warning/20 transition-colors"
                          >
                            Kaldir
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="px-3 py-1 text-xs bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-border">
            {filteredReviews.map((review) => (
              <div key={review.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{review.product.name}</p>
                    <p className="text-xs text-muted-foreground">{review.user.name || review.user.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Stars rating={review.rating} />
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        review.isApproved
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {review.isApproved ? "Onay" : "Bekle"}
                    </span>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{review.comment}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                  <div className="flex items-center gap-1">
                    {!review.isApproved ? (
                      <button
                        onClick={() => handleApprove(review.id, true)}
                        className="px-3 py-1.5 text-xs bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors"
                      >
                        Onayla
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApprove(review.id, false)}
                        className="px-3 py-1.5 text-xs bg-warning/10 text-warning rounded-lg hover:bg-warning/20 transition-colors"
                      >
                        Kaldir
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="px-3 py-1.5 text-xs bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition-colors"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
