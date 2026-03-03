"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

type Step = "input" | "preview" | "importing" | "result";

function parseContentId(url: string): string | null {
  const trimmed = url.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/-p-(\d+)/);
  return match ? match[1] : null;
}

export default function TrendyolImportClient() {
  const [step, setStep] = useState<Step>("input");
  const [urlText, setUrlText] = useState("");
  const [parsedUrls, setParsedUrls] = useState<ParsedUrl[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentUrl, setCurrentUrl] = useState("");

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

  // URL'leri parse et
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

  // Import baslat
  async function handleStartImport() {
    const validUrls = parsedUrls.filter((p) => p.valid).map((p) => p.url);
    if (validUrls.length === 0) return;

    setStep("importing");
    setProgress(0);
    setResults([]);

    try {
      // Tek seferde gonder — backend sirayla isler
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

  // Yeniden basla
  function handleReset() {
    setStep("input");
    setUrlText("");
    setParsedUrls([]);
    setResults([]);
    setProgress(0);
    setCurrentUrl("");
  }

  const validCount = parsedUrls.filter((p) => p.valid).length;
  const invalidCount = parsedUrls.filter((p) => !p.valid).length;

  const successCount = results.filter((r) => r.status === "success").length;
  const failCount = results.filter((r) => r.status === "failed").length;
  const dupCount = results.filter((r) => r.status === "duplicate").length;

  return (
    <div className="max-w-4xl">
      {/* Adim gostergesi */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { key: "input", label: "1. URL Gir" },
          { key: "preview", label: "2. Onizle" },
          { key: "importing", label: "3. Aktariliyor" },
          { key: "result", label: "4. Sonuc" },
        ].map((s, i) => (
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

      {/* Step 1: URL Gir */}
      {step === "input" && (
        <div className="bg-card border border-border rounded-xl p-8">
          <h2 className="text-lg font-bold mb-2">Trendyol Urun Linkleri</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Aktarmak istediginiz Trendyol urun linklerini asagiya yapistirin. Her satira bir link yazin.
          </p>

          <textarea
            value={urlText}
            onChange={(e) => setUrlText(e.target.value)}
            placeholder={`https://www.trendyol.com/marka/urun-adi-p-123456789\nhttps://www.trendyol.com/marka/diger-urun-p-987654321`}
            rows={8}
            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
          />

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
            <button
              onClick={handleParseUrls}
              disabled={!urlText.trim()}
              className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
            >
              Devam Et
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Onizle */}
      {step === "preview" && (
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
                  <th className="text-left px-4 py-2 font-medium">Content ID</th>
                  <th className="text-left px-4 py-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {parsedUrls.map((p, i) => (
                  <tr
                    key={i}
                    className={`border-t border-border ${!p.valid ? "bg-red-50 dark:bg-red-900/10" : ""}`}
                  >
                    <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2 font-mono text-xs max-w-md truncate">
                      {p.url}
                    </td>
                    <td className="px-4 py-2 font-mono">
                      {p.contentId || "-"}
                    </td>
                    <td className="px-4 py-2">
                      {p.valid ? (
                        <span className="text-green-600 font-medium">Gecerli</span>
                      ) : (
                        <span className="text-red-600 font-medium">Gecersiz</span>
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
              onClick={handleStartImport}
              disabled={validCount === 0}
              className="flex-1 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
            >
              Aktarimi Baslat ({validCount} urun)
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Aktariliyor */}
      {step === "importing" && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <h2 className="text-lg font-bold mb-4">Urunler Aktariliyor...</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Trendyol&apos;dan urun bilgileri ve gorseller indiriliyor. Bu islem birka dakika surebilir.
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
