"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
}

export default function NewsletterList({
  subscribers,
}: {
  subscribers: Subscriber[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (email: string) => {
    if (!confirm(`"${email}" adresini silmek istediginize emin misiniz?`)) return;
    setDeleting(email);
    try {
      const res = await fetch(`/api/newsletter/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Silme islemi basarisiz.");
        return;
      }
      router.refresh();
    } catch {
      alert("Bir hata olustu.");
    } finally {
      setDeleting(null);
    }
  };

  const handleCSVDownload = () => {
    const csv =
      "E-posta,Abone Tarihi\n" +
      filtered
        .map(
          (s) =>
            `${s.email},${new Date(s.createdAt).toLocaleDateString("tr-TR")}`
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulten-aboneleri.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="E-posta ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-border rounded-lg px-4 py-2 bg-card text-foreground flex-1"
        />
        <button
          onClick={handleCSVDownload}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-muted transition-colors whitespace-nowrap"
        >
          CSV Indir
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Henuz abone yok.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    E-posta
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Abone Tarihi
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                    Islemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-border hover:bg-muted transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-foreground">
                      {s.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(s.email)}
                        disabled={deleting === s.email}
                        className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {deleting === s.email ? "Siliniyor..." : "Sil"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-border">
            {filtered.map((s) => (
              <div key={s.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium truncate">{s.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(s.email)}
                  disabled={deleting === s.email}
                  className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 shrink-0 ml-2"
                >
                  {deleting === s.email ? "..." : "Sil"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
