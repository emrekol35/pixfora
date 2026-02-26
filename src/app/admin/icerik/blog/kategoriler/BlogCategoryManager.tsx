"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
  postCount: number;
}

export default function BlogCategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [order, setOrder] = useState("0");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      const url = editingId ? `/api/blog/categories/${editingId}` : "/api/blog/categories";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), order: order || "0" }),
      });

      if (res.ok) {
        setName("");
        setOrder("0");
        setEditingId(null);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Islem basarisiz.");
      }
    } catch {
      alert("Bir hata olustu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`"${cat.name}" kategorisini silmek istediginize emin misiniz?`)) {
      return;
    }

    const res = await fetch(`/api/blog/categories/${cat.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Silme islemi basarisiz.");
    }
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setName(cat.name);
    setOrder(cat.order.toString());
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setOrder("0");
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">
          {editingId ? "Kategori Duzenle" : "Yeni Kategori Ekle"}
        </h2>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Kategori Adi *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Kategori adi"
              required
            />
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium mb-1">Sira</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              min="0"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? "..." : editingId ? "Guncelle" : "Ekle"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              Iptal
            </button>
          )}
        </div>
      </form>

      {/* Liste */}
      {categories.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">Henuz blog kategorisi eklenmemis.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ad</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Slug</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Sira</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Yazi Sayisi</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Islemler</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{cat.name}</td>
                  <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{cat.slug}</td>
                  <td className="px-4 py-3 text-center text-sm">{cat.order}</td>
                  <td className="px-4 py-3 text-center text-sm">{cat.postCount}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(cat)}
                        className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 transition-colors"
                      >
                        Duzenle
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
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
      )}
    </div>
  );
}
