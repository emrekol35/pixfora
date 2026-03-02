import type { ThemeComponents } from "@/themes/types";
import TechHeader from "./TechHeader";
import TechFooter from "./TechFooter";
import TechProductCard from "./TechProductCard";
import TechHeroSection from "./TechHeroSection";
import TechCategoryGrid from "./TechCategoryGrid";
import TechPromotionBanner from "./TechPromotionBanner";
import TechTrustBadges from "./TechTrustBadges";
import TechProductDetail from "./TechProductDetail";
import TechCategoryProducts from "./TechCategoryProducts";

const components: ThemeComponents = {
  Header: TechHeader,
  Footer: TechFooter,
  ProductCard: TechProductCard,
  HeroSection: TechHeroSection,
  CategoryGrid: TechCategoryGrid,
  PromotionBanner: TechPromotionBanner,
  TrustBadges: TechTrustBadges,
  ProductDetail: TechProductDetail,
  CategoryProducts: TechCategoryProducts,
};

export default components;
