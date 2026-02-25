export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import CategoryList from "./CategoryList";

async function getCategories() {
  return prisma.category.findMany({
    where: { parentId: null },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      children: {
        orderBy: [{ order: "asc" }, { name: "asc" }],
        include: {
          children: { orderBy: [{ order: "asc" }, { name: "asc" }] },
        },
      },
      _count: { select: { products: true } },
    },
  });
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Kategoriler</h1>
        <Link
          href="/admin/kategoriler/yeni"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          + Yeni Kategori
        </Link>
      </div>
      <CategoryList categories={categories} />
    </div>
  );
}
