"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface Page {
  id: string;
  title: string;
  slug: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function PageList({ pages }: { pages: Page[] }) {
  const router = useRouter();

  async function handleDelete(page: Page) {
    if (!confirm(`"${page.title}" sayfasini silmek istediginize emin misiniz?`)) {
      return;
    }

    const res = await fetch(`/api/pages/${page.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Silme islemi basarisiz.");
    }
  }

  if (pages.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">Henuz sayfa eklenmemis.</p>
        <Link
          href="/admin/icerik/sayfalar/yeni"
          className="text-primary hover:underline text-sm mt-2 inline-block"
        >
          Ilk sayfayi olusturun
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Baslik</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Slug</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Sira</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Durum</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Islemler</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id} className="border-b border-border hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{page.title}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-sm text-muted-foreground">/sayfa/{page.slug}</span>
                </td>
                <td className="px-4 py-3 text-center text-sm">{page.order}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      page.isActive ? "bg-success" : "bg-danger"
                    }`}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/icerik/sayfalar/${page.id}`}
                      className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 transition-colors"
                    >
                      Duzenle
                    </Link>
                    <button
                      onClick={() => handleDelete(page)}
                      className="px-3 py-1 text-sm bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors"
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
        {pages.map((page) => (
          <div key={page.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{page.title}</p>
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    page.isActive ? "bg-success" : "bg-danger"
                  }`}
                />
              </div>
              <span className="text-xs text-muted-foreground">Sira: {page.order}</span>
            </div>
            <p className="font-mono text-xs text-muted-foreground">/sayfa/{page.slug}</p>
            <div className="flex items-center gap-2 pt-1">
              <Link
                href={`/admin/icerik/sayfalar/${page.id}`}
                className="flex-1 text-center px-3 py-1.5 text-xs bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                Duzenle
              </Link>
              <button
                onClick={() => handleDelete(page)}
                className="px-3 py-1.5 text-xs bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
