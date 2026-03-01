import type { ThemeComponents } from "@/themes/types";
import NaturalHeader from "./NaturalHeader";
import NaturalFooter from "./NaturalFooter";
import NaturalProductCard from "./NaturalProductCard";
import NaturalHeroSection from "./NaturalHeroSection";
import NaturalCategoryGrid from "./NaturalCategoryGrid";
import NaturalPromotionBanner from "./NaturalPromotionBanner";
import NaturalTrustBadges from "./NaturalTrustBadges";

const components: ThemeComponents = {
  Header: NaturalHeader,
  Footer: NaturalFooter,
  ProductCard: NaturalProductCard,
  HeroSection: NaturalHeroSection,
  CategoryGrid: NaturalCategoryGrid,
  PromotionBanner: NaturalPromotionBanner,
  TrustBadges: NaturalTrustBadges,
};

export default components;
