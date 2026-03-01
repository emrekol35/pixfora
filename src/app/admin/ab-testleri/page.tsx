"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface ABTest {
  id: string;
  name: string;
  testType: string;
  status: string;
  trafficPercent: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  _count: {
    variants: number;
    assignments: number;
  };
}

interface APIResponse {
  tests: ABTest[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUS_TABS = [
  { label: "Tumu", value: "" },
  { label: "Taslak", value: "DRAFT" },
  { label: "Calisiyor", value: "RUNNING" },
  { label: "Duraklatildi", value: "PAUSED" },
  { label: "Tamamlandi", value: "COMPLETED" },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  DRAFT: {
    label: "Taslak",
    className: "bg-gray-100 text-gray-700 border-gray-300",
  },
  RUNNING: {
    label: "Calisiyor",
    className: "bg-green-100 text-green-700 border-green-300",
  },
  PAUSED: {
    label: "Duraklatildi",
    className: "bg-yellow-100 text-yellow-700 border-yellow-300",
  },
  COMPLETED: {
    label: "Tamamlandi",
    className: "bg-blue-100 text-blue-700 border-blue-300",
  },
};

const TEST_TYPE_LABELS: Record<string, string> = {
  UI_VARIANT: "UI Varyant",
  FEATURE_FLAG: "Ozellik Flagi",
  CONTENT: "Icerik",
  LAYOUT: "Yerlesim",
};

export default function ABTestListPage() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/admin/ab-tests?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Testler yuklenemedi");
      }
      const data: APIResponse = await res.json();
      setTests(data.tests);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Bilinmeyen bir hata olustu"
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleStatusChange = async (testId: string, newStatus: string) => {
    if (actionLoading) return;
    setActionLoading(testId);
    try {
      const res = await fetch(`/api/admin/ab-tests/${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Durum guncellenemedi");
      }
      await fetchTests();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Durum guncellenirken hata olustu"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (testId: string, testName: string) => {
    if (actionLoading) return;
    const confirmed = window.confirm(
      `"${testName}" testini silmek istediginize emin misiniz? Bu islem geri alinamaz.`
    );
    if (!confirmed) return;

    setActionLoading(testId);
    try {
      const res = await fetch(`/api/admin/ab-tests/${testId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Test silinemedi");
      }
      await fetchTests();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Test silinirken hata olustu"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("tr-TR");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">A/B Testleri</h1>
        <Link
          href="/admin/ab-testleri/yeni"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          + Yeni Test Olustur
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              statusFilter === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Yukleniyor...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && tests.length === 0 && (
        <div className="text-center py-20 bg-card border border-border rounded-xl">
          <div className="text-4xl mb-4">🧪</div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Henuz A/B test bulunmuyor
          </h3>
          <p className="text-muted-foreground mb-6">
            Yeni bir A/B test olusturarak baslayin.
          </p>
          <Link
            href="/admin/ab-testleri/yeni"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
          >
            + Yeni Test Olustur
          </Link>
        </div>
      )}

      {/* Table */}
      {!loading && tests.length > 0 && (
        <>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                      Ad
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                      Tur
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                      Durum
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                      Traffic %
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                      Baslangic
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                      Bitis
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                      Varyantlar
                    </th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                      Aksiyonlar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test) => {
                    const badge = STATUS_BADGE[test.status] || {
                      label: test.status,
                      className: "bg-gray-100 text-gray-700",
                    };
                    const isProcessing = actionLoading === test.id;

                    return (
                      <tr
                        key={test.id}
                        className="border-t border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                          <Link
                            href={`/admin/ab-testleri/${test.id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {test.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {TEST_TYPE_LABELS[test.testType] || test.testType}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          %{test.trafficPercent}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(test.startDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(test.endDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {test._count.variants}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isProcessing ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            ) : (
                              <>
                                {test.status === "DRAFT" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleStatusChange(test.id, "RUNNING")
                                      }
                                      className="px-2.5 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                                    >
                                      Baslat
                                    </button>
                                    <Link
                                      href={`/admin/ab-testleri/${test.id}`}
                                      className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                      Duzenle
                                    </Link>
                                    <button
                                      onClick={() =>
                                        handleDelete(test.id, test.name)
                                      }
                                      className="px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
                                    >
                                      Sil
                                    </button>
                                  </>
                                )}
                                {test.status === "RUNNING" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleStatusChange(test.id, "PAUSED")
                                      }
                                      className="px-2.5 py-1 text-xs font-medium text-white bg-yellow-500 rounded hover:bg-yellow-600 transition-colors"
                                    >
                                      Duraklat
                                    </button>
                                    <Link
                                      href={`/admin/ab-testleri/${test.id}/sonuclar`}
                                      className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                      Sonuclar
                                    </Link>
                                  </>
                                )}
                                {test.status === "PAUSED" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleStatusChange(test.id, "RUNNING")
                                      }
                                      className="px-2.5 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                                    >
                                      Devam Et
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleStatusChange(
                                          test.id,
                                          "COMPLETED"
                                        )
                                      }
                                      className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                                    >
                                      Tamamla
                                    </button>
                                    <Link
                                      href={`/admin/ab-testleri/${test.id}/sonuclar`}
                                      className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                      Sonuclar
                                    </Link>
                                  </>
                                )}
                                {test.status === "COMPLETED" && (
                                  <Link
                                    href={`/admin/ab-testleri/${test.id}/sonuclar`}
                                    className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    Sonuclar
                                  </Link>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Toplam {total} test, Sayfa {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Onceki
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - page) <= 2
                  )
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center gap-1">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="text-muted-foreground">...</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          p === page
                            ? "bg-primary text-white"
                            : "border border-border hover:bg-muted"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sonraki
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
