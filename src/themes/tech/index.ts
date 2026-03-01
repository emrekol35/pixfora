import type { ThemeComponents } from "@/themes/types";
import TechHeader from "./TechHeader";
import TechFooter from "./TechFooter";
import TechProductCard from "./TechProductCard";
import TechHeroSection from "./TechHeroSection";
import TechCategoryGrid from "./TechCategoryGrid";
import TechPromotionBanner from "./TechPromotionBanner";
import TechTrustBadges from "./TechTrustBadges";

const components: ThemeComponents = {
  Header: TechHeader,
  Footer: TechFooter,
  ProductCard: TechProductCard,
  HeroSection: TechHeroSection,
  CategoryGrid: TechCategoryGrid,
  PromotionBanner: TechPromotionBanner,
  TrustBadges: TechTrustBadges,
};

export default components;
