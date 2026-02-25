export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import CategoryForm from "../CategoryForm";

async function getCategory(id: string) {
  return prisma.category.findUnique({ where: { id } });
}

async function getParentCategories() {
  return prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, parentCategories] = await Promise.all([
    getCategory(id),
    getParentCategories(),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Kategori Duzenle</h1>
      <CategoryForm category={category} parentCategories={parentCategories} />
    </div>
  );
}
