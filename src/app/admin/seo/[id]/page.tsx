export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import RedirectForm from "../RedirectForm";

export default async function EditRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const redirect = await prisma.redirect.findUnique({ where: { id } });

  if (!redirect) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Yonlendirme Duzenle</h1>
      <RedirectForm redirect={redirect} />
    </div>
  );
}
