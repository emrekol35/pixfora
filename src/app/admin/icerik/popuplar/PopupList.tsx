"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface Popup {
  id: string;
  title: string;
  type: string;
  isActive: boolean;
  showOnce: boolean;
  delay: number;
}

const TYPE_LABELS: Record<string, string> = {
  general: "Genel",
  exit: "Cikis",
  promotion: "Promosyon",
};

export default function PopupList({ popups }: { popups: Popup[] }) {
  const router = useRouter();

  async function handleDelete(popup: Popup) {
    if (!confirm(`"${popup.title}" pop-upini silmek istediginize emin misiniz?`)) return;
    const res = await fetch(`/api/popups/${popup.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("Silme islemi basarisiz.");
  }

  if (popups.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">Henuz pop-up eklenmemis.</p>
        <Link href="/admin/icerik/popuplar/yeni" className="text-primary hover:underline text-sm mt-2 inline-block">Ilk pop-upi olusturun</Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Baslik</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Tip</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Durum</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Bir Kez</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Gecikme</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Islemler</th>
          </tr>
        </thead>
        <tbody>
          {popups.map((popup) => (
            <tr key={popup.id} className="border-b border-border hover:bg-muted/50">
              <td className="px-4 py-3 font-medium">{popup.title}</td>
              <td className="px-4 py-3 text-center text-sm">{TYPE_LABELS[popup.type] || popup.type}</td>
              <td className="px-4 py-3 text-center">
                <span className={`inline-block w-2 h-2 rounded-full ${popup.isActive ? "bg-success" : "bg-danger"}`} />
              </td>
              <td className="px-4 py-3 text-center text-sm">{popup.showOnce ? "Evet" : "Hayir"}</td>
              <td className="px-4 py-3 text-center text-sm">{popup.delay}sn</td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/admin/icerik/popuplar/${popup.id}`} className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 transition-colors">Duzenle</Link>
                  <button onClick={() => handleDelete(popup)} className="px-3 py-1 text-sm bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors">Sil</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
