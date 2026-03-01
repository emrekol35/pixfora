"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface EntityItem {
  id: string;
  name: string;
  slug?: string;
  translatedFields: number;
  images?: { url: string }[];
  logo?: string;
}

interface EntityListResponse {
  entities: EntityItem[];
  total: number;
  page: number;
  totalPages: number;
}

const TYPE_LABELS: Record<string, string> = {
  product: "Ürünler",
  category: "Kategoriler",
  brand: "Markalar",
  page: "Sayfalar",
  blogPost: "Blog Yazıları",
  slide: "Slider",
};

export default function EntityTypeTranslationsPage({
  params,
}: {
  params: Promise<{ entityType: string }>;
}) {
  const { entityType } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<EntityListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const page = parseInt(searchParams.get("page") || "1");
  const label = TYPE_LABELS[entityType] || entityType;

  const fetchData = (p: number, s: string) => {
    setLoading(true);
    const params = new URLSearchParams({
      entityType,
      locale: "en",
      page: String(p),
      limit: "20",
    });
    if (s) params.set("search", s);

    fetch(`/api/admin/translations?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, page]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    router.push(`/admin/ceviriler/${entityType}?${params}`);
    fetchData(1, search);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/ceviriler"
          className="text-muted-foreground hover:text-foreground"
        >
          ← Çeviriler
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-2xl font-bold">{label}</h1>
      </div>

      {/* Arama */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={`${label} içinde ara...`}
          className="flex-1 px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
        >
          Ara
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      ) : !data || data.entities.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">Sonuç bulunamadı</p>
        </div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground mb-4">
            Toplam {data.total} kayıt
          </div>

          <div className="space-y-2">
            {data.entities.map((entity) => (
              <Link
                key={entity.id}
                href={`/admin/ceviriler/${entityType}/${entity.id}`}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-3">
                  {entity.images?.[0]?.url && (
                    <img
                      src={entity.images[0].url}
                      alt=""
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  {entity.logo && (
                    <img
                      src={entity.logo}
                      alt=""
                      className="w-10 h-10 object-contain rounded"
                    />
                  )}
                  <div>
                    <p className="font-medium">{entity.name}</p>
                    {entity.slug && (
                      <p className="text-xs text-muted-foreground">{entity.slug}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {entity.translatedFields > 0 ? (
                    <span className="px-2.5 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                      {entity.translatedFields} alan çevrildi
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                      Çevrilmedi
                    </span>
                  )}
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {page > 1 && (
                <Link
                  href={`/admin/ceviriler/${entityType}?page=${page - 1}${search ? `&search=${search}` : ""}`}
                  className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted"
                >
                  Önceki
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Sayfa {data.page} / {data.totalPages}
              </span>
              {page < data.totalPages && (
                <Link
                  href={`/admin/ceviriler/${entityType}?page=${page + 1}${search ? `&search=${search}` : ""}`}
                  className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted"
                >
                  Sonraki
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
