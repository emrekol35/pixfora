import type { Metadata } from "next";
import OrderTrackingClient from "@/components/storefront/OrderTrackingClient";

export const metadata: Metadata = {
  title: "Siparis Takip",
  description: "Siparis numaraniz ve e-posta adresiniz ile siparisinizin durumunu takip edin.",
};

export default function OrderTrackingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2 text-center">Siparis Takip</h1>
      <p className="text-muted-foreground text-center mb-8">
        Siparis numaranizi ve e-posta adresinizi girerek siparisinizin durumunu ogrenebilirsiniz.
      </p>
      <OrderTrackingClient />
    </div>
  );
}
