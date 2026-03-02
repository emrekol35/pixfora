"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { SHIMMER_PLACEHOLDER } from "@/lib/image-utils";
import ProductCard from "@/components/storefront/ProductCard";
import {
  useProductDetailLogic,
  type ProductDetailProps,
} from "@/themes/hooks/useProductDetailLogic";

export default function MinimalProductDetail(props: ProductDetailProps) {
  const t = useTranslations("product");
  const h = useProductDetailLogic(props);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Images */}
        <div>
          <div className="relative aspect-[3/4] bg-[#fafafa] overflow-hidden">
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
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" strokeWidth={0.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          {h.product.images.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
              {h.product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => h.setSelectedImage(idx)}
                  className={`relative w-20 h-20 overflow-hidden shrink-0 transition-all ${
                    idx === h.selectedImage
                      ? "ring-1 ring-[#c9a96e] ring-offset-2"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={img.url} alt={img.alt || ""} fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center">
          {h.product.brand && (
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#c9a96e] mb-3">
              {h.product.brand.name}
            </p>
          )}
          <h1 className="font-heading text-2xl md:text-3xl lg:text-4xl font-light tracking-wide text-[#1a1a1a] mb-4">
            {h.product.name}
          </h1>

          {h.product.reviewCount > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-3.5 h-3.5 ${star <= Math.round(h.product.avgRating) ? "text-[#c9a96e]" : "text-[#e5e5e5]"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs tracking-wide text-muted-foreground">
                {h.product.avgRating.toFixed(1)} ({t("reviewCount", { count: h.product.reviewCount })})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-4 mb-8">
            <span className="text-2xl font-light tracking-wide text-[#1a1a1a]">
              {h.formatPrice(h.currentPrice)}
            </span>
            {h.hasDiscount && (
              <>
                <span className="text-sm text-muted-foreground/60 line-through">
                  {h.formatPrice(h.product.comparePrice!)}
                </span>
                <span className="text-xs tracking-[0.1em] uppercase text-[#c9a96e] font-medium">
                  %{h.discountPercent} {t("off") || "indirim"}
                </span>
              </>
            )}
          </div>

          <div className="w-12 h-px bg-[#c9a96e] mb-8" />

          {h.product.shortDesc && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-md">
              {h.product.shortDesc}
            </p>
          )}

          {/* Variant Options */}
          {h.product.hasVariants && h.product.variantTypes.length > 0 && (
            <div className="space-y-6 mb-8">
              {h.product.variantTypes.map((type) => (
                <div key={type.id}>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3 block">
                    {type.name}: <span className="text-[#1a1a1a]">{h.selectedOptions[type.name] || t("selectOption")}</span>
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
                          className={`px-5 py-2.5 border text-xs tracking-[0.1em] uppercase transition-all ${
                            selected
                              ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                              : available
                              ? "border-[#e5e5e5] hover:border-[#1a1a1a] text-[#1a1a1a]"
                              : "border-[#e5e5e5] text-muted-foreground/30 line-through cursor-not-allowed"
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
          <div className="mb-6">
            {h.currentStock > 0 ? (
              <span className="text-xs tracking-[0.1em] uppercase text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                {t("inStockCount", { count: h.currentStock })}
              </span>
            ) : (
              <span className="text-xs tracking-[0.1em] uppercase text-red-700">
                {t("outOfStock")}
              </span>
            )}
          </div>

          {/* Gift Products */}
          {h.giftProducts && h.giftProducts.length > 0 && (
            <div className="border border-[#c9a96e]/30 p-4 mb-6">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#c9a96e] mb-2 font-medium">
                Bu urunu aldiginizda hediye:
              </p>
              {h.giftProducts.map((gift) => (
                <div key={gift.id} className="flex items-center gap-3 mt-2">
                  {gift.giftImage && (
                    <Image src={gift.giftImage} alt={gift.giftName} width={36} height={36} className="object-cover" />
                  )}
                  <span className="text-sm text-[#1a1a1a]">{gift.giftName}</span>
                  {gift.minOrderQty > 1 && (
                    <span className="text-xs text-muted-foreground">(min. {gift.minOrderQty} adet)</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center border border-[#e5e5e5]">
              <button
                onClick={h.decreaseQuantity}
                className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-[#1a1a1a] transition-colors"
              >
                -
              </button>
              <input
                type="number"
                value={h.quantity}
                onChange={(e) => h.setValidQuantity(parseInt(e.target.value) || h.product.minQty)}
                className="w-14 text-center text-sm tracking-wide border-x border-[#e5e5e5] h-11 focus:outline-none bg-transparent"
              />
              <button
                onClick={h.increaseQuantity}
                className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-[#1a1a1a] transition-colors"
              >
                +
              </button>
            </div>
            <button
              onClick={h.handleAddToCart}
              disabled={!h.canAddToCart}
              className={`flex-1 text-[11px] tracking-[0.2em] uppercase font-medium transition-all ${
                h.ctaExperiment.config?.buttonSize === "large" ? "py-4 text-xs" : "py-3.5"
              } ${
                h.canAddToCart
                  ? `${(h.ctaExperiment.config?.buttonColor as string) || "bg-[#1a1a1a]"} text-white hover:bg-[#333]`
                  : "bg-[#e5e5e5] text-muted-foreground cursor-not-allowed"
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
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-[#1a1a1a] text-white px-6 py-3 text-xs tracking-[0.15em] uppercase shadow-lg animate-fade-in">
              &#10003; Urun sepete eklendi!
            </div>
          )}

          {/* Stock Notification */}
          {h.currentStock === 0 && (
            <div className="border border-[#e5e5e5] p-5">
              {h.stockNotifDone ? (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs tracking-wide">Stok geldiginde size haber verecegiz!</span>
                </div>
              ) : (
                <>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a] mb-3 font-medium">
                    Stok geldiginde haber verelim mi?
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={h.stockNotifEmail}
                      onChange={(e) => h.setStockNotifEmail(e.target.value)}
                      placeholder="E-posta adresiniz"
                      className="flex-1 px-4 py-2.5 border border-[#e5e5e5] text-sm focus:outline-none focus:border-[#c9a96e] transition-colors bg-transparent"
                    />
                    <button
                      onClick={h.handleStockNotify}
                      disabled={h.stockNotifLoading}
                      className="px-5 py-2.5 bg-[#c9a96e] text-white text-[10px] tracking-[0.15em] uppercase hover:bg-[#b89555] transition-colors disabled:opacity-50"
                    >
                      {h.stockNotifLoading ? "..." : "Haber Ver"}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 tracking-wide">
                    Giris yapmissaniz e-posta alani bos birakilabilir.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Meta Info */}
          <div className="border-t border-[#e5e5e5] pt-6 mt-8 space-y-2">
            {h.product.sku && (
              <p className="text-xs tracking-wide text-muted-foreground">
                <span className="text-[#1a1a1a]">SKU:</span> {h.product.sku}
              </p>
            )}
            {h.product.category && (
              <p className="text-xs tracking-wide text-muted-foreground">
                <span className="text-[#1a1a1a]">Kategori:</span> {h.product.category.name}
              </p>
            )}
            {h.product.tags.length > 0 && (
              <p className="text-xs tracking-wide text-muted-foreground">
                <span className="text-[#1a1a1a]">Etiketler:</span> {h.product.tags.map((tag) => tag.tag).join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-20">
        <div className="flex justify-center gap-12 border-b border-[#e5e5e5]">
          {(["desc", "reviews", "qa"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => h.handleTabChange(tab)}
              className={`pb-4 text-[11px] tracking-[0.2em] uppercase transition-all ${
                h.activeTab === tab
                  ? "border-b border-[#c9a96e] text-[#1a1a1a]"
                  : "text-muted-foreground hover:text-[#1a1a1a]"
              }`}
            >
              {tab === "desc" ? t("description") : tab === "reviews" ? `${t("reviews")} (${h.product.reviewCount})` : t("questions")}
            </button>
          ))}
        </div>

        <div className="py-10 max-w-3xl mx-auto">
          {h.activeTab === "desc" && (
            <div className="prose prose-sm max-w-none prose-headings:font-heading prose-headings:font-light prose-headings:tracking-wide">
              {h.product.description ? (
                <div dangerouslySetInnerHTML={{ __html: h.product.description }} />
              ) : (
                <p className="text-center text-muted-foreground text-sm">Urun aciklamasi bulunmuyor.</p>
              )}
            </div>
          )}

          {h.activeTab === "reviews" && (
            <div className="space-y-8">
              {h.product.reviews.length > 0 ? (
                h.product.reviews.map((review) => (
                  <div key={review.id} className="border-b border-[#e5e5e5] pb-6 last:border-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-[#1a1a1a]">{review.user.name}</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-3 h-3 ${star <= review.rating ? "text-[#c9a96e]" : "text-[#e5e5e5]"}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] tracking-wider text-muted-foreground uppercase">
                        {new Date(review.createdAt).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-12 text-sm">{t("noReviews")}</p>
              )}

              {h.canReview && !h.reviewSubmitted && (
                <div className="mt-10 border-t border-[#e5e5e5] pt-8">
                  <h3 className="font-heading text-xl font-light tracking-wide text-[#1a1a1a] mb-6">
                    {t("writeReview")}
                  </h3>
                  <form onSubmit={h.handleReviewSubmit} className="space-y-6">
                    <div>
                      <label className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
                        Puaniniz
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" onClick={() => h.setReviewRating(star)} className="focus:outline-none">
                            <svg
                              className={`w-6 h-6 transition-colors ${
                                star <= h.reviewRating ? "text-[#c9a96e]" : "text-[#e5e5e5] hover:text-[#c9a96e]/50"
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
                      <label className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
                        Yorumunuz
                      </label>
                      <textarea
                        value={h.reviewComment}
                        onChange={(e) => h.setReviewComment(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-[#e5e5e5] focus:outline-none focus:border-[#c9a96e] transition-colors text-sm bg-transparent resize-none"
                        placeholder="Urun hakkindaki dusuncelerinizi yazin..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={h.reviewSubmitting}
                      className="px-8 py-3 bg-[#1a1a1a] text-white text-[10px] tracking-[0.2em] uppercase hover:bg-[#333] transition-colors disabled:opacity-50"
                    >
                      {h.reviewSubmitting ? "Gonderiliyor..." : "Degerlendirmeyi Gonder"}
                    </button>
                  </form>
                </div>
              )}
              {h.reviewSubmitted && (
                <div className="mt-10 border-t border-[#e5e5e5] pt-8">
                  <div className="border border-green-200 text-green-700 p-4 text-sm tracking-wide">
                    Degerlendirmeniz basariyla gonderildi. Moderasyon sonrasi yayinlanacaktir.
                  </div>
                </div>
              )}
            </div>
          )}

          {h.activeTab === "qa" && (
            <div className="space-y-8">
              {!h.questionsLoaded ? (
                <p className="text-center text-muted-foreground py-12 text-sm">Yukleniyor...</p>
              ) : h.questions.length > 0 ? (
                h.questions.map((q: any) => (
                  <div key={q.id} className="border-b border-[#e5e5e5] pb-6 last:border-0">
                    <div className="flex items-start gap-4">
                      <span className="text-[10px] tracking-[0.15em] text-[#c9a96e] font-medium uppercase mt-0.5 shrink-0">
                        S
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-[#1a1a1a]">{q.question}</p>
                        <p className="text-[10px] tracking-wider text-muted-foreground mt-1.5 uppercase">
                          {q.user?.name || "Anonim"} &mdash; {new Date(q.createdAt).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                    </div>
                    {q.answer && (
                      <div className="flex items-start gap-4 mt-4 ml-6 pl-4 border-l border-[#e5e5e5]">
                        <span className="text-[10px] tracking-[0.15em] text-[#1a1a1a] font-medium uppercase mt-0.5 shrink-0">
                          C
                        </span>
                        <div>
                          <p className="text-sm text-muted-foreground">{q.answer}</p>
                          <p className="text-[10px] tracking-wider text-muted-foreground mt-1.5 uppercase">
                            {q.answeredBy?.name || "Magaza"} &mdash; {q.answeredAt ? new Date(q.answeredAt).toLocaleDateString("tr-TR") : ""}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-12 text-sm">
                  Bu urun icin henuz soru sorulmamis.
                </p>
              )}
              {h.questionSubmitted ? (
                <div className="border border-green-200 text-green-700 p-4 text-sm tracking-wide">
                  Sorunuz basariyla gonderildi. Onaylandiktan sonra burada yayinlanacaktir.
                </div>
              ) : (
                <div className="border-t border-[#e5e5e5] pt-8">
                  <h3 className="font-heading text-xl font-light tracking-wide text-[#1a1a1a] mb-4">
                    Soru Sor
                  </h3>
                  <p className="text-[10px] tracking-wider text-muted-foreground uppercase mb-4">
                    Soru sormak icin giris yapmaniz gerekmektedir. En az 10 karakter yaziniz.
                  </p>
                  <textarea
                    value={h.questionText}
                    onChange={(e) => h.setQuestionText(e.target.value)}
                    rows={3}
                    placeholder="Bu urun hakkinda sorunuzu yazin..."
                    className="w-full px-4 py-3 border border-[#e5e5e5] text-sm focus:outline-none focus:border-[#c9a96e] transition-colors bg-transparent resize-none"
                  />
                  <button
                    onClick={h.handleQuestionSubmit}
                    disabled={h.questionSubmitting || h.questionText.trim().length < 10}
                    className="mt-3 px-8 py-3 bg-[#1a1a1a] text-white text-[10px] tracking-[0.2em] uppercase hover:bg-[#333] transition-colors disabled:opacity-50"
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
        <div className="mt-20">
          <div className="text-center mb-10">
            <h2 className="font-heading text-xl font-light tracking-wide text-[#1a1a1a]">
              Birlikte Sik Alinan Urunler
            </h2>
            <div className="w-8 h-px bg-[#c9a96e] mx-auto mt-3" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {h.combinedBoughtTogether.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Similar Products */}
      {h.similarProducts.length > 0 && (
        <div className="mt-20">
          <div className="text-center mb-10">
            <h2 className="font-heading text-xl font-light tracking-wide text-[#1a1a1a]">
              Benzer Urunler
            </h2>
            <div className="w-8 h-px bg-[#c9a96e] mx-auto mt-3" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {h.similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {h.recentlyViewed.length > 0 && (
        <div className="mt-20">
          <div className="text-center mb-10">
            <h2 className="font-heading text-xl font-light tracking-wide text-[#1a1a1a]">
              Son Goruntulediginiz Urunler
            </h2>
            <div className="w-8 h-px bg-[#c9a96e] mx-auto mt-3" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {h.recentlyViewed.slice(0, 6).map((item) => (
              <a
                key={item.id}
                href={`/urun/${item.slug}`}
                className="group block border border-[#e5e5e5] hover:border-[#c9a96e] transition-colors overflow-hidden"
              >
                <div className="aspect-square bg-[#fafafa] relative overflow-hidden">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 16vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={0.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-3 text-center">
                  {item.category && (
                    <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                      {item.category}
                    </p>
                  )}
                  <p className="text-[11px] tracking-wide line-clamp-2 text-[#1a1a1a] group-hover:text-[#c9a96e] transition-colors">
                    {item.name}
                  </p>
                  <p className="text-xs tracking-wide text-muted-foreground mt-1.5">
                    {h.formatPrice(item.price)}
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
