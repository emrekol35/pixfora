import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";
import CartDrawer from "@/components/storefront/CartDrawer";
import WishlistInit from "@/components/storefront/WishlistInit";
import CartSyncProvider from "@/components/storefront/CartSyncProvider";
import CompareBar from "@/components/storefront/CompareBar";
import Providers from "@/components/storefront/Providers";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col">
        <Header />
        <CartDrawer />
        <WishlistInit />
        <CartSyncProvider />
        <CompareBar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </Providers>
  );
}
