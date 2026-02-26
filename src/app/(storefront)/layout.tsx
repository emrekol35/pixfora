import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";
import CartDrawer from "@/components/storefront/CartDrawer";
import WishlistInit from "@/components/storefront/WishlistInit";
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
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </Providers>
  );
}
