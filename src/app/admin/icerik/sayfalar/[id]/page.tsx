export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PageForm from "../PageForm";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id } });

  if (!page) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Sayfa Duzenle</h1>
      <PageForm page={page} />
    </div>
  );
}
