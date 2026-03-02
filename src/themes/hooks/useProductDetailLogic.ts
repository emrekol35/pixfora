"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useCartStore, CartVariant } from "@/store/cart";
import { useRecentlyViewedStore } from "@/store/recently-viewed";
import { useTracking } from "@/components/storefront/TrackingProvider";
import { useExperiment } from "@/hooks/useExperiment";

// ---- Shared interfaces ----

export interface VariantType {
  id: string;
  name: string;
  options: { id: string; value: string }[];
}

export interface Variant {
  id: string;
  sku: string | null;
  price: number | null;
  stock: number;
  isActive: boolean;
  options: Record<string, string>;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  order: number;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string };
}

export interface ProductData {
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

export interface RelatedProduct {
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

export interface GiftProduct {
  id: string;
  giftName: string;
  giftImage: string | null;
  minOrderQty: number;
}

export interface ProductDetailProps {
  product: ProductData;
  similarProducts: RelatedProduct[];
  boughtTogether?: RelatedProduct[];
  complementaryProducts?: RelatedProduct[];
  giftProducts?: GiftProduct[];
  canReview?: boolean;
}

// ---- Hook ----

export function useProductDetailLogic(props: ProductDetailProps) {
  const { product } = props;
  const router = useRouter();

  // State
  const [selectedImage, setSelectedImage] = useState(0);
  const [addedToast, setAddedToast] = useState(false);
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

  // Store & hooks
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addItem);
  const recentlyViewedItems = useRecentlyViewedStore((s) => s.items);
  const { trackEvent } = useTracking();
  const ctaExperiment = useExperiment("product-cta");
  const addToCartBehavior = useExperiment("add-to-cart-behavior");

  // Track recently viewed
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

  // Track product view
  useEffect(() => {
    trackEvent("product_view", {
      productId: product.id,
      productName: product.name,
      price: product.price,
      category: product.category?.name || null,
      brand: product.brand?.name || null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // Computed
  const selectedVariant = product.hasVariants
    ? product.variants.find((v) =>
        Object.entries(selectedOptions).every(([key, value]) => v.options[key] === value)
      )
    : null;

  const currentPrice = selectedVariant?.price || product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const hasDiscount = product.comparePrice && product.comparePrice > currentPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.comparePrice! - currentPrice) / product.comparePrice!) * 100)
    : 0;
  const canAddToCart =
    currentStock > 0 &&
    (!product.hasVariants || (product.hasVariants && !!selectedVariant));

  // Combined related products
  const combinedBoughtTogether = (() => {
    const allBought = [
      ...(props.complementaryProducts || []),
      ...(props.boughtTogether || []),
    ];
    const uniqueIds = new Set<string>();
    return allBought.filter((p) => {
      if (uniqueIds.has(p.id) || p.id === product.id) return false;
      uniqueIds.add(p.id);
      return true;
    });
  })();

  const recentlyViewed = recentlyViewedItems.filter((i) => i.id !== product.id);

  // Handlers
  const handleAddToCart = useCallback(() => {
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

    trackEvent("add_to_cart", {
      productId: product.id,
      productName: product.name,
      price: selectedVariant?.price || product.price,
      quantity,
      variantId: selectedVariant?.id || null,
    });

    const behavior = addToCartBehavior.config?.behavior as string | undefined;
    if (behavior === "redirect") {
      router.push("/sepet" as any);
    } else if (behavior === "toast") {
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 3000);
    } else {
      openCart();
    }
  }, [canAddToCart, selectedVariant, product, quantity, addItem, openCart, trackEvent, addToCartBehavior, router]);

  const handleOptionSelect = useCallback(
    (typeName: string, value: string) => {
      setSelectedOptions((prev) => ({ ...prev, [typeName]: value }));
      trackEvent("variant_selected", {
        productId: product.id,
        optionName: typeName,
        optionValue: value,
      });
    },
    [product.id, trackEvent]
  );

  const isOptionAvailable = useCallback(
    (typeName: string, value: string) => {
      const testOptions = { ...selectedOptions, [typeName]: value };
      return product.variants.some(
        (v) =>
          v.isActive &&
          v.stock > 0 &&
          Object.entries(testOptions).every(
            ([k, val]) => !testOptions[k] || v.options[k] === val
          )
      );
    },
    [selectedOptions, product.variants]
  );

  const handleTabChange = useCallback(
    (tab: "desc" | "reviews" | "qa") => {
      setActiveTab(tab);
      trackEvent("product_tab_view", { productId: product.id, tab });
    },
    [product.id, trackEvent]
  );

  // Load questions
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

  const handleQuestionSubmit = useCallback(async () => {
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
  }, [questionText, product.id]);

  const handleReviewSubmit = useCallback(
    async (e: React.FormEvent) => {
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
          alert(data.error || "Degerlendirme gonderilemedi");
        }
      } catch {
        alert("Bir hata olustu.");
      } finally {
        setReviewSubmitting(false);
      }
    },
    [product.id, reviewRating, reviewComment]
  );

  const handleStockNotify = useCallback(async () => {
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
  }, [product.id, selectedVariant, stockNotifEmail]);

  const formatPrice = useCallback(
    (price: number) =>
      new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price),
    []
  );

  const decreaseQuantity = useCallback(() => {
    setQuantity((q) => Math.max(product.minQty, q - 1));
  }, [product.minQty]);

  const increaseQuantity = useCallback(() => {
    const maxQty = product.maxQty || currentStock;
    setQuantity((q) => Math.min(maxQty, q + 1));
  }, [product.maxQty, currentStock]);

  const setValidQuantity = useCallback(
    (val: number) => {
      const maxQty = product.maxQty || currentStock;
      setQuantity(Math.max(product.minQty, Math.min(val, maxQty)));
    },
    [product.minQty, product.maxQty, currentStock]
  );

  return {
    // Props passthrough
    product,
    similarProducts: props.similarProducts,
    giftProducts: props.giftProducts,
    canReview: props.canReview,

    // State
    selectedImage,
    setSelectedImage,
    addedToast,
    selectedOptions,
    quantity,
    activeTab,
    reviewRating,
    setReviewRating,
    reviewComment,
    setReviewComment,
    reviewSubmitting,
    reviewSubmitted,
    stockNotifEmail,
    setStockNotifEmail,
    stockNotifLoading,
    stockNotifDone,
    questions,
    questionsLoaded,
    questionText,
    setQuestionText,
    questionSubmitting,
    questionSubmitted,

    // Computed
    selectedVariant,
    currentPrice,
    currentStock,
    hasDiscount,
    discountPercent,
    canAddToCart,
    combinedBoughtTogether,
    recentlyViewed,
    ctaExperiment,

    // Handlers
    handleAddToCart,
    handleOptionSelect,
    isOptionAvailable,
    handleTabChange,
    handleQuestionSubmit,
    handleReviewSubmit,
    handleStockNotify,
    formatPrice,
    decreaseQuantity,
    increaseQuantity,
    setValidQuantity,
  };
}

export type ProductDetailLogic = ReturnType<typeof useProductDetailLogic>;
