export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import SlideList from "./SlideList";

export default async function SlidersPage() {
  const slides = await prisma.slide.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sliderlar</h1>
        <Link href="/admin/icerik/sliderlar/yeni" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm">
          + Yeni Slider
        </Link>
      </div>
      <SlideList slides={slides} />
    </div>
  );
}
