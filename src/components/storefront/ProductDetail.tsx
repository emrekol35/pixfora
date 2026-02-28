"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCartStore, CartVariant } from "@/store/cart";
import { SHIMMER_PLACEHOLDER } from "@/lib/image-utils";
import { useRecentlyViewedStore } from "@/store/recently-viewed";
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

interface GiftProduct {
  id: string;
  giftName: string;
  giftImage: string | null;
  minOrderQty: number;
}

interface Props {
  product: ProductData;
  similarProducts: RelatedProduct[];
  boughtTogether?: RelatedProduct[];
  complementaryProducts?: RelatedProduct[];
  giftProducts?: GiftProduct[];
  canReview?: boolean;
}

export default function ProductDetail({ product, similarProducts, boughtTogether, complementaryProducts, giftProducts, canReview }: Props) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(product.minQty);
  const [activeTab, setActiveTab] = useState<"desc" | "reviews" | "qa">("desc");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [stockNotifEmail, setStockNotifEmail] = useState("");
  const [stockNotifLoading, setStockNotifLoading] = useState(false);
  const [stockNotifDone, setStockNotifDone] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [questionSubmitted, setQuestionSubmitted] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addItem);
  const recentlyViewedItems = useRecentlyViewedStore((s) => s.items);

  // Son goruntulenen urunlere kaydet
  useEffect(() => {
    addRecentlyViewed({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      comparePrice: product.comparePrice,
      image: product.images[0]?.url || null,
      category: product.category?.name || null,
    });
  }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Sorulari yukle
  useEffect(() => {
    if (activeTab === "qa" && !questionsLoaded) {
      fetch(`/api/products/${product.id}/questions`)
        .then((r) => r.json())
        .then((data) => {
          setQuestions(Array.isArray(data) ? data : []);
          setQuestionsLoaded(true);
        })
        .catch(() => setQuestionsLoaded(true));
    }
  }, [activeTab, questionsLoaded, product.id]);

  const handleQuestionSubmit = async () => {
    if (!questionText.trim() || questionText.trim().length < 10) return;
    setQuestionSubmitting(true);
    try {
      const res = await fetch(`/api/products/${product.id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionText.trim() }),
      });
      if (res.ok) {
        setQuestionSubmitted(true);
        setQuestionText("");
      } else {
        const data = await res.json();
        alert(data.error || "Soru gonderilemedi");
      }
    } catch {
      alert("Bir hata olustu");
    } finally {
      setQuestionSubmitting(false);
    }
  };

  const handleStockNotify = async () => {
    setStockNotifLoading(true);
    try {
      const res = await fetch("/api/stock-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant?.id || null,
          email: stockNotifEmail || undefined,
        }),
      });
      if (res.ok) {
        setStockNotifDone(true);
      }
    } catch {
      // ignore
    } finally {
      setStockNotifLoading(false);
    }
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
          <div className="relative aspect-square bg-muted rounded-xl overflow-hidden mb-3">
            {product.images[selectedImage] ? (
              <Image
                src={product.images[selectedImage].url}
                alt={product.images[selectedImage].alt || product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
                placeholder="blur"
                blurDataURL={SHIMMER_PLACEHOLDER}
                priority
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
                  className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                    idx === selectedImage ? "border-primary" : "border-transparent hover:border-border"
                  }`}
                >
                  <Image src={img.url} alt={img.alt || ""} fill sizes="64px" className="object-cover" />
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

          {/* Gift Products Badge */}
          {giftProducts && giftProducts.length > 0 && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-3 mb-4">
              <p className="text-sm font-semibold text-success mb-1">
                Bu urunu aldiginizda hediye:
              </p>
              {giftProducts.map((gift) => (
                <div key={gift.id} className="flex items-center gap-2 mt-1">
                  {gift.giftImage && (
                    <Image src={gift.giftImage} alt={gift.giftName} width={32} height={32} className="rounded object-cover" />
                  )}
                  <span className="text-sm">{gift.giftName}</span>
                  {gift.minOrderQty > 1 && (
                    <span className="text-xs text-muted-foreground">(min. {gift.minOrderQty} adet)</span>
                  )}
                </div>
              ))}
            </div>
          )}

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

          {/* Stok Bildirimi */}
          {currentStock === 0 && (
            <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
              {stockNotifDone ? (
                <div className="flex items-center gap-2 text-sm text-success">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Stok geldiginde size haber verecegiz!</span>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground mb-2">
                    Stok geldiginde haber verelim mi?
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={stockNotifEmail}
                      onChange={(e) => setStockNotifEmail(e.target.value)}
                      placeholder="E-posta adresiniz"
                      className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <button
                      onClick={handleStockNotify}
                      disabled={stockNotifLoading}
                      className="px-4 py-2 bg-warning text-white text-sm font-medium rounded-lg hover:bg-warning/90 transition-colors disabled:opacity-50"
                    >
                      {stockNotifLoading ? "..." : "Haber Ver"}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Giris yapmissaniz e-posta alani bos birakilabilir.
                  </p>
                </>
              )}
            </div>
          )}

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
        <div className="flex border-b border-border overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("desc")}
            className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "desc"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Urun Aciklamasi
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "reviews"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Degerlendirmeler ({product.reviewCount})
          </button>
          <button
            onClick={() => setActiveTab("qa")}
            className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "qa"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Soru & Cevap
          </button>
        </div>

        <div className="py-6">
          {activeTab === "desc" && (
            <div className="prose prose-sm max-w-none">
              {product.description ? (
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              ) : (
                <p className="text-muted-foreground">Urun aciklamasi bulunmuyor.</p>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
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

              {/* Review Form */}
              {canReview && !reviewSubmitted && (
                <div className="mt-8 border-t border-border pt-6">
                  <h3 className="text-lg font-semibold mb-4">Degerlendirme Yap</h3>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setReviewSubmitting(true);
                      try {
                        const res = await fetch("/api/reviews", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            productId: product.id,
                            rating: reviewRating,
                            comment: reviewComment,
                          }),
                        });
                        if (res.ok) {
                          setReviewSubmitted(true);
                        } else {
                          const data = await res.json();
                          alert(data.error || "Yorum gonderilemedi.");
                        }
                      } catch {
                        alert("Bir hata olustu.");
                      } finally {
                        setReviewSubmitting(false);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-2">Puaniniz</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="focus:outline-none"
                          >
                            <svg
                              className={`w-7 h-7 transition-colors ${
                                star <= reviewRating ? "text-warning" : "text-border hover:text-warning/50"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Yorumunuz</label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Urun hakkindaki dusuncelerinizi yazin..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm"
                    >
                      {reviewSubmitting ? "Gonderiliyor..." : "Degerlendirmeyi Gonder"}
                    </button>
                  </form>
                </div>
              )}
              {reviewSubmitted && (
                <div className="mt-8 border-t border-border pt-6">
                  <div className="bg-success/10 text-success rounded-lg p-4 text-sm">
                    Degerlendirmeniz basariyla gonderildi. Moderasyon sonrasi yayinlanacaktir.
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "qa" && (
            <div className="space-y-6">
              {/* Soru Listesi */}
              {!questionsLoaded ? (
                <p className="text-center text-muted-foreground py-8">Yukleniyor...</p>
              ) : questions.length > 0 ? (
                questions.map((q) => (
                  <div key={q.id} className="border-b border-border pb-4 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-primary font-bold text-sm">S</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{q.question}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {q.user?.name || "Anonim"} - {new Date(q.createdAt).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                    </div>
                    {q.answer && (
                      <div className="flex items-start gap-3 mt-3 ml-11">
                        <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-success font-bold text-sm">C</span>
                        </div>
                        <div>
                          <p className="text-sm">{q.answer}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {q.answeredBy?.name || "Magaza"} - {q.answeredAt ? new Date(q.answeredAt).toLocaleDateString("tr-TR") : ""}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Bu urun icin henuz soru sorulmamis.
                </p>
              )}

              {/* Soru Formu */}
              {questionSubmitted ? (
                <div className="bg-success/10 text-success rounded-lg p-4 text-sm">
                  Sorunuz basariyla gonderildi. Onaylandiktan sonra burada yayinlanacaktir.
                </div>
              ) : (
                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold mb-3">Soru Sor</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Soru sormak icin giris yapmaniz gerekmektedir. En az 10 karakter yaziniz.
                  </p>
                  <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    rows={3}
                    placeholder="Bu urun hakkinda sorunuzu yazin..."
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                  <button
                    onClick={handleQuestionSubmit}
                    disabled={questionSubmitting || questionText.trim().length < 10}
                    className="mt-2 px-6 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {questionSubmitting ? "Gonderiliyor..." : "Soruyu Gonder"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Birlikte Sik Alinan Urunler (admin complementary + veri-tabanli bought-together) */}
      {(() => {
        // Admin'in elle girdigi + veri-tabanli onerileri birlestir, tekrarlari cikar
        const allBought = [
          ...(complementaryProducts || []),
          ...(boughtTogether || []),
        ];
        const uniqueIds = new Set<string>();
        const uniqueBought = allBought.filter((p) => {
          if (uniqueIds.has(p.id) || p.id === product.id) return false;
          uniqueIds.add(p.id);
          return true;
        });
        if (uniqueBought.length === 0) return null;
        return (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-6">Birlikte Sik Alinan Urunler</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {uniqueBought.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        );
      })()}

      {/* Benzer Urunler (gelismis oneri sistemi) */}
      {similarProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">Benzer Urunler</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Son Goruntulenen Urunler */}
      {recentlyViewedItems.filter((i) => i.id !== product.id).length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">Son Goruntulediginiz Urunler</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentlyViewedItems
              .filter((i) => i.id !== product.id)
              .slice(0, 6)
              .map((item) => (
                <a
                  key={item.id}
                  href={`/urun/${item.slug}`}
                  className="group block rounded-xl border border-border hover:border-primary hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 16vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    {item.category && (
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-0.5">{item.category}</p>
                    )}
                    <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">{item.name}</p>
                    <p className="text-sm font-bold text-primary mt-1">
                      {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(item.price)}
                    </p>
                  </div>
                </a>
              ))}
          </div>
        </div>
      )}
    </>
  );
}
