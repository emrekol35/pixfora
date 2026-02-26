export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PopupForm from "../PopupForm";

export default async function EditPopupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const popup = await prisma.popup.findUnique({ where: { id } });
  if (!popup) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pop-up Duzenle</h1>
      <PopupForm popup={popup} />
    </div>
  );
}
