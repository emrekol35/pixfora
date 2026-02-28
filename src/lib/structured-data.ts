const BASE_URL = process.env.AUTH_URL || "https://pixfora.com";

// Organization schema — anasayfa icin
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Pixfora",
    url: BASE_URL,
    logo: `${BASE_URL}/icons/icon-512.png`,
    sameAs: [],
  };
}

// WebSite schema — arama kutusu (sitelinks searchbox) icin
export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Pixfora",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/arama?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// Product schema — urun detay sayfasi icin
export function getProductSchema(product: {
  name: string;
  slug: string;
  description: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  sku: string | null;
  images: { url: string; alt: string | null }[];
  brand: { name: string } | null;
  category: { name: string } | null;
  avgRating: number;
  reviewCount: number;
  reviews: {
    rating: number;
    comment: string | null;
    createdAt: Date;
    user: { name: string | null };
  }[];
}) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: `${BASE_URL}/urun/${product.slug}`,
    description: product.description || product.name,
    image: product.images.map((img) => img.url),
  };

  if (product.sku) {
    schema.sku = product.sku;
  }

  if (product.brand) {
    schema.brand = {
      "@type": "Brand",
      name: product.brand.name,
    };
  }

  if (product.category) {
    schema.category = product.category.name;
  }

  // Fiyat ve stok bilgisi
  schema.offers = {
    "@type": "Offer",
    url: `${BASE_URL}/urun/${product.slug}`,
    priceCurrency: "TRY",
    price: product.price.toFixed(2),
    availability:
      product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    seller: {
      "@type": "Organization",
      name: "Pixfora",
    },
  };

  // Yorum ve puanlama
  if (product.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.avgRating.toFixed(1),
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };

    // En fazla 5 yorum goster
    schema.review = product.reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
      },
      author: {
        "@type": "Person",
        name: r.user.name || "Anonim",
      },
      ...(r.comment && { reviewBody: r.comment }),
      datePublished: r.createdAt.toISOString(),
    }));
  }

  return schema;
}

// BreadcrumbList schema
export function getBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// BlogPosting schema — blog yazi sayfasi icin
export function getBlogPostingSchema(post: {
  title: string;
  slug: string;
  excerpt: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: { name: string } | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    url: `${BASE_URL}/blog/${post.slug}`,
    description: post.excerpt || post.title,
    ...(post.image && { image: post.image }),
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Organization",
      name: "Pixfora",
    },
    publisher: {
      "@type": "Organization",
      name: "Pixfora",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/icons/icon-512.png`,
      },
    },
    ...(post.category && { articleSection: post.category.name }),
  };
}
