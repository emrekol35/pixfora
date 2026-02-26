"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Slide {
  id: string;
  title: string | null;
  subtitle: string | null;
  image: string;
  link: string | null;
  order: number;
  isActive: boolean;
}

export default function SlideList({ slides }: { slides: Slide[] }) {
  const router = useRouter();

  async function handleDelete(slide: Slide) {
    if (!confirm("Bu slideri silmek istediginize emin misiniz?")) return;

    const res = await fetch(`/api/slides/${slide.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      alert("Silme islemi basarisiz.");
    }
  }

  if (slides.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">Henuz slider eklenmemis.</p>
        <Link href="/admin/icerik/sliderlar/yeni" className="text-primary hover:underline text-sm mt-2 inline-block">
          Ilk slideri olusturun
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {slides.map((slide) => (
        <div key={slide.id} className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="relative h-40 bg-muted">
            <Image src={slide.image} alt={slide.title || "Slider"} fill className="object-cover" />
            {!slide.isActive && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-sm font-medium">Pasif</span>
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm truncate">{slide.title || "Basliksiz"}</h3>
              <span className="text-xs text-muted-foreground">Sira: {slide.order}</span>
            </div>
            {slide.subtitle && (
              <p className="text-xs text-muted-foreground truncate mb-2">{slide.subtitle}</p>
            )}
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/icerik/sliderlar/${slide.id}`}
                className="flex-1 text-center px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 transition-colors"
              >
                Duzenle
              </Link>
              <button
                onClick={() => handleDelete(slide)}
                className="px-3 py-1 text-sm bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
