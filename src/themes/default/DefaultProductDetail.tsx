"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { SHIMMER_PLACEHOLDER } from "@/lib/image-utils";
import ProductCard from "@/components/storefront/ProductCard";
import {
  useProductDetailLogic,
  type ProductDetailProps,
} from "@/themes/hooks/useProductDetailLogic";

export default function DefaultProductDetail(props: ProductDetailProps) {
  const t = useTranslations("product");
  const h = useProductDetailLogic(props);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div>
          <div className="relative aspect-square bg-muted rounded-xl overflow-hidden mb-3">
            {h.product.images[h.selectedImage] ? (
              <Image
                src={h.product.images[h.selectedImage].url}
                alt={h.product.images[h.selectedImage].alt || h.product.name}
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
          {h.product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {h.product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => h.setSelectedImage(idx)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                    idx === h.selectedImage ? "border-primary" : "border-transparent hover:border-border"
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
          {h.product.brand && (
            <p className="text-sm text-primary font-medium mb-1">{h.product.brand.name}</p>
          )}
          <h1 className="text-2xl md:text-3xl font-bold mb-3">{h.product.name}</h1>

          {h.product.reviewCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(h.product.avgRating) ? "text-warning" : "text-border"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {h.product.avgRating.toFixed(1)} ({t("reviewCount", { count: h.product.reviewCount })})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold text-primary">{h.formatPrice(h.currentPrice)}</span>
            {h.hasDiscount && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {h.formatPrice(h.product.comparePrice!)}
                </span>
                <span className="px-2 py-0.5 bg-danger text-white text-sm font-bold rounded">
                  %{h.discountPercent}
                </span>
              </>
            )}
          </div>

          {h.product.shortDesc && (
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{h.product.shortDesc}</p>
          )}

          {/* Variant Options */}
          {h.product.hasVariants && h.product.variantTypes.length > 0 && (
            <div className="space-y-4 mb-6">
              {h.product.variantTypes.map((type) => (
                <div key={type.id}>
                  <label className="text-sm font-medium mb-2 block">
                    {type.name}: <span className="text-primary">{h.selectedOptions[type.name] || t("selectOption")}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {type.options.map((opt) => {
                      const available = h.isOptionAvailable(type.name, opt.value);
                      const selected = h.selectedOptions[type.name] === opt.value;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => h.handleOptionSelect(type.name, opt.value)}
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
            {h.currentStock > 0 ? (
              <span className="text-sm text-success font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t("inStockCount", { count: h.currentStock })}
              </span>
            ) : (
              <span className="text-sm text-danger font-medium">{t("outOfStock")}</span>
            )}
          </div>

          {/* Gift Products */}
          {h.giftProducts && h.giftProducts.length > 0 && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-3 mb-4">
              <p className="text-sm font-semibold text-success mb-1">Bu urunu aldiginizda hediye:</p>
              {h.giftProducts.map((gift) => (
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
              <button onClick={h.decreaseQuantity} className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground">-</button>
              <input
                type="number"
                value={h.quantity}
                onChange={(e) => h.setValidQuantity(parseInt(e.target.value) || h.product.minQty)}
                className="w-14 text-center text-sm font-medium border-x border-border h-10 focus:outline-none"
              />
              <button onClick={h.increaseQuantity} className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground">+</button>
            </div>
            <button
              onClick={h.handleAddToCart}
              disabled={!h.canAddToCart}
              className={`flex-1 rounded-lg text-sm font-semibold transition-colors ${
                h.ctaExperiment.config?.buttonSize === "large" ? "py-4 text-base" : "py-3"
              } ${
                h.canAddToCart
                  ? `${(h.ctaExperiment.config?.buttonColor as string) || "bg-primary"} text-white hover:opacity-90`
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {!h.canAddToCart
                ? h.product.hasVariants && !h.selectedVariant
                  ? t("selectVariant")
                  : t("outOfStock")
                : h.ctaExperiment.config?.urgencyText && h.currentStock <= 10
                  ? `${t("addToCart")} — Stokta ${h.currentStock} Adet!`
                  : (h.ctaExperiment.config?.buttonText as string) || t("addToCart")}
            </button>
          </div>

          {h.addedToast && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-success text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in">
              &#10003; Urun sepete eklendi!
            </div>
          )}

          {/* Stock Notification */}
          {h.currentStock === 0 && (
            <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
              {h.stockNotifDone ? (
                <div className="flex items-center gap-2 text-sm text-success">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Stok geldiginde size haber verecegiz!</span>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground mb-2">Stok geldiginde haber verelim mi?</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={h.stockNotifEmail}
                      onChange={(e) => h.setStockNotifEmail(e.target.value)}
                      placeholder="E-posta adresiniz"
                      className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <button
                      onClick={h.handleStockNotify}
                      disabled={h.stockNotifLoading}
                      className="px-4 py-2 bg-warning text-white text-sm font-medium rounded-lg hover:bg-warning/90 transition-colors disabled:opacity-50"
                    >
                      {h.stockNotifLoading ? "..." : "Haber Ver"}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Giris yapmissaniz e-posta alani bos birakilabilir.</p>
                </>
              )}
            </div>
          )}

          {/* Meta Info */}
          <div className="border-t border-border pt-4 space-y-2 text-sm text-muted-foreground">
            {h.product.sku && <p><span className="font-medium text-foreground">SKU:</span> {h.product.sku}</p>}
            {h.product.category && <p><span className="font-medium text-foreground">Kategori:</span> {h.product.category.name}</p>}
            {h.product.tags.length > 0 && (
              <p><span className="font-medium text-foreground">Etiketler:</span> {h.product.tags.map((tag) => tag.tag).join(", ")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="flex border-b border-border overflow-x-auto scrollbar-hide">
          {(["desc", "reviews", "qa"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => h.handleTabChange(tab)}
              className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                h.activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "desc" ? t("description") : tab === "reviews" ? `${t("reviews")} (${h.product.reviewCount})` : t("questions")}
            </button>
          ))}
        </div>

        <div className="py-6">
          {h.activeTab === "desc" && (
            <div className="prose prose-sm max-w-none">
              {h.product.description ? (
                <div dangerouslySetInnerHTML={{ __html: h.product.description }} />
              ) : (
                <p className="text-muted-foreground">Urun aciklamasi bulunmuyor.</p>
              )}
            </div>
          )}

          {h.activeTab === "reviews" && (
            <div className="space-y-6">
              {h.product.reviews.length > 0 ? (
                h.product.reviews.map((review) => (
                  <div key={review.id} className="border-b border-border pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{review.user.name}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? "text-warning" : "text-border"}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString("tr-TR")}</span>
                    </div>
                    {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">{t("noReviews")}</p>
              )}

              {h.canReview && !h.reviewSubmitted && (
                <div className="mt-8 border-t border-border pt-6">
                  <h3 className="text-lg font-semibold mb-4">{t("writeReview")}</h3>
                  <form onSubmit={h.handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Puaniniz</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" onClick={() => h.setReviewRating(star)} className="focus:outline-none">
                            <svg className={`w-7 h-7 transition-colors ${star <= h.reviewRating ? "text-warning" : "text-border hover:text-warning/50"}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Yorumunuz</label>
                      <textarea
                        value={h.reviewComment}
                        onChange={(e) => h.setReviewComment(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Urun hakkindaki dusuncelerinizi yazin..."
                      />
                    </div>
                    <button type="submit" disabled={h.reviewSubmitting} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm">
                      {h.reviewSubmitting ? "Gonderiliyor..." : "Degerlendirmeyi Gonder"}
                    </button>
                  </form>
                </div>
              )}
              {h.reviewSubmitted && (
                <div className="mt-8 border-t border-border pt-6">
                  <div className="bg-success/10 text-success rounded-lg p-4 text-sm">Degerlendirmeniz basariyla gonderildi. Moderasyon sonrasi yayinlanacaktir.</div>
                </div>
              )}
            </div>
          )}

          {h.activeTab === "qa" && (
            <div className="space-y-6">
              {!h.questionsLoaded ? (
                <p className="text-center text-muted-foreground py-8">Yukleniyor...</p>
              ) : h.questions.length > 0 ? (
                h.questions.map((q: any) => (
                  <div key={q.id} className="border-b border-border pb-4 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-primary font-bold text-sm">S</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{q.question}</p>
                        <p className="text-xs text-muted-foreground mt-1">{q.user?.name || "Anonim"} - {new Date(q.createdAt).toLocaleDateString("tr-TR")}</p>
                      </div>
                    </div>
                    {q.answer && (
                      <div className="flex items-start gap-3 mt-3 ml-11">
                        <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-success font-bold text-sm">C</span>
                        </div>
                        <div>
                          <p className="text-sm">{q.answer}</p>
                          <p className="text-xs text-muted-foreground mt-1">{q.answeredBy?.name || "Magaza"} - {q.answeredAt ? new Date(q.answeredAt).toLocaleDateString("tr-TR") : ""}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Bu urun icin henuz soru sorulmamis.</p>
              )}
              {h.questionSubmitted ? (
                <div className="bg-success/10 text-success rounded-lg p-4 text-sm">Sorunuz basariyla gonderildi. Onaylandiktan sonra burada yayinlanacaktir.</div>
              ) : (
                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold mb-3">Soru Sor</h3>
                  <p className="text-xs text-muted-foreground mb-3">Soru sormak icin giris yapmaniz gerekmektedir. En az 10 karakter yaziniz.</p>
                  <textarea
                    value={h.questionText}
                    onChange={(e) => h.setQuestionText(e.target.value)}
                    rows={3}
                    placeholder="Bu urun hakkinda sorunuzu yazin..."
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                  <button
                    onClick={h.handleQuestionSubmit}
                    disabled={h.questionSubmitting || h.questionText.trim().length < 10}
                    className="mt-2 px-6 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {h.questionSubmitting ? "Gonderiliyor..." : "Soruyu Gonder"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bought Together */}
      {h.combinedBoughtTogether.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">Birlikte Sik Alinan Urunler</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {h.combinedBoughtTogether.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Similar Products */}
      {h.similarProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">Benzer Urunler</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {h.similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {h.recentlyViewed.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">Son Goruntulediginiz Urunler</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {h.recentlyViewed.slice(0, 6).map((item) => (
              <a
                key={item.id}
                href={`/urun/${item.slug}`}
                className="group block rounded-xl border border-border hover:border-primary hover:shadow-md transition-all overflow-hidden"
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 50vw, 16vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  {item.category && <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-0.5">{item.category}</p>}
                  <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">{item.name}</p>
                  <p className="text-sm font-bold text-primary mt-1">{h.formatPrice(item.price)}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
