"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface ParsedUrl {
  url: string;
  contentId: string | null;
  valid: boolean;
}

interface ImportResult {
  url: string;
  contentId: string;
  status: "success" | "failed" | "duplicate";
  productId?: string;
  productName?: string;
  error?: string;
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

interface ListProduct {
  id: number;
  name: string;
  brand: string;
  url: string;
  price: {
    current: number;
    original?: number;
    discounted?: number;
    currency: string;
  };
  image: string;
  ratingScore?: { averageRating: number; totalCount: number };
  merchantName?: string;
  categoryName?: string;
  freeCargo?: boolean;
  hasStock?: boolean;
}

type Mode = "urls" | "search";
type Step = "input" | "preview" | "importing" | "result";

function parseContentId(url: string): string | null {
  const trimmed = url.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/-p-(\d+)/);
  return match ? match[1] : null;
}

export default function TrendyolImportClient() {
  const [mode, setMode] = useState<Mode>("search");
  const [step, setStep] = useState<Step>("input");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentUrl, setCurrentUrl] = useState("");

  // URL modu state
  const [urlText, setUrlText] = useState("");
  const [parsedUrls, setParsedUrls] = useState<ParsedUrl[]>([]);

  // Arama modu state
  const [searchUrl, setSearchUrl] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [listProducts, setListProducts] = useState<ListProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productMap, setProductMap] = useState<Map<number, ListProduct>>(
    new Map()
  );
  const [pageLoading, setPageLoading] = useState(false);
  // Offset-bazli sayfalama: her sayfa bir sonraki sayfanin offset'ini dondurur
  const [pageOffsets, setPageOffsets] = useState<Map<number, number>>(
    new Map()
  );
  const [pageProducts, setPageProducts] = useState<
    Map<number, ListProduct[]>
  >(new Map());
  // En son yuklenen sayfa numarasi (ileri navigasyon siniri)
  const [maxLoadedPage, setMaxLoadedPage] = useState(1);

  // Kategorileri yukle
  useEffect(() => {
    fetch("/api/categories?flat=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
        else if (data.categories) setCategories(data.categories);
      })
      .catch(() => {});
  }, []);

  // ---- URL Modu ----

  function handleParseUrls() {
    const lines = urlText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const parsed: ParsedUrl[] = lines.map((url) => {
      const contentId = parseContentId(url);
      return { url, contentId, valid: !!contentId };
    });

    setParsedUrls(parsed);
    setStep("preview");
  }

  async function handleStartUrlImport() {
    const validUrls = parsedUrls.filter((p) => p.valid).map((p) => p.url);
    if (validUrls.length === 0) return;

    setStep("importing");
    setProgress(0);
    setResults([]);

    try {
      const res = await fetch("/api/admin/trendyol-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          urls: validUrls,
          categoryId: categoryId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResults([
          {
            url: "",
            contentId: "",
            status: "failed",
            error: data.error || "Aktarim hatasi",
          },
        ]);
      } else {
        setResults(data.results || []);
      }
    } catch {
      setResults([
        {
          url: "",
          contentId: "",
          status: "failed",
          error: "Baglanti hatasi",
        },
      ]);
    }

    setProgress(100);
    setStep("result");
  }

  // ---- Arama Modu ----

  function applyPageData(
    products: ListProduct[],
    page: number,
    data: {
      totalCount?: number;
      totalPages?: number;
      nextOffset?: number;
    }
  ) {
    setListProducts(products);
    setCurrentPage(page);
    if (data.totalCount) setTotalCount(data.totalCount);
    if (data.totalPages) setTotalPages(data.totalPages);

    // Product map'e ekle
    setProductMap((prev) => {
      const next = new Map(prev);
      products.forEach((p) => next.set(p.id, p));
      return next;
    });

    // Sayfa cache'e kaydet
    setPageProducts((prev) => new Map(prev).set(page, products));

    // Sonraki sayfa icin offset'i kaydet
    if (data.nextOffset !== undefined) {
      setPageOffsets((prev) => new Map(prev).set(page + 1, data.nextOffset!));
    }

    // Max loaded page guncelle
    setMaxLoadedPage((prev) => Math.max(prev, page));

    // Urunler otomatik secilmez, kullanici manuel secer
  }

  /**
   * Kullanicinin girdisini Trendyol URL'sine cevir.
   * - URL ise oldugu gibi kullan
   * - Tek kelime ise marka sayfasi dene (trendyol.com/{slug})
   * - Birden fazla kelime ise arama URL'si olustur (trendyol.com/sr?q=...)
   */
  function buildTrendyolUrl(input: string): string {
    const trimmed = input.trim();
    // Zaten URL ise dokunma
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("www.")) {
      return trimmed.startsWith("www.") ? `https://${trimmed}` : trimmed;
    }
    // Bosluk iceriyorsa arama URL'si olustur
    if (trimmed.includes(" ")) {
      const query = encodeURIComponent(trimmed);
      return `https://www.trendyol.com/sr?q=${query}`;
    }
    // Tek kelime -> marka sayfasi URL'si
    const slug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9\-]/g, "");
    return `https://www.trendyol.com/${slug}`;
  }

  async function handleFetchProducts(overrideUrl?: string) {
    const input = overrideUrl || searchUrl;
    if (!input.trim()) return;

    const finalUrl = buildTrendyolUrl(input);

    setSearchLoading(true);
    setSearchError("");
    setListProducts([]);
    setSelectedIds(new Set());
    setProductMap(new Map());
    setCurrentPage(1);
    setTotalPages(1);
    setPageOffsets(new Map());
    setPageProducts(new Map());
    setMaxLoadedPage(1);

    // Marka/duz metin arama ise searchUrl'i guncelle
    if (!overrideUrl) {
      // searchUrl zaten set, sadece arka planda finalUrl kullanalim
    } else {
      setSearchUrl(overrideUrl);
    }

    try {
      const res = await fetch("/api/admin/trendyol-import/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ searchUrl: finalUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.error || "Urun listesi alinamadi");
        return;
      }

      const products: ListProduct[] = data.products || [];
      applyPageData(products, 1, data);
      setStep("preview");
    } catch {
      setSearchError("Baglanti hatasi");
    } finally {
      setSearchLoading(false);
    }
  }

  async function handlePageChange(page: number) {
    if (page < 1 || page > totalPages || page === currentPage) return;

    // Cache'de varsa direkt goster (geri navigasyon)
    const cached = pageProducts.get(page);
    if (cached) {
      setListProducts(cached);
      setCurrentPage(page);
      return;
    }

    // Ileri navigasyon — offset gerekli
    const offset = pageOffsets.get(page);
    if (offset === undefined) return; // Bu sayfaya henuz gidilemez

    setPageLoading(true);
    setSearchError("");

    try {
      // pi parametresi URL'ye eklenir, offset body'de gonderilir
      let pageUrl = buildTrendyolUrl(searchUrl);
      try {
        const u = new URL(pageUrl);
        u.searchParams.set("pi", String(page));
        pageUrl = u.toString();
      } catch {
        pageUrl = `${pageUrl}${pageUrl.includes("?") ? "&" : "?"}pi=${page}`;
      }

      const res = await fetch("/api/admin/trendyol-import/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ searchUrl: pageUrl, offset }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.error || "Sayfa yuklenemedi");
        return;
      }

      const newProducts: ListProduct[] = data.products || [];
      applyPageData(newProducts, page, data);
    } catch {
      setSearchError("Baglanti hatasi");
    } finally {
      setPageLoading(false);
    }
  }

  function toggleProduct(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const currentPageIds = listProducts.map((p) => p.id);
    const allCurrentSelected = currentPageIds.every((id) =>
      selectedIds.has(id)
    );

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCurrentSelected) {
        currentPageIds.forEach((id) => next.delete(id));
      } else {
        currentPageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  async function handleStartSearchImport() {
    // Tum sayfalardaki secili urunleri productMap'ten al
    const selectedProducts = Array.from(selectedIds)
      .map((id) => productMap.get(id))
      .filter(Boolean) as ListProduct[];
    if (selectedProducts.length === 0) return;

    // Secilen urunlerin URL'lerini olustur
    const urls = selectedProducts.map(
      (p) => `https://www.trendyol.com${p.url}`
    );

    setStep("importing");
    setProgress(0);
    setResults([]);

    try {
      const res = await fetch("/api/admin/trendyol-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          urls,
          categoryId: categoryId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResults([
          {
            url: "",
            contentId: "",
            status: "failed",
            error: data.error || "Aktarim hatasi",
          },
        ]);
      } else {
        setResults(data.results || []);
      }
    } catch {
      setResults([
        {
          url: "",
          contentId: "",
          status: "failed",
          error: "Baglanti hatasi",
        },
      ]);
    }

    setProgress(100);
    setStep("result");
  }

  // ---- Ortak ----

  function handleReset() {
    setStep("input");
    setUrlText("");
    setParsedUrls([]);
    setResults([]);
    setProgress(0);
    setCurrentUrl("");
    setSearchUrl("");
    setSearchError("");
    setListProducts([]);
    setSelectedIds(new Set());
    setTotalCount(0);
    setCurrentPage(1);
    setTotalPages(1);
    setProductMap(new Map());
    setPageLoading(false);
    setPageOffsets(new Map());
    setPageProducts(new Map());
    setMaxLoadedPage(1);
  }

  const validCount = parsedUrls.filter((p) => p.valid).length;
  const invalidCount = parsedUrls.filter((p) => !p.valid).length;

  const successCount = results.filter((r) => r.status === "success").length;
  const failCount = results.filter((r) => r.status === "failed").length;
  const dupCount = results.filter((r) => r.status === "duplicate").length;

  const stepLabels =
    mode === "search"
      ? [
          { key: "input", label: "1. Ara" },
          { key: "preview", label: "2. Urun Sec" },
          { key: "importing", label: "3. Aktariliyor" },
          { key: "result", label: "4. Sonuc" },
        ]
      : [
          { key: "input", label: "1. URL Gir" },
          { key: "preview", label: "2. Onizle" },
          { key: "importing", label: "3. Aktariliyor" },
          { key: "result", label: "4. Sonuc" },
        ];

  return (
    <div className="max-w-5xl">
      {/* Adim gostergesi */}
      <div className="flex items-center gap-2 mb-8">
        {stepLabels.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === s.key
                  ? "bg-primary text-white"
                  : ["input", "preview", "importing", "result"].indexOf(step) >
                      ["input", "preview", "importing", "result"].indexOf(
                        s.key
                      )
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm hidden sm:inline ${step === s.key ? "font-semibold text-foreground" : "text-muted-foreground"}`}
            >
              {s.label}
            </span>
            {i < 3 && (
              <div className="w-8 h-0.5 bg-gray-200 hidden sm:block" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Input */}
      {step === "input" && (
        <div className="bg-card border border-border rounded-xl p-8">
          {/* Mod secimi */}
          <div className="flex gap-1 bg-muted p-1 rounded-lg mb-6">
            <button
              onClick={() => setMode("search")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === "search"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Marka / Kategori Ara
            </button>
            <button
              onClick={() => setMode("urls")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === "urls"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tekil Urun Linkleri
            </button>
          </div>

          {mode === "search" ? (
            <>
              <h2 className="text-lg font-bold mb-2">
                Trendyol&apos;dan Urun Ara
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Marka adi, anahtar kelime yazin veya bir Trendyol linkini yapistirin.
              </p>

              <div className="relative">
                <input
                  type="text"
                  value={searchUrl}
                  onChange={(e) => setSearchUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchUrl.trim()) {
                      e.preventDefault();
                      handleFetchProducts();
                    }
                  }}
                  placeholder="Marka adi veya Trendyol linki (orn: nike, adidas, https://www.trendyol.com/sr?q=ayakkabi)"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                Ornekler: <strong>nike</strong>, <strong>adidas</strong> veya{" "}
                <strong>https://www.trendyol.com/sr?q=spor+ayakkabi</strong>
              </p>

              {/* Populer Kategoriler */}
              <div className="mt-5">
                <p className="text-sm font-medium text-foreground mb-2">
                  Populer Kategoriler
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Kadin Elbise", url: "https://www.trendyol.com/kadin-elbise-x-c56" },
                    { label: "Erkek Tisort", url: "https://www.trendyol.com/erkek-t-shirt-x-c1020" },
                    { label: "Kadin Tisort", url: "https://www.trendyol.com/kadin-t-shirt-x-c1049" },
                    { label: "Erkek Spor Ayakkabi", url: "https://www.trendyol.com/erkek-spor-ayakkabi-x-c114" },
                    { label: "Kadin Spor Ayakkabi", url: "https://www.trendyol.com/kadin-spor-ayakkabi-x-c110" },
                    { label: "Kadin Canta", url: "https://www.trendyol.com/kadin-omuz-cantasi-x-c106" },
                    { label: "Erkek Gomlek", url: "https://www.trendyol.com/erkek-gomlek-x-c1021" },
                    { label: "Kadin Pantolon", url: "https://www.trendyol.com/kadin-pantolon-x-c70" },
                    { label: "Erkek Esofman", url: "https://www.trendyol.com/erkek-esofman-alti-x-c1047" },
                    { label: "Kadin Etek", url: "https://www.trendyol.com/kadin-etek-x-c55" },
                  ].map((cat) => (
                    <button
                      key={cat.url}
                      onClick={() => handleFetchProducts(cat.url)}
                      disabled={searchLoading}
                      className="px-3 py-1.5 text-xs font-medium rounded-full border border-border hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Populer Markalar */}
              <div className="mt-4">
                <p className="text-sm font-medium text-foreground mb-2">
                  Populer Markalar
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Nike", url: "https://www.trendyol.com/nike" },
                    { label: "Adidas", url: "https://www.trendyol.com/adidas" },
                    { label: "Puma", url: "https://www.trendyol.com/puma" },
                    { label: "New Balance", url: "https://www.trendyol.com/new-balance" },
                    { label: "DeFacto", url: "https://www.trendyol.com/defacto" },
                    { label: "LC Waikiki", url: "https://www.trendyol.com/lc-waikiki" },
                    { label: "Mavi", url: "https://www.trendyol.com/mavi" },
                    { label: "Zara", url: "https://www.trendyol.com/zara" },
                    { label: "H&M", url: "https://www.trendyol.com/h-m--hm-" },
                    { label: "Trendyolmilla", url: "https://www.trendyol.com/trendyolmilla" },
                  ].map((brand) => (
                    <button
                      key={brand.url}
                      onClick={() => handleFetchProducts(brand.url)}
                      disabled={searchLoading}
                      className="px-3 py-1.5 text-xs font-medium rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
                    >
                      {brand.label}
                    </button>
                  ))}
                </div>
              </div>

              {searchError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600">{searchError}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold mb-2">
                Trendyol Urun Linkleri
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Aktarmak istediginiz Trendyol urun linklerini asagiya
                yapistirin. Her satira bir link yazin.
              </p>

              <textarea
                value={urlText}
                onChange={(e) => setUrlText(e.target.value)}
                placeholder={`https://www.trendyol.com/marka/urun-adi-p-123456789\nhttps://www.trendyol.com/marka/diger-urun-p-987654321`}
                rows={8}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </>
          )}

          {/* Kategori secimi — her iki mod icin de ortak */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-1">
                Kategori (opsiyonel)
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
              >
                <option value="">Kategori seciniz...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            {mode === "search" ? (
              <button
                onClick={() => handleFetchProducts()}
                disabled={!searchUrl.trim() || searchLoading}
                className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
              >
                {searchLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Yukleniyor...
                  </span>
                ) : (
                  "Urunleri Getir"
                )}
              </button>
            ) : (
              <button
                onClick={handleParseUrls}
                disabled={!urlText.trim()}
                className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
              >
                Devam Et
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Preview — URL Modu */}
      {step === "preview" && mode === "urls" && (
        <div className="bg-card border border-border rounded-xl p-8">
          <h2 className="text-lg font-bold mb-4">URL Kontrolu</h2>

          <div className="flex gap-4 mb-4">
            <span className="text-sm text-green-600 font-medium">
              {validCount} gecerli
            </span>
            {invalidCount > 0 && (
              <span className="text-sm text-red-600 font-medium">
                {invalidCount} gecersiz
              </span>
            )}
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">#</th>
                  <th className="text-left px-4 py-2 font-medium">URL</th>
                  <th className="text-left px-4 py-2 font-medium">
                    Content ID
                  </th>
                  <th className="text-left px-4 py-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {parsedUrls.map((p, i) => (
                  <tr
                    key={i}
                    className={`border-t border-border ${!p.valid ? "bg-red-50 dark:bg-red-900/10" : ""}`}
                  >
                    <td className="px-4 py-2 text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs max-w-md truncate">
                      {p.url}
                    </td>
                    <td className="px-4 py-2 font-mono">
                      {p.contentId || "-"}
                    </td>
                    <td className="px-4 py-2">
                      {p.valid ? (
                        <span className="text-green-600 font-medium">
                          Gecerli
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">
                          Gecersiz
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setStep("input")}
              className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted"
            >
              Geri
            </button>
            <button
              onClick={handleStartUrlImport}
              disabled={validCount === 0}
              className="flex-1 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
            >
              Aktarimi Baslat ({validCount} urun)
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preview — Arama Modu */}
      {step === "preview" && mode === "search" && (
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">Urun Secimi</h2>
              <p className="text-sm text-muted-foreground">
                {totalCount} urun bulundu — Sayfa {currentPage}/{totalPages}
              </p>
            </div>
            <button
              onClick={toggleAll}
              className="text-sm text-primary hover:underline"
            >
              {listProducts.every((p) => selectedIds.has(p.id))
                ? "Bu Sayfanin Secimini Kaldir"
                : "Bu Sayfanin Tumunu Sec"}
            </button>
          </div>

          <div className="text-sm text-muted-foreground mb-4">
            Toplam {selectedIds.size} urun secildi
            {totalPages > 1 && " (tum sayfalar)"}
          </div>

          {/* Urun listesi — grid */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
            {pageLoading && (
              <div className="absolute inset-0 bg-background/60 z-10 flex items-center justify-center rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                  Sayfa yukleniyor...
                </div>
              </div>
            )}
            {listProducts.map((p) => (
              <label
                key={p.id}
                className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedIds.has(p.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(p.id)}
                  onChange={() => toggleProduct(p.id)}
                  className="mt-1 shrink-0"
                />
                <div className="flex gap-3 min-w-0 flex-1">
                  {p.image && (
                    <Image
                      src={p.image}
                      alt={p.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover rounded-md shrink-0"
                      unoptimized
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium line-clamp-2 leading-tight">
                      {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.brand}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-foreground">
                        {p.price.current.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        TL
                      </span>
                      {p.price.original &&
                        p.price.original > p.price.current && (
                          <span className="text-xs text-muted-foreground line-through">
                            {p.price.original.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        )}
                    </div>
                    {p.ratingScore && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.ratingScore.averageRating.toFixed(1)} ({p.ratingScore.totalCount})
                      </p>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Sayfalama */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || pageLoading}
                className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Onceki
              </button>

              <div className="flex items-center gap-1">
                {Array.from(
                  { length: maxLoadedPage + (pageOffsets.has(maxLoadedPage + 1) ? 1 : 0) },
                  (_, i) => i + 1
                )
                  .filter(
                    (p) =>
                      p >= currentPage - 2 &&
                      p <= currentPage + 2
                  )
                  .map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      disabled={pageLoading || p === currentPage}
                      className={`w-9 h-9 rounded-lg text-sm font-medium ${
                        p === currentPage
                          ? "bg-primary text-white"
                          : "border border-border hover:bg-muted"
                      } disabled:cursor-not-allowed`}
                    >
                      {p}
                    </button>
                  ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={
                  currentPage >= totalPages ||
                  pageLoading ||
                  (!pageProducts.has(currentPage + 1) &&
                    !pageOffsets.has(currentPage + 1))
                }
                className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sonraki
              </button>
            </div>
          )}

          {searchError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600">{searchError}</p>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setStep("input");
                setListProducts([]);
                setSelectedIds(new Set());
                setProductMap(new Map());
                setCurrentPage(1);
                setTotalPages(1);
                setPageOffsets(new Map());
                setPageProducts(new Map());
                setMaxLoadedPage(1);
              }}
              className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted"
            >
              Geri
            </button>
            <button
              onClick={handleStartSearchImport}
              disabled={selectedIds.size === 0}
              className="flex-1 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
            >
              Aktarimi Baslat ({selectedIds.size} urun)
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Aktariliyor */}
      {step === "importing" && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <h2 className="text-lg font-bold mb-4">Urunler Aktariliyor...</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Trendyol&apos;dan urun bilgileri ve gorseller indiriliyor. Bu islem
            birka&ccedil; dakika surebilir.
          </p>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(progress, 10)}%` }}
            />
          </div>

          {currentUrl && (
            <p className="text-xs text-muted-foreground font-mono truncate">
              {currentUrl}
            </p>
          )}

          <div className="mt-8 flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      )}

      {/* Step 4: Sonuc */}
      {step === "result" && (
        <div className="bg-card border border-border rounded-xl p-8">
          <h2 className="text-lg font-bold mb-4">Aktarim Sonucu</h2>

          {/* Ozet */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {successCount}
              </p>
              <p className="text-sm text-green-600">Basarili</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{dupCount}</p>
              <p className="text-sm text-amber-600">Mevcut</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{failCount}</p>
              <p className="text-sm text-red-600">Basarisiz</p>
            </div>
          </div>

          {/* Detay */}
          <div className="space-y-2">
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  r.status === "success"
                    ? "border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800"
                    : r.status === "duplicate"
                      ? "border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800"
                      : "border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {r.productName || r.url || "Bilinmeyen"}
                  </p>
                  {r.error && (
                    <p className="text-xs text-red-600 mt-0.5">{r.error}</p>
                  )}
                  {r.contentId && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ID: {r.contentId}
                    </p>
                  )}
                </div>
                <div className="ml-3 flex items-center gap-2">
                  {r.status === "success" && (
                    <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                      Eklendi
                    </span>
                  )}
                  {r.status === "duplicate" && (
                    <span className="text-xs font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                      Mevcut
                    </span>
                  )}
                  {r.status === "failed" && (
                    <span className="text-xs font-medium text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                      Hata
                    </span>
                  )}
                  {r.productId && (
                    <Link
                      href={`/admin/urunler/${r.productId}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Duzenle
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <Link
              href="/admin/urunler"
              className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-center hover:bg-muted"
            >
              Urun Listesine Don
            </Link>
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
            >
              Yeni Aktarim
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
