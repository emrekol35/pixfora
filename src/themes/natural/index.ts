import type { ThemeComponents } from "@/themes/types";
import NaturalHeader from "./NaturalHeader";
import NaturalFooter from "./NaturalFooter";
import NaturalProductCard from "./NaturalProductCard";
import NaturalHeroSection from "./NaturalHeroSection";
import NaturalCategoryGrid from "./NaturalCategoryGrid";
import NaturalPromotionBanner from "./NaturalPromotionBanner";
import NaturalTrustBadges from "./NaturalTrustBadges";
import NaturalProductDetail from "./NaturalProductDetail";
import NaturalCategoryProducts from "./NaturalCategoryProducts";

const components: ThemeComponents = {
  Header: NaturalHeader,
  Footer: NaturalFooter,
  ProductCard: NaturalProductCard,
  HeroSection: NaturalHeroSection,
  CategoryGrid: NaturalCategoryGrid,
  PromotionBanner: NaturalPromotionBanner,
  TrustBadges: NaturalTrustBadges,
  ProductDetail: NaturalProductDetail,
  CategoryProducts: NaturalCategoryProducts,
};

export default components;
