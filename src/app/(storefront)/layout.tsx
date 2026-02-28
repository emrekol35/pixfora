import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";
import CartDrawer from "@/components/storefront/CartDrawer";
import WishlistInit from "@/components/storefront/WishlistInit";
import CartSyncProvider from "@/components/storefront/CartSyncProvider";
import CompareBar from "@/components/storefront/CompareBar";
import Providers from "@/components/storefront/Providers";
import MobileBottomNav from "@/components/storefront/MobileBottomNav";
import PWAInstallPrompt from "@/components/shared/PWAInstallPrompt";
import OfflineIndicator from "@/components/shared/OfflineIndicator";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col">
        <OfflineIndicator />
        <Header />
        <CartDrawer />
        <WishlistInit />
        <CartSyncProvider />
        <CompareBar />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer />
        <MobileBottomNav />
        <PWAInstallPrompt />
      </div>
    </Providers>
  );
}
