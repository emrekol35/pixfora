"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface Post {
  id: string;
  title: string;
  slug: string;
  isActive: boolean;
  category: { name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export default function PostList({ posts }: { posts: Post[] }) {
  const router = useRouter();

  async function handleDelete(post: Post) {
    if (!confirm(`"${post.title}" yazisini silmek istediginize emin misiniz?`)) {
      return;
    }

    const res = await fetch(`/api/blog/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Silme islemi basarisiz.");
    }
  }

  if (posts.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">Henuz blog yazisi eklenmemis.</p>
        <Link
          href="/admin/icerik/blog/yeni"
          className="text-primary hover:underline text-sm mt-2 inline-block"
        >
          Ilk yaziyi olusturun
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Baslik</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Kategori</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Durum</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tarih</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Islemler</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b border-border hover:bg-muted/50">
              <td className="px-4 py-3 font-medium">{post.title}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {post.category?.name || "-"}
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    post.isActive ? "bg-success" : "bg-danger"
                  }`}
                />
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {new Date(post.createdAt).toLocaleDateString("tr-TR")}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/icerik/blog/${post.id}`}
                    className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 transition-colors"
                  >
                    Duzenle
                  </Link>
                  <button
                    onClick={() => handleDelete(post)}
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
