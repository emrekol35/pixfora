import { ComponentType } from "react";

// ---- Prop interfaces for themed components ----

export interface ProductCardProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  stock: number;
  minQty: number;
  maxQty?: number | null;
  images: { url: string; alt?: string | null }[];
  category?: { name: string } | null;
  brand?: { name: string } | null;
  isFeatured?: boolean;
  avgRating?: number;
  reviewCount?: number;
}

export interface ProductCardProps {
  product: ProductCardProduct;
}

export interface SlideData {
  id: string;
  title: string | null;
  subtitle: string | null;
  link: string | null;
  image: string | null;
}

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  _count: { products: number };
}

export interface HeroSectionProps {
  slides: SlideData[];
}

export interface CategoryGridProps {
  categories: CategoryData[];
}

// ---- Theme components interface ----

export interface ThemeComponents {
  Header: ComponentType;
  Footer: ComponentType;
  ProductCard: ComponentType<ProductCardProps>;
  HeroSection: ComponentType<HeroSectionProps>;
  CategoryGrid: ComponentType<CategoryGridProps>;
  PromotionBanner: ComponentType;
  TrustBadges: ComponentType;
}

// ---- Theme definition ----

export interface ThemeMeta {
  id: string;
  name: string;
  description: string;
  previewColors: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
    accent: string;
  };
  defaultSettings: Record<string, string>;
}
