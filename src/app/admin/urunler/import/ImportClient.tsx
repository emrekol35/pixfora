"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  parseCsv,
  mapRowToProduct,
  generateTemplate,
  downloadCsv,
} from "@/lib/csv-utils";

interface ParsedRow {
  rowNumber: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  errors: string[];
}

type Step = "upload" | "preview" | "importing" | "result";

export default function ImportClient() {
  const [step, setStep] = useState<Step>("upload");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    errorCount: number;
    errors: string[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sablon indir
  function handleDownloadTemplate() {
    const csv = generateTemplate();
    downloadCsv(csv, "urun-sablonu.csv");
  }

  // Dosya yukle ve parse et
  async function handleFileSelect(file: File) {
    const text = await file.text();
    const { headers, rows } = parseCsv(text);

    if (headers.length === 0 || rows.length === 0) {
      alert("CSV dosyasi bos veya gecersiz.");
      return;
    }

    // Satirlari parse et
    const parsed: ParsedRow[] = rows.map((row, index) => ({
      rowNumber: index + 2,
      data: mapRowToProduct(row, headers),
      errors: [],
    }));

    // Dogrulama
    await validateRows(parsed);

    setParsedRows(parsed);
    setStep("preview");
  }

  async function validateRows(rows: ParsedRow[]) {
    // Kategori ve marka verilerini getir
    let categoryMap = new Map<string, string>();
    let brandMap = new Map<string, string>();

    try {
      const [catRes, brandRes] = await Promise.all([
        fetch("/api/categories?flat=true"),
        fetch("/api/brands"),
      ]);
      if (catRes.ok) {
        const cats = await catRes.json();
        categoryMap = new Map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (cats || []).map((c: any) => [c.name.toLowerCase(), c.id])
        );
      }
      if (brandRes.ok) {
        const data = await brandRes.json();
        const brands = data.brands || data || [];
        brandMap = new Map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          brands.map((b: any) => [b.name.toLowerCase(), b.id])
        );
      }
    } catch {
      // devam et, eslestirme olmadan
    }

    // SKU tekrar kontrolu
    const skuCount = new Map<string, number>();
    rows.forEach((row) => {
      const sku = row.data.sku;
      if (sku) skuCount.set(sku, (skuCount.get(sku) || 0) + 1);
    });

    for (const row of rows) {
      const errors: string[] = [];

      // Zorunlu alanlar
      if (!row.data.name?.trim()) errors.push("Urun adi zorunludur");
      if (row.data.price === undefined || row.data.price === null || isNaN(row.data.price))
        errors.push("Fiyat zorunludur ve sayi olmalidir");
      else if (row.data.price < 0)
        errors.push("Fiyat negatif olamaz");

      // Stok kontrolu
      if (row.data.stock !== undefined && isNaN(Number(row.data.stock)))
        errors.push("Stok gecerli bir sayi olmalidir");

      // Kategori eslestirme
      if (row.data.categoryName) {
        const catId = categoryMap.get(row.data.categoryName.toLowerCase());
        if (!catId) errors.push(`Kategori bulunamadi: "${row.data.categoryName}"`);
        else row.data.categoryId = catId;
      }

      // Marka eslestirme
      if (row.data.brandName) {
        const bId = brandMap.get(row.data.brandName.toLowerCase());
        if (!bId) errors.push(`Marka bulunamadi: "${row.data.brandName}"`);
        else row.data.brandId = bId;
      }

      // SKU tekrar
      if (row.data.sku && (skuCount.get(row.data.sku) || 0) > 1)
        errors.push(`SKU dosya icinde tekrar ediyor: "${row.data.sku}"`);

      row.errors = errors;
    }
  }

  // Import islemini baslat
  async function handleImport() {
    setStep("importing");
    setProgress(0);

    const validRows = parsedRows.filter((r) => r.errors.length === 0);
    const BATCH_SIZE = 50;
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);

      try {
        const res = await fetch("/api/products/bulk/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ products: batch.map((r) => r.data) }),
        });

        const result = await res.json();
        successCount += result.created || 0;
        if (result.errors) {
          errorCount += result.errors.length;
          errors.push(...result.errors);
        }
      } catch {
        errorCount += batch.length;
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1} hatasi`);
      }

      setProgress(
        Math.min(100, Math.round(((i + batch.length) / validRows.length) * 100))
      );
    }

    setImportResult({ successCount, errorCount, errors });
    setStep("result");
  }

  const validCount = parsedRows.filter((r) => r.errors.length === 0).length;
  const errorRowCount = parsedRows.filter((r) => r.errors.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Adim Gostergesi */}
      <div className="flex items-center gap-2 text-sm">
        {(["upload", "preview", "importing", "result"] as Step[]).map(
          (s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <span className="text-muted-foreground">→</span>}
              <span
                className={
                  step === s
                    ? "font-medium text-primary"
                    : "text-muted-foreground"
                }
              >
                {s === "upload"
                  ? "1. Yukle"
                  : s === "preview"
                  ? "2. Onizle"
                  : s === "importing"
                  ? "3. Aktariliyor"
                  : "4. Sonuc"}
              </span>
            </div>
          )
        )}
      </div>

      {/* Adim 1: Yukle */}
      {step === "upload" && (
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="text-center">
            <div
              className="border-2 border-dashed border-border rounded-xl p-12 mb-6 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("border-primary");
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("border-primary");
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-primary");
                const file = e.dataTransfer.files[0];
                if (file && file.name.endsWith(".csv")) handleFileSelect(file);
                else alert("Lutfen bir CSV dosyasi secin.");
              }}
            >
              <div className="text-4xl mb-3">📄</div>
              <p className="text-sm text-muted-foreground mb-2">
                CSV dosyasini surukleyip birakin veya tiklayin
              </p>
              <p className="text-xs text-muted-foreground">
                Yalnizca .csv dosyalari kabul edilir. Noktali virgul (;) ayirici kullanin.
              </p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />

            <div className="flex justify-center gap-3">
              <button
                onClick={handleDownloadTemplate}
                className="px-4 py-2 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Sablon Indir
              </button>
              <Link
                href="/admin/urunler"
                className="px-4 py-2 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Geri Don
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Adim 2: Onizle */}
      {step === "preview" && (
        <>
          {/* Ozet */}
          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">{parsedRows.length}</span> satirdan{" "}
              <span className="text-green-600 font-medium">{validCount}</span>{" "}
              gecerli,{" "}
              <span className="text-red-500 font-medium">{errorRowCount}</span>{" "}
              hatali
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep("upload");
                  setParsedRows([]);
                }}
                className="px-4 py-2 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Geri
              </button>
              <button
                onClick={handleImport}
                disabled={validCount === 0}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {validCount > 0
                  ? `${validCount} Urunu Ice Aktar`
                  : "Gecerli Satir Yok"}
              </button>
            </div>
          </div>

          {/* Onizleme Tablosu */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted z-10">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">
                      #
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Urun Adi
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Fiyat
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                      Stok
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Kategori
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Durum
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={`border-b border-border ${
                        row.errors.length > 0
                          ? "bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-500"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-2 text-muted-foreground">
                        {row.rowNumber}
                      </td>
                      <td className="px-4 py-2 font-medium">
                        {row.data.name || "-"}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {row.data.sku || "-"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {row.data.price != null && !isNaN(row.data.price)
                          ? row.data.price.toFixed(2)
                          : "-"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {row.data.stock ?? 0}
                      </td>
                      <td className="px-4 py-2">
                        {row.data.categoryName || "-"}
                      </td>
                      <td className="px-4 py-2">
                        {row.errors.length > 0 ? (
                          <div className="text-red-500 text-xs">
                            {row.errors.map((err, i) => (
                              <div key={i}>{err}</div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-green-600 text-xs font-medium">
                            Gecerli
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Adim 3: Aktariliyor */}
      {step === "importing" && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-lg font-semibold mb-4">Urunler Aktariliyor...</h2>
          <div className="w-full max-w-md mx-auto bg-muted rounded-full h-3 mb-2">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">%{progress}</p>
        </div>
      )}

      {/* Adim 4: Sonuc */}
      {step === "result" && importResult && (
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">
              {importResult.errorCount === 0 ? "✅" : "⚠️"}
            </div>
            <h2 className="text-lg font-semibold mb-2">Aktarim Tamamlandi</h2>
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <span className="text-green-600 text-2xl font-bold">
                  {importResult.successCount}
                </span>
                <p className="text-muted-foreground">Basarili</p>
              </div>
              <div>
                <span className="text-red-500 text-2xl font-bold">
                  {importResult.errorCount}
                </span>
                <p className="text-muted-foreground">Hatali</p>
              </div>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
              <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                Hatalar:
              </p>
              {importResult.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-600 dark:text-red-300">
                  {err}
                </p>
              ))}
            </div>
          )}

          <div className="flex justify-center gap-3">
            <Link
              href="/admin/urunler"
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Urun Listesine Don
            </Link>
            <button
              onClick={() => {
                setStep("upload");
                setParsedRows([]);
                setImportResult(null);
              }}
              className="px-4 py-2 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              Yeni Aktarim
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
