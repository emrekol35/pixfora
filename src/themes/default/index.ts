import type { ThemeComponents } from "@/themes/types";
import DefaultHeader from "./DefaultHeader";
import DefaultFooter from "./DefaultFooter";
import DefaultProductCard from "./DefaultProductCard";
import DefaultHeroSection from "./DefaultHeroSection";
import DefaultCategoryGrid from "./DefaultCategoryGrid";
import DefaultPromotionBanner from "./DefaultPromotionBanner";
import DefaultTrustBadges from "./DefaultTrustBadges";

const components: ThemeComponents = {
  Header: DefaultHeader,
  Footer: DefaultFooter,
  ProductCard: DefaultProductCard,
  HeroSection: DefaultHeroSection,
  CategoryGrid: DefaultCategoryGrid,
  PromotionBanner: DefaultPromotionBanner,
  TrustBadges: DefaultTrustBadges,
};

export default components;
