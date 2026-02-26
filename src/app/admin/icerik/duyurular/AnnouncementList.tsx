"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface Announcement {
  id: string;
  text: string;
  link: string | null;
  bgColor: string;
  textColor: string;
  isActive: boolean;
  type: string;
}

export default function AnnouncementList({ announcements }: { announcements: Announcement[] }) {
  const router = useRouter();

  async function handleDelete(a: Announcement) {
    if (!confirm("Bu duyuruyu silmek istediginize emin misiniz?")) return;
    const res = await fetch(`/api/announcements/${a.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("Silme islemi basarisiz.");
  }

  if (announcements.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">Henuz duyuru eklenmemis.</p>
        <Link href="/admin/icerik/duyurular/yeni" className="text-primary hover:underline text-sm mt-2 inline-block">Ilk duyuruyu olusturun</Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Metin</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Renk</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Durum</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Islemler</th>
          </tr>
        </thead>
        <tbody>
          {announcements.map((a) => (
            <tr key={a.id} className="border-b border-border hover:bg-muted/50">
              <td className="px-4 py-3 text-sm max-w-xs truncate">{a.text}</td>
              <td className="px-4 py-3 text-center">
                <div className="inline-flex items-center gap-1">
                  <span className="inline-block w-4 h-4 rounded border" style={{ backgroundColor: a.bgColor }} />
                  <span className="inline-block w-4 h-4 rounded border" style={{ backgroundColor: a.textColor }} />
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`inline-block w-2 h-2 rounded-full ${a.isActive ? "bg-success" : "bg-danger"}`} />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/admin/icerik/duyurular/${a.id}`} className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 transition-colors">Duzenle</Link>
                  <button onClick={() => handleDelete(a)} className="px-3 py-1 text-sm bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors">Sil</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
