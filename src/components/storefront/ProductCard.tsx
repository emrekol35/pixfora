"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number | null;
    stock: number;
    minQty: number;
    maxQty?: number | null;
    images: { url: string; alt?: string | null }[];
    category?: { name: string } | null;
    brand?: { name: string } | null;
    isFeatured?: boolean;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const image = product.images[0];
  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) return;

    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      comparePrice: product.comparePrice,
      image: image?.url || null,
      stock: product.stock,
      minQty: product.minQty,
      maxQty: product.maxQty,
    });
  };

  return (
    <Link
      href={`/urun/${product.slug}`}
      className="group bg-white rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {image ? (
          <img
            src={image.url}
            alt={image.alt || product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && (
            <span className="px-2 py-0.5 bg-danger text-white text-xs font-bold rounded">
              %{discountPercent}
            </span>
          )}
          {product.isFeatured && (
            <span className="px-2 py-0.5 bg-warning text-white text-xs font-bold rounded">
              One Cikan
            </span>
          )}
          {product.stock <= 0 && (
            <span className="px-2 py-0.5 bg-muted-foreground text-white text-xs font-bold rounded">
              Tukendi
            </span>
          )}
        </div>

        {/* Quick Add */}
        {product.stock > 0 && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-2 right-2 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-primary-dark"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {product.category && (
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
            {product.category.name}
          </p>
        )}
        <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-primary">
            {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(product.comparePrice!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
