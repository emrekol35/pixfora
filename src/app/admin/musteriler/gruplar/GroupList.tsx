"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface Group {
  id: string;
  name: string;
  discountPercent: number;
  userCount: number;
}

export default function GroupList({ groups }: { groups: Group[] }) {
  const router = useRouter();

  async function handleDelete(group: Group) {
    if (!confirm('"' + group.name + '" grubunu silmek istediginize emin misiniz?')) return;
    const res = await fetch("/api/user-groups/" + group.id, { method: "DELETE" });
    if (res.ok) router.refresh();
    else {
      const data = await res.json();
      alert(data.error || "Silme islemi basarisiz.");
    }
  }

  if (groups.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">Henuz musteri grubu eklenmemis.</p>
        <Link href="/admin/musteriler/gruplar/yeni" className="text-primary hover:underline text-sm mt-2 inline-block">Ilk grubu olusturun</Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ad</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Indirim %</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Uye Sayisi</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Islemler</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group.id} className="border-b border-border hover:bg-muted/50">
              <td className="px-4 py-3 font-medium">{group.name}</td>
              <td className="px-4 py-3 text-center text-sm">%{group.discountPercent}</td>
              <td className="px-4 py-3 text-center text-sm">{group.userCount}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link href={"/admin/musteriler/gruplar/" + group.id} className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 transition-colors">Duzenle</Link>
                  <button onClick={() => handleDelete(group)} className="px-3 py-1 text-sm bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors">Sil</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
