import type { ThemeComponents } from "@/themes/types";
import BoldHeader from "./BoldHeader";
import BoldFooter from "./BoldFooter";
import BoldProductCard from "./BoldProductCard";
import BoldHeroSection from "./BoldHeroSection";
import BoldCategoryGrid from "./BoldCategoryGrid";
import BoldPromotionBanner from "./BoldPromotionBanner";
import BoldTrustBadges from "./BoldTrustBadges";
import BoldProductDetail from "./BoldProductDetail";
import BoldCategoryProducts from "./BoldCategoryProducts";

const components: ThemeComponents = {
  Header: BoldHeader,
  Footer: BoldFooter,
  ProductCard: BoldProductCard,
  HeroSection: BoldHeroSection,
  CategoryGrid: BoldCategoryGrid,
  PromotionBanner: BoldPromotionBanner,
  TrustBadges: BoldTrustBadges,
  ProductDetail: BoldProductDetail,
  CategoryProducts: BoldCategoryProducts,
};

export default components;
