"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { SHIMMER_PLACEHOLDER } from "@/lib/image-utils";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { trackEvent } from "@/lib/tracking";
import type { ProductCardProps } from "@/themes/types";

const priceFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

export default function ElegantProductCard({ product }: ProductCardProps) {
  const t = useTranslations("product");
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(product.id));
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

  return (
    <Link
      href={`/urun/${product.slug}`}
      className="group bg-white border border-[#c9a96e]/30 overflow-hidden hover:border-[#c9a96e] transition-all duration-500"
      onClick={() => trackEvent("product_click", { productId: product.id, productName: product.name })}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-[#f8f6f3] overflow-hidden">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            placeholder="blur"
            blurDataURL={SHIMMER_PLACEHOLDER}
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#c9a96e]/40">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {hasDiscount && (
            <span className="px-2.5 py-1 bg-[#1a1a1a] text-[#c9a96e] text-[10px] font-serif tracking-wider uppercase">
              %{discountPercent} {t("discount") || ""}
            </span>
          )}
          {product.isFeatured && (
            <span className="px-2.5 py-1 bg-[#c9a96e] text-[#1a1a1a] text-[10px] font-serif tracking-wider uppercase">
              {t("featured")}
            </span>
          )}
          {product.stock <= 0 && (
            <span className="px-2.5 py-1 bg-[#1a1a1a]/70 text-white text-[10px] font-serif tracking-wider uppercase">
              {t("outOfStock")}
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors z-10"
        >
          <svg
            className={`w-4 h-4 ${isInWishlist ? "text-[#c9a96e] fill-[#c9a96e]" : "text-[#1a1a1a]/40"}`}
            fill={isInWishlist ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Add to Cart on Hover */}
        {product.stock > 0 && (
          <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <button
              onClick={handleAddToCart}
              className="w-full py-3 bg-[#1a1a1a]/90 backdrop-blur-sm text-[#c9a96e] text-xs font-serif tracking-widest uppercase hover:bg-[#1a1a1a] transition-colors"
            >
              {t("addToCart")}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {product.category && (
          <p className="text-[10px] text-[#1a1a1a]/40 font-serif italic mb-1.5 tracking-wide">
            {product.category.name}
          </p>
        )}
        <h3 className="text-sm font-serif text-[#1a1a1a] line-clamp-2 mb-2 min-h-[2.5rem] group-hover:text-[#c9a96e] transition-colors duration-300">
          {product.name}
        </h3>
        {product.avgRating && product.avgRating > 0 && product.reviewCount && product.reviewCount > 0 ? (
          <div className="flex items-center gap-1 mb-2">
            <svg className="w-3 h-3 text-[#c9a96e]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-[10px] text-[#1a1a1a]/40 font-serif">
              {product.avgRating.toFixed(1)} ({product.reviewCount})
            </span>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <span className="text-base font-serif text-[#c9a96e]">
            {priceFormatter.format(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-[#1a1a1a]/30 line-through font-serif">
              {priceFormatter.format(product.comparePrice!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
