export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import CategoryForm from "../CategoryForm";

async function getParentCategories() {
  return prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export default async function NewCategoryPage() {
  const parentCategories = await getParentCategories();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Yeni Kategori</h1>
      <CategoryForm parentCategories={parentCategories} />
    </div>
  );
}
