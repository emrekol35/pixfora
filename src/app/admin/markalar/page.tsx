export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import BrandList from "./BrandList";

async function getBrands() {
  return prisma.brand.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
}

export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Markalar</h1>
        <Link
          href="/admin/markalar/yeni"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          + Yeni Marka
        </Link>
      </div>
      <BrandList brands={brands} />
    </div>
  );
}
