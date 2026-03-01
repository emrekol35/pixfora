import type { ThemeComponents } from "@/themes/types";
import ElegantHeader from "./ElegantHeader";
import ElegantFooter from "./ElegantFooter";
import ElegantProductCard from "./ElegantProductCard";
import ElegantHeroSection from "./ElegantHeroSection";
import ElegantCategoryGrid from "./ElegantCategoryGrid";
import ElegantPromotionBanner from "./ElegantPromotionBanner";
import ElegantTrustBadges from "./ElegantTrustBadges";

const components: ThemeComponents = {
  Header: ElegantHeader,
  Footer: ElegantFooter,
  ProductCard: ElegantProductCard,
  HeroSection: ElegantHeroSection,
  CategoryGrid: ElegantCategoryGrid,
  PromotionBanner: ElegantPromotionBanner,
  TrustBadges: ElegantTrustBadges,
};

export default components;
