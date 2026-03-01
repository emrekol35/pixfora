import dynamic from "next/dynamic";
import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";
import WishlistInit from "@/components/storefront/WishlistInit";
import CartSyncProvider from "@/components/storefront/CartSyncProvider";
import Providers from "@/components/storefront/Providers";
import OfflineIndicator from "@/components/shared/OfflineIndicator";

// Lazy load: client JS bundle'i ayri chunk olarak yuklenir (code splitting)
const CartDrawer = dynamic(
  () => import("@/components/storefront/CartDrawer")
);
const CompareBar = dynamic(
  () => import("@/components/storefront/CompareBar")
);
const MobileBottomNav = dynamic(
  () => import("@/components/storefront/MobileBottomNav")
);
const PWAInstallPrompt = dynamic(
  () => import("@/components/shared/PWAInstallPrompt")
);
const PushPermissionPrompt = dynamic(
  () => import("@/components/shared/PushPermissionPrompt")
);
const AnnouncementBar = dynamic(
  () => import("@/components/storefront/AnnouncementBar")
);
const MarketingPopup = dynamic(
  () => import("@/components/storefront/MarketingPopup")
);

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col">
        <OfflineIndicator />
        <AnnouncementBar />
        <Header />
        <CartDrawer />
        <WishlistInit />
        <CartSyncProvider />
        <CompareBar />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer />
        <MobileBottomNav />
        <PWAInstallPrompt />
        <PushPermissionPrompt />
        <MarketingPopup />
      </div>
    </Providers>
  );
}
