"use client";

import { useThemeComponents } from "@/components/storefront/ThemeProvider";
import type { SlideData, CategoryData } from "@/themes/types";

interface ThemedHomePageProps {
  slides: SlideData[];
  categories: CategoryData[];
}

export default function ThemedHomePage({ slides, categories }: ThemedHomePageProps) {
  const { HeroSection, CategoryGrid, PromotionBanner, TrustBadges } = useThemeComponents();

  return (
    <>
      <HeroSection slides={slides} />
      {categories.length > 0 && <CategoryGrid categories={categories} />}
      <PromotionBanner />
      <TrustBadges />
    </>
  );
}
