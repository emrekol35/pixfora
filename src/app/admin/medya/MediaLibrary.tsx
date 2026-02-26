"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  alt: string | null;
  folder: string;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function MediaLibrary({ media }: { media: MediaItem[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const filtered = media.filter((m) =>
    m.filename.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpload = useCallback(async (files: FileList) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
      }
      router.refresh();
    } catch {
      alert("Yukleme basarisiz.");
    } finally {
      setUploading(false);
    }
  }, [router]);

  async function handleDelete(item: MediaItem) {
    if (!confirm(`"${item.filename}" dosyasini silmek istediginize emin misiniz?`)) return;
    const res = await fetch(`/api/media/${item.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("Silme islemi basarisiz.");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }

  return (
    <div className="space-y-4">
      {/* Yukleme Alani */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <p className="text-muted-foreground mb-2">
          {uploading ? "Yukleniyor..." : "Dosyalari surukleyip birakin veya"}
        </p>
        <label className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors cursor-pointer text-sm">
          Dosya Sec
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
        </label>
      </div>

      {/* Arama */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="Dosya ara..."
      />

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">Henuz medya dosyasi yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-card rounded-xl border border-border overflow-hidden group"
            >
              <div className="relative h-32 bg-muted">
                {item.mimeType.startsWith("image/") ? (
                  <Image
                    src={item.url}
                    alt={item.alt || item.filename}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-2xl">📄</div>
                )}
                <button
                  onClick={() => handleDelete(item)}
                  className="absolute top-1 right-1 w-6 h-6 bg-danger text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate">{item.filename}</p>
                <p className="text-xs text-muted-foreground">{formatSize(item.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
