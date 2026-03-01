"use client";

import React, { useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { SHIMMER_PLACEHOLDER } from "@/lib/image-utils";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { trackEvent } from "@/lib/tracking";

const priceFormatter = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });

interface ProductCardProps {
  product: {
    id: string; name: string; slug: string; price: number;
    comparePrice?: number | null; stock: number; minQty: number; maxQty?: number | null;
    images: { url: string; alt?: string | null }[];
    category?: { name: string } | null; brand?: { name: string } | null;
    isFeatured?: boolean; avgRating?: number; reviewCount?: number;
  };
}

function ProductCardMinimalInner({ product }: ProductCardProps) {
  const t = useTranslations("product");
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(product.id));
  const image = product.images[0];
  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const discountPercent = hasDiscount ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100) : 0;

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (product.stock <= 0) return;
    addItem({ id: product.id, name: product.name, slug: product.slug, price: product.price, comparePrice: product.comparePrice, image: image?.url || null, stock: product.stock, minQty: product.minQty, maxQty: product.maxQty });
    trackEvent("add_to_cart", { productId: product.id, productName: product.name, price: product.price, quantity: 1, source: "product_card" });
  }, [addItem, product, image]);

  const handleToggleWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); toggleWishlist(product.id);
  }, [toggleWishlist, product.id]);

  return (
    <Link href={`/urun/${product.slug}`} className="group bg-card border border-border overflow-hidden hover:border-primary/30 transition-colors"
      onClick={() => trackEvent("product_click", { productId: product.id, productName: product.name })}>
      {/* Image — no zoom effect */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {image ? (
          <Image src={image.url} alt={image.alt || product.name} fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            placeholder="blur" blurDataURL={SHIMMER_PLACEHOLDER} className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {hasDiscount && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-danger text-white text-xs font-bold">%{discountPercent}</span>
        )}
        {product.stock <= 0 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-muted-foreground text-white text-xs font-bold">{t("outOfStock")}</span>
        )}
        <button onClick={handleToggleWishlist}
          className="absolute top-2 right-2 w-7 h-7 bg-background/80 backdrop-blur flex items-center justify-center z-10">
          <svg className={`w-3.5 h-3.5 ${isInWishlist ? "text-danger fill-danger" : "text-muted-foreground"}`} fill={isInWishlist ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-foreground line-clamp-1 mb-1">{product.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-primary">{priceFormatter.format(product.price)}</span>
          {hasDiscount && <span className="text-xs text-muted-foreground line-through">{priceFormatter.format(product.comparePrice!)}</span>}
        </div>
      </div>
    </Link>
  );
}

const ProductCardMinimal = memo(ProductCardMinimalInner);
export default ProductCardMinimal;
