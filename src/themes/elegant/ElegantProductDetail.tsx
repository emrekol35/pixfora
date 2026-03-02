"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { SHIMMER_PLACEHOLDER } from "@/lib/image-utils";
import ProductCard from "@/components/storefront/ProductCard";
import {
  useProductDetailLogic,
  type ProductDetailProps,
} from "@/themes/hooks/useProductDetailLogic";

export default function ElegantProductDetail(props: ProductDetailProps) {
  const t = useTranslations("product");
  const h = useProductDetailLogic(props);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* Images */}
        <div>
          <div className="relative aspect-square bg-[#fdfcfa] rounded-sm overflow-hidden border border-[#e8e0d0]">
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
              <div className="w-full h-full flex items-center justify-center text-[#c9a96e]/40">
                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          {h.product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mt-3">
              {h.product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => h.setSelectedImage(idx)}
                  className={`relative w-16 h-16 rounded-sm overflow-hidden shrink-0 border-2 transition-colors ${
                    idx === h.selectedImage ? "border-[#c9a96e]" : "border-transparent hover:border-[#e8e0d0]"
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
            <p className="text-xs uppercase tracking-wider text-[#c9a96e] font-medium mb-2">{h.product.brand.name}</p>
          )}
          <h1
            className="text-2xl md:text-3xl font-bold mb-3 text-[#1a1a1a]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {h.product.name}
          </h1>

          {/* Decorative gold separator */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#c9a96e]/30" />
            <div className="w-1.5 h-1.5 rotate-45 bg-[#c9a96e]" />
            <div className="flex-1 h-px bg-[#c9a96e]/30" />
          </div>

          {h.product.reviewCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(h.product.avgRating) ? "text-[#c9a96e]" : "text-[#e8e0d0]"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-[#1a1a1a]/60">
                {h.product.avgRating.toFixed(1)} ({t("reviewCount", { count: h.product.reviewCount })})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3 mb-6">
            <span
              className="text-3xl font-bold text-[#1a1a1a]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {h.formatPrice(h.currentPrice)}
            </span>
            {h.hasDiscount && (
              <>
                <span className="text-lg text-[#1a1a1a]/40 line-through">
                  {h.formatPrice(h.product.comparePrice!)}
                </span>
                <span className="px-2.5 py-0.5 bg-[#c9a96e] text-white text-xs font-semibold rounded-sm uppercase tracking-wider">
                  %{h.discountPercent}
                </span>
              </>
            )}
          </div>

          {h.product.shortDesc && (
            <p className="text-sm text-[#1a1a1a]/60 mb-6 leading-relaxed" style={{ fontFamily: "'Playfair Display', serif" }}>
              {h.product.shortDesc}
            </p>
          )}

          {/* Variant Options */}
          {h.product.hasVariants && h.product.variantTypes.length > 0 && (
            <div className="space-y-4 mb-6">
              {h.product.variantTypes.map((type) => (
                <div key={type.id}>
                  <label className="text-xs uppercase tracking-wider font-medium mb-2 block text-[#1a1a1a]/70">
                    {type.name}: <span className="text-[#c9a96e]">{h.selectedOptions[type.name] || t("selectOption")}</span>
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
                          className={`px-4 py-2 rounded-sm border text-sm transition-all ${
                            selected
                              ? "border-[#c9a96e] bg-[#c9a96e]/10 text-[#1a1a1a] font-medium"
                              : available
                              ? "border-[#e8e0d0] hover:border-[#c9a96e] text-[#1a1a1a]/80"
                              : "border-[#e8e0d0] text-[#1a1a1a]/25 line-through cursor-not-allowed"
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
              <span className="text-xs uppercase tracking-wider text-emerald-700 font-medium flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t("inStockCount", { count: h.currentStock })}
              </span>
            ) : (
              <span className="text-xs uppercase tracking-wider text-red-700 font-medium">{t("outOfStock")}</span>
            )}
          </div>

          {/* Gift Products */}
          {h.giftProducts && h.giftProducts.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-3 mb-4">
              <p className="text-sm font-semibold text-emerald-800 mb-1">Bu urunu aldiginizda hediye:</p>
              {h.giftProducts.map((gift) => (
                <div key={gift.id} className="flex items-center gap-2 mt-1">
                  {gift.giftImage && (
                    <Image src={gift.giftImage} alt={gift.giftName} width={32} height={32} className="rounded-sm object-cover" />
                  )}
                  <span className="text-sm text-[#1a1a1a]/80">{gift.giftName}</span>
                  {gift.minOrderQty > 1 && (
                    <span className="text-xs text-[#1a1a1a]/50">(min. {gift.minOrderQty} adet)</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center border border-[#e8e0d0] rounded-sm">
              <button onClick={h.decreaseQuantity} className="w-10 h-10 flex items-center justify-center text-[#1a1a1a]/50 hover:text-[#c9a96e] transition-colors">-</button>
              <input
                type="number"
                value={h.quantity}
                onChange={(e) => h.setValidQuantity(parseInt(e.target.value) || h.product.minQty)}
                className="w-14 text-center text-sm font-medium border-x border-[#e8e0d0] h-10 focus:outline-none bg-transparent"
              />
              <button onClick={h.increaseQuantity} className="w-10 h-10 flex items-center justify-center text-[#1a1a1a]/50 hover:text-[#c9a96e] transition-colors">+</button>
            </div>
            <button
              onClick={h.handleAddToCart}
              disabled={!h.canAddToCart}
              className={`flex-1 rounded-sm text-sm font-semibold uppercase tracking-wider transition-colors ${
                h.ctaExperiment.config?.buttonSize === "large" ? "py-4 text-base" : "py-3"
              } ${
                h.canAddToCart
                  ? "bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
                  : "bg-[#e8e0d0] text-[#1a1a1a]/40 cursor-not-allowed"
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
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-[#1a1a1a] text-white px-5 py-3 rounded-sm shadow-lg text-sm font-medium animate-fade-in">
              &#10003; Urun sepete eklendi!
            </div>
          )}

          {/* Stock Notification */}
          {h.currentStock === 0 && (
            <div className="bg-[#fdfcfa] border border-[#e8e0d0] rounded-sm p-4">
              {h.stockNotifDone ? (
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Stok geldiginde size haber verecegiz!</span>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-[#1a1a1a] mb-2">Stok geldiginde haber verelim mi?</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={h.stockNotifEmail}
                      onChange={(e) => h.setStockNotifEmail(e.target.value)}
                      placeholder="E-posta adresiniz"
                      className="flex-1 px-3 py-2 border border-[#e8e0d0] rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a96e] focus:border-[#c9a96e] bg-white"
                    />
                    <button
                      onClick={h.handleStockNotify}
                      disabled={h.stockNotifLoading}
                      className="px-4 py-2 bg-[#c9a96e] text-white text-sm font-medium rounded-sm hover:bg-[#b8964f] transition-colors disabled:opacity-50"
                    >
                      {h.stockNotifLoading ? "..." : "Haber Ver"}
                    </button>
                  </div>
                  <p className="text-xs text-[#1a1a1a]/50 mt-1">Giris yapmissaniz e-posta alani bos birakilabilir.</p>
                </>
              )}
            </div>
          )}

          {/* Meta Info */}
          <div className="border-t border-[#e8e0d0] pt-4 mt-4 space-y-2 text-sm text-[#1a1a1a]/60">
            {h.product.sku && (
              <p>
                <span className="uppercase tracking-wider text-xs font-medium text-[#1a1a1a]">SKU:</span>{" "}
                {h.product.sku}
              </p>
            )}
            {h.product.category && (
              <p>
                <span className="uppercase tracking-wider text-xs font-medium text-[#1a1a1a]">Kategori:</span>{" "}
                {h.product.category.name}
              </p>
            )}
            {h.product.tags.length > 0 && (
              <p>
                <span className="uppercase tracking-wider text-xs font-medium text-[#1a1a1a]">Etiketler:</span>{" "}
                {h.product.tags.map((tag) => tag.tag).join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-14">
        {/* Decorative separator */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-[#e8e0d0]" />
          <div className="w-2 h-2 rotate-45 border border-[#c9a96e]" />
          <div className="flex-1 h-px bg-[#e8e0d0]" />
        </div>

        <div className="flex border-b border-[#e8e0d0] overflow-x-auto scrollbar-hide">
          {(["desc", "reviews", "qa"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => h.handleTabChange(tab)}
              className={`px-5 sm:px-8 py-3 text-xs uppercase tracking-wider font-medium border-b-2 transition-colors whitespace-nowrap ${
                h.activeTab === tab
                  ? "border-[#c9a96e] text-[#c9a96e]"
                  : "border-transparent text-[#1a1a1a]/50 hover:text-[#1a1a1a]"
              }`}
            >
              {tab === "desc" ? t("description") : tab === "reviews" ? `${t("reviews")} (${h.product.reviewCount})` : t("questions")}
            </button>
          ))}
        </div>

        <div className="py-8">
          {h.activeTab === "desc" && (
            <div className="prose prose-sm max-w-none prose-headings:font-['Playfair_Display'] prose-headings:text-[#1a1a1a]">
              {h.product.description ? (
                <div dangerouslySetInnerHTML={{ __html: h.product.description }} />
              ) : (
                <p className="text-[#1a1a1a]/50 italic">Urun aciklamasi bulunmuyor.</p>
              )}
            </div>
          )}

          {h.activeTab === "reviews" && (
            <div className="space-y-6">
              {h.product.reviews.length > 0 ? (
                h.product.reviews.map((review) => (
                  <div key={review.id} className="border-b border-[#e8e0d0] pb-5 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm text-[#1a1a1a]">{review.user.name}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? "text-[#c9a96e]" : "text-[#e8e0d0]"}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-[#1a1a1a]/40">{new Date(review.createdAt).toLocaleDateString("tr-TR")}</span>
                    </div>
                    {review.comment && <p className="text-sm text-[#1a1a1a]/70 leading-relaxed">{review.comment}</p>}
                  </div>
                ))
              ) : (
                <p className="text-center text-[#1a1a1a]/50 py-10 italic">{t("noReviews")}</p>
              )}

              {h.canReview && !h.reviewSubmitted && (
                <div className="mt-8 border-t border-[#e8e0d0] pt-8">
                  <h3 className="text-lg font-semibold mb-4 text-[#1a1a1a]" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {t("writeReview")}
                  </h3>
                  <form onSubmit={h.handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-medium mb-2 text-[#1a1a1a]/70">Puaniniz</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" onClick={() => h.setReviewRating(star)} className="focus:outline-none">
                            <svg className={`w-7 h-7 transition-colors ${star <= h.reviewRating ? "text-[#c9a96e]" : "text-[#e8e0d0] hover:text-[#c9a96e]/50"}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-medium mb-1 text-[#1a1a1a]/70">Yorumunuz</label>
                      <textarea
                        value={h.reviewComment}
                        onChange={(e) => h.setReviewComment(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-[#e8e0d0] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#c9a96e] focus:border-[#c9a96e] bg-white"
                        placeholder="Urun hakkindaki dusuncelerinizi yazin..."
                      />
                    </div>
                    <button type="submit" disabled={h.reviewSubmitting} className="px-6 py-2.5 bg-[#1a1a1a] text-white rounded-sm hover:bg-[#1a1a1a]/90 transition-colors disabled:opacity-50 text-xs uppercase tracking-wider font-medium">
                      {h.reviewSubmitting ? "Gonderiliyor..." : "Degerlendirmeyi Gonder"}
                    </button>
                  </form>
                </div>
              )}
              {h.reviewSubmitted && (
                <div className="mt-8 border-t border-[#e8e0d0] pt-6">
                  <div className="bg-emerald-50 text-emerald-800 rounded-sm p-4 text-sm">Degerlendirmeniz basariyla gonderildi. Moderasyon sonrasi yayinlanacaktir.</div>
                </div>
              )}
            </div>
          )}

          {h.activeTab === "qa" && (
            <div className="space-y-6">
              {!h.questionsLoaded ? (
                <p className="text-center text-[#1a1a1a]/50 py-10 italic">Yukleniyor...</p>
              ) : h.questions.length > 0 ? (
                h.questions.map((q: any) => (
                  <div key={q.id} className="border-b border-[#e8e0d0] pb-5 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-[#c9a96e]/10 rounded-sm flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[#c9a96e] font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>S</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#1a1a1a]">{q.question}</p>
                        <p className="text-xs text-[#1a1a1a]/40 mt-1">{q.user?.name || "Anonim"} - {new Date(q.createdAt).toLocaleDateString("tr-TR")}</p>
                      </div>
                    </div>
                    {q.answer && (
                      <div className="flex items-start gap-3 mt-3 ml-11">
                        <div className="w-8 h-8 bg-emerald-50 rounded-sm flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-emerald-700 font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>C</span>
                        </div>
                        <div>
                          <p className="text-sm text-[#1a1a1a]/80">{q.answer}</p>
                          <p className="text-xs text-[#1a1a1a]/40 mt-1">{q.answeredBy?.name || "Magaza"} - {q.answeredAt ? new Date(q.answeredAt).toLocaleDateString("tr-TR") : ""}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-[#1a1a1a]/50 py-10 italic">Bu urun icin henuz soru sorulmamis.</p>
              )}
              {h.questionSubmitted ? (
                <div className="bg-emerald-50 text-emerald-800 rounded-sm p-4 text-sm">Sorunuz basariyla gonderildi. Onaylandiktan sonra burada yayinlanacaktir.</div>
              ) : (
                <div className="border-t border-[#e8e0d0] pt-8">
                  <h3 className="text-lg font-semibold mb-3 text-[#1a1a1a]" style={{ fontFamily: "'Playfair Display', serif" }}>Soru Sor</h3>
                  <p className="text-xs text-[#1a1a1a]/50 mb-3">Soru sormak icin giris yapmaniz gerekmektedir. En az 10 karakter yaziniz.</p>
                  <textarea
                    value={h.questionText}
                    onChange={(e) => h.setQuestionText(e.target.value)}
                    rows={3}
                    placeholder="Bu urun hakkinda sorunuzu yazin..."
                    className="w-full px-3 py-2 border border-[#e8e0d0] rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a96e] focus:border-[#c9a96e] resize-none bg-white"
                  />
                  <button
                    onClick={h.handleQuestionSubmit}
                    disabled={h.questionSubmitting || h.questionText.trim().length < 10}
                    className="mt-2 px-6 py-2.5 bg-[#1a1a1a] text-white text-xs uppercase tracking-wider font-medium rounded-sm hover:bg-[#1a1a1a]/90 transition-colors disabled:opacity-50"
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
        <div className="mt-14">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[#e8e0d0]" />
            <h2
              className="text-xl font-bold text-[#1a1a1a] uppercase tracking-wider text-center"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Birlikte Sik Alinan Urunler
            </h2>
            <div className="flex-1 h-px bg-[#e8e0d0]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {h.combinedBoughtTogether.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Similar Products */}
      {h.similarProducts.length > 0 && (
        <div className="mt-14">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[#e8e0d0]" />
            <h2
              className="text-xl font-bold text-[#1a1a1a] uppercase tracking-wider text-center"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Benzer Urunler
            </h2>
            <div className="flex-1 h-px bg-[#e8e0d0]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {h.similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {h.recentlyViewed.length > 0 && (
        <div className="mt-14">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[#e8e0d0]" />
            <h2
              className="text-xl font-bold text-[#1a1a1a] uppercase tracking-wider text-center"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Son Goruntulediginiz Urunler
            </h2>
            <div className="flex-1 h-px bg-[#e8e0d0]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {h.recentlyViewed.slice(0, 6).map((item) => (
              <a
                key={item.id}
                href={`/urun/${item.slug}`}
                className="group block rounded-sm border border-[#e8e0d0] hover:border-[#c9a96e] transition-all overflow-hidden"
              >
                <div className="aspect-square bg-[#fdfcfa] relative overflow-hidden">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 50vw, 16vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#c9a96e]/30">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  {item.category && <p className="text-[10px] uppercase text-[#c9a96e] tracking-wider mb-0.5">{item.category}</p>}
                  <p className="text-xs font-medium line-clamp-2 text-[#1a1a1a] group-hover:text-[#c9a96e] transition-colors">{item.name}</p>
                  <p className="text-sm font-bold text-[#1a1a1a] mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>{h.formatPrice(item.price)}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
