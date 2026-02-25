export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ProductForm from "../ProductForm";

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      variants: true,
      variantTypes: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
      tags: true,
    },
  });

  if (!product) return null;

  // Prisma JsonValue tipini duzenle
  return {
    ...product,
    variants: product.variants.map((v) => ({
      ...v,
      options: v.options as Record<string, string>,
    })),
  };
}

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

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, { categories, brands }] = await Promise.all([
    getProduct(id),
    getData(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Urun Duzenle</h1>
      <ProductForm product={product} categories={categories} brands={brands} />
    </div>
  );
}
