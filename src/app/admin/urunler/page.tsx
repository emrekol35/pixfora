export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductList from "./ProductList";

async function getProducts() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      category: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
      images: { orderBy: { order: "asc" }, take: 1 },
      _count: { select: { variants: true } },
    },
  });
  return products;
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Urunler</h1>
        <Link
          href="/admin/urunler/yeni"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          + Yeni Urun
        </Link>
      </div>
      <ProductList products={products} />
    </div>
  );
}
