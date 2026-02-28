import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Markalar",
  description: "Tum markalari kesfet",
  alternates: { canonical: "/markalar" },
};

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { products: { where: { isActive: true } } } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="text-sm mb-6">
        <ol className="flex items-center gap-2 text-muted-foreground">
          <li><Link href="/" className="hover:text-primary">Anasayfa</Link></li>
          <li>/</li>
          <li className="text-foreground font-medium">Markalar</li>
        </ol>
      </nav>

      <h1 className="text-2xl md:text-3xl font-bold mb-8">Markalar</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/marka/${brand.slug}`}
            className="group flex flex-col items-center p-6 rounded-xl border border-border hover:border-primary hover:shadow-md transition-all"
          >
            {brand.logo ? (
              <Image
                src={brand.logo}
                alt={brand.name}
                width={64}
                height={64}
                className="object-contain mb-3"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-primary">
                  {brand.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h3 className="font-medium text-sm text-center group-hover:text-primary transition-colors">
              {brand.name}
            </h3>
            <span className="text-xs text-muted-foreground mt-1">
              {brand._count.products} urun
            </span>
          </Link>
        ))}
      </div>

      {brands.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">Henuz marka bulunmuyor</p>
        </div>
      )}
    </div>
  );
}
