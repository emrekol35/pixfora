export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import SlideForm from "../SlideForm";

export default async function EditSlidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const slide = await prisma.slide.findUnique({ where: { id } });
  if (!slide) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Slider Duzenle</h1>
      <SlideForm slide={slide} />
    </div>
  );
}
