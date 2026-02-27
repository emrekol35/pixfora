"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cart";
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

export default function CartRecommendations() {
  const items = useCartStore((s) => s.items);
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(false);

  // Sepetteki urun ID'leri degisince onerileri guncelle
  const productIds = items.map((item) => item.product.id).join(",");

  useEffect(() => {
    if (!productIds) {
      setProducts([]);
      return;
    }

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/recommendations?type=cart&productIds=${encodeURIComponent(productIds)}&limit=4`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
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
  }, [productIds]);

  if (products.length === 0 && !loading) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold mb-4">Bu Urunlerle Sik Alinanlar</h3>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-xl mb-3" />
              <div className="h-3 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
