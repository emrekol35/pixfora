"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BlogCategory {
  id: string;
  name: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  image: string | null;
  categoryId: string | null;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
}

export default function PostForm({
  post,
  categories,
}: {
  post?: Post;
  categories: BlogCategory[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: post?.title || "",
    content: post?.content || "",
    excerpt: post?.excerpt || "",
    image: post?.image || "",
    categoryId: post?.categoryId || "",
    isActive: post?.isActive ?? true,
    seoTitle: post?.seoTitle || "",
    seoDescription: post?.seoDescription || "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = post ? `/api/blog/posts/${post.id}` : "/api/blog/posts";
      const method = post ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          excerpt: formData.excerpt || undefined,
          image: formData.image || undefined,
          categoryId: formData.categoryId || undefined,
          seoTitle: formData.seoTitle || undefined,
          seoDescription: formData.seoDescription || undefined,
        }),
      });

      if (res.ok) {
        router.push("/admin/icerik/blog");
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Yazi Bilgileri</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Baslik *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Blog yazisi basligi"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kategori</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Kategori Secin</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ozet</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Kisa bir ozet (liste sayfasinda gorunur)"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Icerik *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Blog yazisi icerigi..."
              rows={15}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Gorsel URL</label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="/uploads/blog/gorsel.jpg"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm">Aktif (yayinda)</label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">SEO Ayarlari</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">SEO Basligi</label>
            <input
              type="text"
              value={formData.seoTitle}
              onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Arama motorlari icin baslik"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SEO Aciklamasi</label>
            <textarea
              value={formData.seoDescription}
              onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Arama motorlari icin aciklama"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Kaydediliyor..." : post ? "Guncelle" : "Olustur"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
        >
          Iptal
        </button>
      </div>
    </form>
  );
}
