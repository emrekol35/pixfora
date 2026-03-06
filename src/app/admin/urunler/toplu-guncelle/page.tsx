import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import BulkPriceStockClient from "./BulkPriceStockClient";

export const metadata = {
  title: "Toplu Fiyat/Stok Guncelleme | Admin",
};

export default async function BulkPriceStockPage() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Toplu Fiyat/Stok Guncelleme</h1>
      <BulkPriceStockClient />
    </div>
  );
}
