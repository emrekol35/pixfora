"use client";

import { useState } from "react";
import { useCartStore, CartVariant } from "@/store/cart";
import ProductCard from "./ProductCard";

interface VariantType {
  id: string;
  name: string;
  options: { id: string; value: string }[];
}

interface Variant {
  id: string;
  sku: string | null;
  price: number | null;
  stock: number;
  isActive: boolean;
  options: Record<string, string>;
}

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  order: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string };
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDesc: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  sku: string | null;
  minQty: number;
  maxQty: number | null;
  hasVariants: boolean;
  images: ProductImage[];
  category: { name: string; slug: string } | null;
  brand: { name: string; slug: string } | null;
  variantTypes: VariantType[];
  variants: Variant[];
  tags: { id: string; tag: string }[];
  reviews: Review[];
  reviewCount: number;
  avgRating: number;
}

interface RelatedProduct {
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
}

interface Props {
  product: ProductData;
  relatedProducts: RelatedProduct[];
}

export default function ProductDetail({ product, relatedProducts }: Props) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(product.minQty);
  const [activeTab, setActiveTab] = useState<"desc" | "reviews">("desc");
  const addItem = useCartStore((s) => s.addItem);

  // Secili varyanti bul
  const selectedVariant = product.hasVariants
    ? product.variants.find((v) => {
        return Object.entries(selectedOptions).every(
          ([key, value]) => v.options[key] === value
        );
      })
    : null;

  const currentPrice = selectedVariant?.price || product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const hasDiscount = product.comparePrice && product.comparePrice > currentPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.comparePrice! - currentPrice) / product.comparePrice!) * 100)
    : 0;

  const canAddToCart =
    currentStock > 0 &&
    (!product.hasVariants || (product.hasVariants && selectedVariant));

  const handleAddToCart = () => {
    if (!canAddToCart) return;

    let cartVariant: CartVariant | null = null;
    if (selectedVariant) {
      cartVariant = {
        id: selectedVariant.id,
        sku: selectedVariant.sku,
        price: selectedVariant.price,
        stock: selectedVariant.stock,
        options: selectedVariant.options,
      };
    }

    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        comparePrice: product.comparePrice,
        image: product.images[0]?.url || null,
        stock: product.stock,
        minQty: product.minQty,
        maxQty: product.maxQty,
      },
      quantity,
      cartVariant
    );
  };

  const handleOptionSelect = (typeName: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [typeName]: value }));
  };

  // Seceneklerin musaitlik durumunu kontrol et
  const isOptionAvailable = (typeName: string, value: string) => {
    const testOptions = { ...selectedOptions, [typeName]: value };
    return product.variants.some(
      (v) =>
        v.isActive &&
        v.stock > 0 &&
        Object.entries(testOptions).every(
          ([k, val]) => !testOptions[k] || v.options[k] === val
        )
    );
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div>
          {/* Main Image */}
          <div className="aspect-square bg-muted rounded-xl overflow-hidden mb-3">
            {product.images[selectedImage] ? (
              <img
                src={product.images[selectedImage].url}
                alt={product.images[selectedImage].alt || product.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                    idx === selectedImage ? "border-primary" : "border-transparent hover:border-border"
                  }`}
                >
                  <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {/* Brand */}
          {product.brand && (
            <p className="text-sm text-primary font-medium mb-1">{product.brand.name}</p>
          )}

          <h1 className="text-2xl md:text-3xl font-bold mb-3">{product.name}</h1>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(product.avgRating) ? "text-warning" : "text-border"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.avgRating.toFixed(1)} ({product.reviewCount} degerlendirme)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold text-primary">{formatPrice(currentPrice)}</span>
            {hasDiscount && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.comparePrice!)}
                </span>
                <span className="px-2 py-0.5 bg-danger text-white text-sm font-bold rounded">
                  %{discountPercent}
                </span>
              </>
            )}
          </div>

          {/* Short Description */}
          {product.shortDesc && (
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {product.shortDesc}
            </p>
          )}

          {/* Variant Options */}
          {product.hasVariants && product.variantTypes.length > 0 && (
            <div className="space-y-4 mb-6">
              {product.variantTypes.map((type) => (
                <div key={type.id}>
                  <label className="text-sm font-medium mb-2 block">
                    {type.name}:{" "}
                    <span className="text-primary">{selectedOptions[type.name] || "Seciniz"}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {type.options.map((opt) => {
                      const available = isOptionAvailable(type.name, opt.value);
                      const selected = selectedOptions[type.name] === opt.value;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleOptionSelect(type.name, opt.value)}
                          disabled={!available}
                          className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                            selected
                              ? "border-primary bg-primary text-white"
                              : available
                              ? "border-border hover:border-primary"
                              : "border-border text-muted-foreground/40 line-through cursor-not-allowed"
                          }`}
                        >
                          {opt.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stock Status */}
          <div className="mb-4">
            {currentStock > 0 ? (
              <span className="text-sm text-success font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Stokta ({currentStock} adet)
              </span>
            ) : (
              <span className="text-sm text-danger font-medium">Stokta yok</span>
            )}
          </div>

          {/* Quantity & Add to Cart */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center border border-border rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(product.minQty, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || product.minQty;
                  const maxQty = product.maxQty || currentStock;
                  setQuantity(Math.max(product.minQty, Math.min(val, maxQty)));
                }}
                className="w-14 text-center text-sm font-medium border-x border-border h-10 focus:outline-none"
              />
              <button
                onClick={() => {
                  const maxQty = product.maxQty || currentStock;
                  setQuantity(Math.min(maxQty, quantity + 1));
                }}
                className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-colors ${
                canAddToCart
                  ? "bg-primary text-white hover:bg-primary-dark"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {!canAddToCart
                ? product.hasVariants && !selectedVariant
                  ? "Secenek Seciniz"
                  : "Stokta Yok"
                : "Sepete Ekle"}
            </button>
          </div>

          {/* Meta Info */}
          <div className="border-t border-border pt-4 space-y-2 text-sm text-muted-foreground">
            {product.sku && (
              <p>
                <span className="font-medium text-foreground">SKU:</span> {product.sku}
              </p>
            )}
            {product.category && (
              <p>
                <span className="font-medium text-foreground">Kategori:</span> {product.category.name}
              </p>
            )}
            {product.tags.length > 0 && (
              <p>
                <span className="font-medium text-foreground">Etiketler:</span>{" "}
                {product.tags.map((t) => t.tag).join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs: Description & Reviews */}
      <div className="mt-12">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("desc")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "desc"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Urun Aciklamasi
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "reviews"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Degerlendirmeler ({product.reviewCount})
          </button>
        </div>

        <div className="py-6">
          {activeTab === "desc" ? (
            <div className="prose prose-sm max-w-none">
              {product.description ? (
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              ) : (
                <p className="text-muted-foreground">Urun aciklamasi bulunmuyor.</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {product.reviews.length > 0 ? (
                product.reviews.map((review) => (
                  <div key={review.id} className="border-b border-border pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{review.user.name}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-3.5 h-3.5 ${star <= review.rating ? "text-warning" : "text-border"}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Henuz degerlendirme yapilmamis.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">Benzer Urunler</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
