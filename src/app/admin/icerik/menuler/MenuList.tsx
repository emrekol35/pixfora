"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface MenuInfo {
  id: string;
  name: string;
  location: string;
  itemCount: number;
}

const LOCATION_LABELS: Record<string, string> = {
  header: "Ust Menu",
  footer: "Alt Menu",
  mobile: "Mobil Menu",
};

export default function MenuList({ menus }: { menus: MenuInfo[] }) {
  const router = useRouter();

  async function handleDelete(menu: MenuInfo) {
    if (!confirm(`"${menu.name}" menusunu silmek istediginize emin misiniz?`)) return;

    const res = await fetch(`/api/menus/${menu.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("Silme islemi basarisiz.");
  }

  if (menus.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">Henuz menu eklenmemis.</p>
        <Link href="/admin/icerik/menuler/yeni" className="text-primary hover:underline text-sm mt-2 inline-block">Ilk menuyu olusturun</Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ad</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Konum</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Oge Sayisi</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Islemler</th>
          </tr>
        </thead>
        <tbody>
          {menus.map((menu) => (
            <tr key={menu.id} className="border-b border-border hover:bg-muted/50">
              <td className="px-4 py-3 font-medium">{menu.name}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{LOCATION_LABELS[menu.location] || menu.location}</td>
              <td className="px-4 py-3 text-center text-sm">{menu.itemCount}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/admin/icerik/menuler/${menu.id}`} className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 transition-colors">Duzenle</Link>
                  <button onClick={() => handleDelete(menu)} className="px-3 py-1 text-sm bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors">Sil</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
