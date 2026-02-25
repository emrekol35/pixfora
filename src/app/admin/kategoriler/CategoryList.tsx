"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  order: number;
  _count?: { products: number };
  children?: Category[];
}

function CategoryRow({
  category,
  depth = 0,
}: {
  category: Category;
  depth?: number;
}) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`"${category.name}" kategorisini silmek istediginize emin misiniz?`)) {
      return;
    }

    const res = await fetch(`/api/categories/${category.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Silme islemi basarisiz.");
    }
  }

  return (
    <>
      <tr className="border-b border-border hover:bg-muted/50">
        <td className="px-4 py-3">
          <span style={{ paddingLeft: `${depth * 24}px` }} className="flex items-center gap-2">
            {depth > 0 && <span className="text-muted-foreground">└</span>}
            {category.name}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {category.slug}
        </td>
        <td className="px-4 py-3 text-center">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              category.isActive ? "bg-success" : "bg-danger"
            }`}
          />
        </td>
        <td className="px-4 py-3 text-center text-sm">
          {category._count?.products ?? 0}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            <Link
              href={`/admin/kategoriler/${category.id}`}
              className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 transition-colors"
            >
              Duzenle
            </Link>
            <button
              onClick={handleDelete}
              className="px-3 py-1 text-sm bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors"
            >
              Sil
            </button>
          </div>
        </td>
      </tr>
      {category.children?.map((child) => (
        <CategoryRow key={child.id} category={child} depth={depth + 1} />
      ))}
    </>
  );
}

export default function CategoryList({
  categories,
}: {
  categories: Category[];
}) {
  if (categories.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">Henuz kategori eklenmemis.</p>
        <Link
          href="/admin/kategoriler/yeni"
          className="text-primary hover:underline text-sm mt-2 inline-block"
        >
          Ilk kategoriyi olusturun
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Kategori Adi
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Slug
            </th>
            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
              Durum
            </th>
            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
              Urun Sayisi
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
              Islemler
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
