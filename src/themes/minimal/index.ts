import type { ThemeComponents } from "@/themes/types";
import MinimalHeader from "./MinimalHeader";
import MinimalFooter from "./MinimalFooter";
import MinimalProductCard from "./MinimalProductCard";
import MinimalHeroSection from "./MinimalHeroSection";
import MinimalCategoryGrid from "./MinimalCategoryGrid";
import MinimalPromotionBanner from "./MinimalPromotionBanner";
import MinimalTrustBadges from "./MinimalTrustBadges";

const components: ThemeComponents = {
  Header: MinimalHeader,
  Footer: MinimalFooter,
  ProductCard: MinimalProductCard,
  HeroSection: MinimalHeroSection,
  CategoryGrid: MinimalCategoryGrid,
  PromotionBanner: MinimalPromotionBanner,
  TrustBadges: MinimalTrustBadges,
};

export default components;
