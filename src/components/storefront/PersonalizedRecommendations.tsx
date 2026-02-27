"use client";

import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";

interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  minQty: number;
  maxQty: number | null;
  isFeatured: boolean;
  images: { url: string; alt: string | null }[];
  category: { name: string } | null;
  brand: { name: string } | null;
  avgRating?: number;
  reviewCount?: number;
}

export default function PersonalizedRecommendations() {
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await fetch("/api/recommendations?type=personalized&limit=8");
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();

        // Eger sonuc bossa veya kullanici giris yapmamissa gosterme
        // API zaten trending fallback yapiyor ama biz sadece giris yapmis kullanicilara gosteriyoruz
        // Session kontrolu: /api/recommendations personalized type session kontrolu yapar
        // Eger trending donuyorsa (giris yapmamis) biz burada gostermeyiz (zaten trending bolumu var)

        // Session kontrolu icin basit bir check
        const sessionRes = await fetch("/api/account", { method: "GET" });
        if (sessionRes.ok) {
          setHasSession(true);
          if (Array.isArray(data) && data.length > 0) {
            setProducts(data);
          }
        }
      } catch {
        // Sessizce devam et
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  // Giris yapmamis veya oneri yoksa gosterme
  if (!hasSession || products.length === 0) return null;

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-xl md:text-2xl font-bold mb-6">Size Ozel</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-xl mb-3" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold">Size Ozel ✨</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
