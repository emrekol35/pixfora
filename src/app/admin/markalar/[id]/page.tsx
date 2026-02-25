export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import BrandForm from "../BrandForm";

async function getBrand(id: string) {
  return prisma.brand.findUnique({ where: { id } });
}

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brand = await getBrand(id);

  if (!brand) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Marka Duzenle</h1>
      <BrandForm brand={brand} />
    </div>
  );
}
