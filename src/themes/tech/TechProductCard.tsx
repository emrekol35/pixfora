"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { SHIMMER_PLACEHOLDER } from "@/lib/image-utils";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useCompareStore } from "@/store/compare";
import { trackEvent } from "@/lib/tracking";
import type { ProductCardProps } from "@/themes/types";

const priceFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

export default function TechProductCard({ product }: ProductCardProps) {
  const t = useTranslations("product");
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(product.id));
  const addToCompare = useCompareStore((s) => s.addItem);
  const removeFromCompare = useCompareStore((s) => s.removeItem);
  const isInCompare = useCompareStore((s) => s.isInCompare(product.id));
  const image = product.images[0];
  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
    : 0;

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
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
      trackEvent("add_to_cart", {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        source: "product_card",
      });
    },
    [addItem, product, image]
  );

  const handleToggleWishlist = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleWishlist(product.id);
    },
    [toggleWishlist, product.id]
  );

  const handleToggleCompare = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isInCompare) {
        removeFromCompare(product.id);
      } else {
        addToCompare({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          comparePrice: product.comparePrice || null,
          stock: product.stock,
          image: image?.url || null,
          category: product.category?.name || null,
          brand: product.brand?.name || null,
        });
      }
    },
    [isInCompare, removeFromCompare, addToCompare, product, image]
  );

  return (
    <Link
      href={`/urun/${product.slug}`}
      className="group bg-[#111122] rounded-sm border border-[#2a2a3e] overflow-hidden hover:border-[#00d4ff] hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] transition-all duration-300"
      onClick={() => trackEvent("product_click", { productId: product.id, productName: product.name })}
    >
      {/* Image */}
      <div className="relative aspect-square bg-[#0a0a1a] overflow-hidden">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            placeholder="blur"
            blurDataURL={SHIMMER_PLACEHOLDER}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && (
            <span className="px-2 py-0.5 bg-[#00ff88] text-black text-xs font-bold rounded-sm font-mono">
              %{discountPercent}
            </span>
          )}
          {product.isFeatured && (
            <span className="px-2 py-0.5 bg-[#00d4ff] text-black text-xs font-bold rounded-sm font-mono">
              {t("featured")}
            </span>
          )}
          {product.stock <= 0 && (
            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs font-bold rounded-sm font-mono">
              {t("outOfStock")}
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-2 right-2 w-8 h-8 bg-[#1a1a2e]/80 backdrop-blur border border-[#2a2a3e] rounded-sm flex items-center justify-center hover:border-[#00d4ff] hover:text-[#00d4ff] transition-all z-10"
        >
          <svg
            className={`w-4 h-4 ${isInWishlist ? "text-[#00ff88] fill-[#00ff88]" : "text-gray-400"}`}
            fill={isInWishlist ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Quick Add & Compare */}
        <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Compare */}
          <button
            onClick={handleToggleCompare}
            className={`w-9 h-9 rounded-sm flex items-center justify-center shadow-lg transition-all ${
              isInCompare
                ? "bg-[#00d4ff] text-black border border-[#00d4ff]"
                : "bg-[#1a1a2e]/90 text-gray-400 border border-[#2a2a3e] hover:border-[#00d4ff] hover:text-[#00d4ff]"
            }`}
            title={isInCompare ? t("removeFromCompare") : t("compare")}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
          {/* Quick Add */}
          {product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              className="w-9 h-9 bg-[#00d4ff] text-black rounded-sm flex items-center justify-center shadow-lg shadow-[#00d4ff]/20 hover:bg-[#00d4ff]/80 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        {product.category && (
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.15em] mb-1 font-mono">
            {product.category.name}
          </p>
        )}
        <h3 className="text-sm font-medium text-gray-200 line-clamp-2 mb-1.5 min-h-[2.5rem] group-hover:text-[#00d4ff] transition-colors">
          {product.name}
        </h3>
        {product.avgRating && product.avgRating > 0 && product.reviewCount && product.reviewCount > 0 ? (
          <div className="flex items-center gap-1 mb-1.5">
            <svg className="w-3.5 h-3.5 text-[#00d4ff]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs text-gray-500 font-mono">
              {product.avgRating.toFixed(1)} ({product.reviewCount})
            </span>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-[#00d4ff] drop-shadow-[0_0_4px_rgba(0,212,255,0.3)]">
            {priceFormatter.format(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-600 line-through">
              {priceFormatter.format(product.comparePrice!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
