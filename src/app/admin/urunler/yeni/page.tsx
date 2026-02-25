export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import ProductForm from "../ProductForm";

async function getData() {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.brand.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { categories, brands };
}

export default async function NewProductPage() {
  const { categories, brands } = await getData();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Yeni Urun</h1>
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
