"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface Redirect {
  id: string;
  fromPath: string;
  toPath: string;
  type: number;
  createdAt: string;
}

export default function RedirectList({ redirects }: { redirects: Redirect[] }) {
  const router = useRouter();

  async function handleDelete(redirect: Redirect) {
    if (!confirm(`"${redirect.fromPath}" yonlendirmesini silmek istediginize emin misiniz?`)) {
      return;
    }

    const res = await fetch(`/api/redirects/${redirect.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Silme islemi basarisiz.");
    }
  }

  if (redirects.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">Henuz yonlendirme eklenmemis.</p>
        <Link
          href="/admin/seo/yeni"
          className="text-primary hover:underline text-sm mt-2 inline-block"
        >
          Ilk yonlendirmeyi olusturun
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Kaynak Yol</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Hedef Yol</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Tip</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tarih</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Islemler</th>
          </tr>
        </thead>
        <tbody>
          {redirects.map((redirect) => (
            <tr key={redirect.id} className="border-b border-border hover:bg-muted/50">
              <td className="px-4 py-3">
                <span className="font-mono text-sm">{redirect.fromPath}</span>
              </td>
              <td className="px-4 py-3">
                <span className="font-mono text-sm">{redirect.toPath}</span>
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                    redirect.type === 301
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {redirect.type}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {new Date(redirect.createdAt).toLocaleDateString("tr-TR")}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/seo/${redirect.id}`}
                    className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 transition-colors"
                  >
                    Duzenle
                  </Link>
                  <button
                    onClick={() => handleDelete(redirect)}
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
  );
}
