"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { SHIMMER_PLACEHOLDER } from "@/lib/image-utils";
import ProductCard from "@/components/storefront/ProductCard";
import {
  useProductDetailLogic,
  type ProductDetailProps,
} from "@/themes/hooks/useProductDetailLogic";

export default function BoldProductDetail(props: ProductDetailProps) {
  const t = useTranslations("product");
  const h = useProductDetailLogic(props);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">
        {/* Images */}
        <div>
          <div className="relative aspect-square bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl overflow-hidden mb-4 border-2 border-purple-100 shadow-lg">
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
              <div className="w-full h-full flex items-center justify-center text-purple-200">
                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          {h.product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {h.product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => h.setSelectedImage(idx)}
                  className={`relative w-18 h-18 rounded-xl overflow-hidden shrink-0 border-3 transition-all duration-300 ${
                    idx === h.selectedImage
                      ? "border-[#8b5cf6] shadow-lg shadow-purple-200 scale-105"
                      : "border-transparent hover:border-pink-300 hover:scale-105"
                  }`}
                >
                  <Image src={img.url} alt={img.alt || ""} fill sizes="72px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {h.product.brand && (
            <span className="inline-block px-4 py-1 bg-gradient-to-r from-[#8b5cf6]/10 to-[#ec4899]/10 text-[#8b5cf6] text-sm font-bold rounded-full mb-2 border border-[#8b5cf6]/20">
              {h.product.brand.name}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
            {h.product.name}
          </h1>

          {h.product.reviewCount > 0 && (
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${star <= Math.round(h.product.avgRating) ? "text-[#8b5cf6]" : "text-gray-200"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-semibold text-[#8b5cf6]">
                {h.product.avgRating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-400">
                ({t("reviewCount", { count: h.product.reviewCount })})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-[#8b5cf6]/5 to-[#ec4899]/5 rounded-2xl border border-purple-100">
            <span className="text-4xl font-extrabold bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent">
              {h.formatPrice(h.currentPrice)}
            </span>
            {h.hasDiscount && (
              <>
                <span className="text-lg text-gray-400 line-through font-medium">
                  {h.formatPrice(h.product.comparePrice!)}
                </span>
                <span className="px-3 py-1 bg-gradient-to-r from-[#f97316] to-[#ec4899] text-white text-sm font-extrabold rounded-full shadow-md animate-pulse">
                  %{h.discountPercent}
                </span>
              </>
            )}
          </div>

          {h.product.shortDesc && (
            <p className="text-gray-500 mb-6 leading-relaxed text-base">{h.product.shortDesc}</p>
          )}

          {/* Variant Options */}
          {h.product.hasVariants && h.product.variantTypes.length > 0 && (
            <div className="space-y-5 mb-6">
              {h.product.variantTypes.map((type) => (
                <div key={type.id}>
                  <label className="text-sm font-bold mb-2 block text-gray-700">
                    {type.name}: <span className="text-[#8b5cf6]">{h.selectedOptions[type.name] || t("selectOption")}</span>
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
                          className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                            selected
                              ? "bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white shadow-lg shadow-purple-200 scale-105"
                              : available
                              ? "bg-purple-50 border-2 border-purple-200 text-gray-700 hover:border-[#8b5cf6] hover:bg-purple-100 hover:scale-105"
                              : "bg-gray-100 text-gray-300 line-through cursor-not-allowed border-2 border-gray-100"
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
          <div className="mb-5">
            {h.currentStock > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-full border border-emerald-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {t("inStockCount", { count: h.currentStock })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-500 text-sm font-bold rounded-full border border-red-200">
                {t("outOfStock")}
              </span>
            )}
          </div>

          {/* Gift Products */}
          {h.giftProducts && h.giftProducts.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-4 mb-5">
              <p className="text-sm font-extrabold text-emerald-600 mb-2 flex items-center gap-1">
                <span className="text-lg">&#127873;</span> Bu urunu aldiginizda hediye:
              </p>
              {h.giftProducts.map((gift) => (
                <div key={gift.id} className="flex items-center gap-3 mt-2 bg-white/60 rounded-xl p-2">
                  {gift.giftImage && (
                    <Image src={gift.giftImage} alt={gift.giftName} width={36} height={36} className="rounded-xl object-cover" />
                  )}
                  <span className="text-sm font-semibold text-gray-700">{gift.giftName}</span>
                  {gift.minOrderQty > 1 && (
                    <span className="text-xs text-gray-400 font-medium">(min. {gift.minOrderQty} adet)</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center bg-purple-50 rounded-full border-2 border-purple-200 overflow-hidden">
              <button onClick={h.decreaseQuantity} className="w-12 h-12 flex items-center justify-center text-[#8b5cf6] font-bold text-xl hover:bg-purple-100 transition-colors">-</button>
              <input
                type="number"
                value={h.quantity}
                onChange={(e) => h.setValidQuantity(parseInt(e.target.value) || h.product.minQty)}
                className="w-14 text-center text-sm font-bold bg-transparent border-x-2 border-purple-200 h-12 focus:outline-none"
              />
              <button onClick={h.increaseQuantity} className="w-12 h-12 flex items-center justify-center text-[#8b5cf6] font-bold text-xl hover:bg-purple-100 transition-colors">+</button>
            </div>
            <button
              onClick={h.handleAddToCart}
              disabled={!h.canAddToCart}
              className={`flex-1 rounded-full font-extrabold text-base transition-all duration-300 ${
                h.ctaExperiment.config?.buttonSize === "large" ? "py-5 text-lg" : "py-4"
              } ${
                h.canAddToCart
                  ? `bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white hover:shadow-xl hover:shadow-purple-300 hover:scale-[1.02] active:scale-[0.98]`
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
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
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white px-6 py-3 rounded-full shadow-2xl shadow-purple-300 text-sm font-bold animate-fade-in">
              &#10003; Urun sepete eklendi!
            </div>
          )}

          {/* Stock Notification */}
          {h.currentStock === 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5">
              {h.stockNotifDone ? (
                <div className="flex items-center gap-2 text-sm text-emerald-600 font-bold">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Stok geldiginde size haber verecegiz!</span>
                </div>
              ) : (
                <>
                  <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1">
                    <span className="text-lg">&#128276;</span> Stok geldiginde haber verelim mi?
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={h.stockNotifEmail}
                      onChange={(e) => h.setStockNotifEmail(e.target.value)}
                      placeholder="E-posta adresiniz"
                      className="flex-1 px-4 py-2.5 border-2 border-purple-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30 focus:border-[#8b5cf6] bg-white"
                    />
                    <button
                      onClick={h.handleStockNotify}
                      disabled={h.stockNotifLoading}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#f97316] to-[#ec4899] text-white text-sm font-bold rounded-full hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {h.stockNotifLoading ? "..." : "Haber Ver"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Giris yapmissaniz e-posta alani bos birakilabilir.</p>
                </>
              )}
            </div>
          )}

          {/* Meta Info */}
          <div className="border-t-2 border-purple-100 pt-5 mt-5 space-y-2">
            {h.product.sku && (
              <p className="text-sm text-gray-400">
                <span className="font-bold text-gray-600">SKU:</span> {h.product.sku}
              </p>
            )}
            {h.product.category && (
              <p className="text-sm text-gray-400">
                <span className="font-bold text-gray-600">Kategori:</span>{" "}
                <span className="text-[#8b5cf6] font-semibold">{h.product.category.name}</span>
              </p>
            )}
            {h.product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="font-bold text-gray-600 text-sm">Etiketler:</span>
                {h.product.tags.map((tag) => (
                  <span key={tag.tag} className="px-3 py-0.5 bg-purple-50 text-[#8b5cf6] text-xs font-semibold rounded-full border border-purple-200">
                    {tag.tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs - Pill shaped */}
      <div className="mt-14">
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
          {(["desc", "reviews", "qa"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => h.handleTabChange(tab)}
              className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                h.activeTab === tab
                  ? "bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white shadow-lg shadow-purple-200"
                  : "bg-purple-50 text-gray-500 hover:bg-purple-100 hover:text-[#8b5cf6] border-2 border-purple-100"
              }`}
            >
              {tab === "desc" ? t("description") : tab === "reviews" ? `${t("reviews")} (${h.product.reviewCount})` : t("questions")}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border-2 border-purple-100 p-6 shadow-sm">
          {h.activeTab === "desc" && (
            <div className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-a:text-[#8b5cf6]">
              {h.product.description ? (
                <div dangerouslySetInnerHTML={{ __html: h.product.description }} />
              ) : (
                <p className="text-gray-400">Urun aciklamasi bulunmuyor.</p>
              )}
            </div>
          )}

          {h.activeTab === "reviews" && (
            <div className="space-y-6">
              {h.product.reviews.length > 0 ? (
                h.product.reviews.map((review) => (
                  <div key={review.id} className="border-b-2 border-purple-50 pb-5 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] flex items-center justify-center text-white font-bold text-sm">
                          {review.user.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span className="font-bold text-sm text-gray-700">{review.user.name}</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? "text-[#8b5cf6]" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">{new Date(review.createdAt).toLocaleDateString("tr-TR")}</span>
                    </div>
                    {review.comment && <p className="text-sm text-gray-500 ml-12">{review.comment}</p>}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-8">{t("noReviews")}</p>
              )}

              {h.canReview && !h.reviewSubmitted && (
                <div className="mt-8 border-t-2 border-purple-100 pt-6">
                  <h3 className="text-lg font-extrabold mb-4 text-gray-800">{t("writeReview")}</h3>
                  <form onSubmit={h.handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-2 text-gray-600">Puaniniz</label>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" onClick={() => h.setReviewRating(star)} className="focus:outline-none transition-transform hover:scale-125">
                            <svg className={`w-8 h-8 transition-colors ${star <= h.reviewRating ? "text-[#8b5cf6]" : "text-gray-200 hover:text-purple-300"}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-gray-600">Yorumunuz</label>
                      <textarea
                        value={h.reviewComment}
                        onChange={(e) => h.setReviewComment(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30 focus:border-[#8b5cf6] bg-purple-50/50"
                        placeholder="Urun hakkindaki dusuncelerinizi yazin..."
                      />
                    </div>
                    <button type="submit" disabled={h.reviewSubmitting} className="px-8 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white rounded-full hover:shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-50 text-sm font-bold">
                      {h.reviewSubmitting ? "Gonderiliyor..." : "Degerlendirmeyi Gonder"}
                    </button>
                  </form>
                </div>
              )}
              {h.reviewSubmitted && (
                <div className="mt-8 border-t-2 border-purple-100 pt-6">
                  <div className="bg-emerald-50 text-emerald-600 rounded-2xl p-4 text-sm font-bold border-2 border-emerald-200">
                    Degerlendirmeniz basariyla gonderildi. Moderasyon sonrasi yayinlanacaktir.
                  </div>
                </div>
              )}
            </div>
          )}

          {h.activeTab === "qa" && (
            <div className="space-y-6">
              {!h.questionsLoaded ? (
                <p className="text-center text-gray-400 py-8">Yukleniyor...</p>
              ) : h.questions.length > 0 ? (
                h.questions.map((q: any) => (
                  <div key={q.id} className="border-b-2 border-purple-50 pb-5 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-white font-extrabold text-sm">S</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-700">{q.question}</p>
                        <p className="text-xs text-gray-400 mt-1">{q.user?.name || "Anonim"} - {new Date(q.createdAt).toLocaleDateString("tr-TR")}</p>
                      </div>
                    </div>
                    {q.answer && (
                      <div className="flex items-start gap-3 mt-3 ml-12">
                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-white font-extrabold text-sm">C</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">{q.answer}</p>
                          <p className="text-xs text-gray-400 mt-1">{q.answeredBy?.name || "Magaza"} - {q.answeredAt ? new Date(q.answeredAt).toLocaleDateString("tr-TR") : ""}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-8">Bu urun icin henuz soru sorulmamis.</p>
              )}
              {h.questionSubmitted ? (
                <div className="bg-emerald-50 text-emerald-600 rounded-2xl p-4 text-sm font-bold border-2 border-emerald-200">
                  Sorunuz basariyla gonderildi. Onaylandiktan sonra burada yayinlanacaktir.
                </div>
              ) : (
                <div className="border-t-2 border-purple-100 pt-6">
                  <h3 className="text-lg font-extrabold mb-3 text-gray-800">Soru Sor</h3>
                  <p className="text-xs text-gray-400 mb-3">Soru sormak icin giris yapmaniz gerekmektedir. En az 10 karakter yaziniz.</p>
                  <textarea
                    value={h.questionText}
                    onChange={(e) => h.setQuestionText(e.target.value)}
                    rows={3}
                    placeholder="Bu urun hakkinda sorunuzu yazin..."
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30 focus:border-[#8b5cf6] resize-none bg-purple-50/50"
                  />
                  <button
                    onClick={h.handleQuestionSubmit}
                    disabled={h.questionSubmitting || h.questionText.trim().length < 10}
                    className="mt-3 px-8 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white text-sm font-bold rounded-full hover:shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-50"
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
          <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2">
            <span className="bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent">
              Birlikte Sik Alinan Urunler
            </span>
            <span className="text-2xl">&#128293;</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {h.combinedBoughtTogether.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Similar Products */}
      {h.similarProducts.length > 0 && (
        <div className="mt-14">
          <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2">
            <span className="bg-gradient-to-r from-[#ec4899] to-[#f97316] bg-clip-text text-transparent">
              Benzer Urunler
            </span>
            <span className="text-2xl">&#9889;</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {h.similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {h.recentlyViewed.length > 0 && (
        <div className="mt-14">
          <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2">
            <span className="bg-gradient-to-r from-[#f97316] to-[#8b5cf6] bg-clip-text text-transparent">
              Son Goruntulediginiz Urunler
            </span>
            <span className="text-2xl">&#128064;</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {h.recentlyViewed.slice(0, 6).map((item) => (
              <a
                key={item.id}
                href={`/urun/${item.slug}`}
                className="group block rounded-2xl border-2 border-purple-100 hover:border-[#8b5cf6] hover:shadow-xl hover:shadow-purple-100 transition-all duration-300 overflow-hidden bg-white hover:-translate-y-1"
              >
                <div className="aspect-square bg-purple-50/50 relative overflow-hidden">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 50vw, 16vw" className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-purple-200">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  {item.category && <p className="text-[10px] uppercase text-[#8b5cf6] tracking-wider font-bold mb-0.5">{item.category}</p>}
                  <p className="text-xs font-bold line-clamp-2 group-hover:text-[#8b5cf6] transition-colors text-gray-700">{item.name}</p>
                  <p className="text-sm font-extrabold bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent mt-1">{h.formatPrice(item.price)}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
