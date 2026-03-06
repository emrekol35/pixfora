"use client";

import { useState, useCallback, useRef } from "react";
import { parseCsv, mapRowToPriceStockUpdate, downloadCsv, type PriceStockRow } from "@/lib/csv-utils";

type Step = "upload" | "preview" | "applying" | "result";

function StepLabel({ label, active, done, pulse }: { label: string; active: boolean; done: boolean; pulse?: boolean }) {
  let cls = "";
  if (active) cls = "font-bold text-blue-600";
  else if (pulse) cls = "text-yellow-600 animate-pulse";
  else if (done) cls = "text-green-600";
  return <span className={cls}>{label}</span>;
}

interface DiffItem {
  sku: string;
  barcode: string;
  name: string;
  isVariant: boolean;
  variantInfo: string;
  oldPrice: number;
  newPrice: number | null;
  oldComparePrice: number | null;
  newComparePrice: number | null;
  oldStock: number;
  newStock: number | null;
  matched: boolean;
  hasChange: boolean;
}

interface PreviewResult {
  diffs: DiffItem[];
  matchedCount: number;
  unmatchedCount: number;
  changedCount: number;
  unchangedCount: number;
}

interface ApplyResult {
  updated: number;
  errors: { sku: string; error: string }[];
  message: string;
}

export default function BulkPriceStockClient() {
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<PriceStockRow[]>([]);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ApplyResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV sablon indir
  const handleDownloadTemplate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "export-price-stock" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Export hatasi");
      }

      const csvContent = await res.text();
      const today = new Date().toISOString().slice(0, 10);
      downloadCsv(csvContent, `fiyat-stok-${today}.csv`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export hatasi");
    } finally {
      setLoading(false);
    }
  };

  // Dosya isle
  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Sadece .csv dosyalari kabul edilir.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const content = await file.text();
      const { headers, rows } = parseCsv(content);

      if (rows.length === 0) {
        throw new Error("CSV dosyasi bos veya gecersiz.");
      }

      // Parse rows
      const parsed = rows
        .map((row) => mapRowToPriceStockUpdate(row, headers))
        .filter((r) => r.sku || r.barcode); // SKU veya barkod olmayan satirlari atla

      if (parsed.length === 0) {
        throw new Error("Gecerli satir bulunamadi. SKU veya barkod kolonu gerekli.");
      }

      setParsedRows(parsed);

      // API'den onizleme al
      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "preview-price-stock",
          rows: parsed.map((r) => ({
            sku: r.sku,
            barcode: r.barcode,
            price: r.price,
            comparePrice: r.comparePrice,
            stock: r.stock,
            isVariant: r.isVariant,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Onizleme hatasi");
      }

      const previewData: PreviewResult = await res.json();
      setPreview(previewData);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dosya isleme hatasi");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  // Degisiklikleri uygula
  const handleApply = async () => {
    if (!preview) return;

    setStep("applying");
    setError(null);

    try {
      // Sadece eslesmis ve degisiklik olan satirlari gonder
      const updates = preview.diffs
        .filter((d) => d.matched && d.hasChange)
        .map((d) => ({
          sku: d.sku,
          barcode: d.barcode,
          isVariant: d.isVariant,
          price: d.newPrice !== null ? d.newPrice : undefined,
          comparePrice: d.newComparePrice !== null ? d.newComparePrice : undefined,
          stock: d.newStock !== null ? d.newStock : undefined,
        }));

      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply-price-stock", updates }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Guncelleme hatasi");
      }

      const applyResult: ApplyResult = await res.json();
      setResult(applyResult);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Guncelleme hatasi");
      setStep("preview");
    }
  };

  // Reset
  const handleReset = () => {
    setStep("upload");
    setLoading(false);
    setError(null);
    setParsedRows([]);
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Adim gostergesi */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <StepLabel label="1. Indir & Yukle" active={step === "upload"} done={step !== "upload"} />
        <span>→</span>
        <StepLabel label="2. Onizleme" active={step === "preview"} done={step === "result" || step === "applying"} />
        <span>→</span>
        <StepLabel label="3. Sonuc" active={step === "result"} done={false} pulse={step === "applying"} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* ADIM 1: Indir & Yukle */}
      {step === "upload" && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Nasil Calisir?</h3>
            <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
              <li>Asagidaki butonla mevcut urunlerinizin fiyat/stok bilgilerini CSV olarak indirin</li>
              <li>CSV dosyasini Excel&apos;de acin ve fiyat/stok degerlerini duzenleyin</li>
              <li>Duzenlenen CSV dosyasini yukleyin</li>
              <li>Degisiklikleri onizlemede kontrol edip onaylayin</li>
            </ol>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleDownloadTemplate}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <span>📥</span>
              )}
              Fiyat/Stok CSV Indir
            </button>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <div className="text-4xl mb-3">📄</div>
            <p className="text-gray-600 mb-2">
              Duzenlediginiz CSV dosyasini buraya surukleyin
            </p>
            <p className="text-gray-400 text-sm mb-4">veya</p>
            <label className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700">
              Dosya Sec
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* ADIM 2: Onizleme */}
      {step === "preview" && preview && (
        <div className="space-y-4">
          {/* Ozet */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
              <div className="text-2xl font-bold text-green-700">{preview.changedCount}</div>
              <div className="text-xs text-green-600">Guncellenecek</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center">
              <div className="text-2xl font-bold text-gray-600">{preview.unchangedCount}</div>
              <div className="text-xs text-gray-500">Degisiklik Yok</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded p-3 text-center">
              <div className="text-2xl font-bold text-red-700">{preview.unmatchedCount}</div>
              <div className="text-xs text-red-600">Eslestirilemedi</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
              <div className="text-2xl font-bold text-blue-700">{preview.matchedCount}</div>
              <div className="text-xs text-blue-600">Toplam Eslesen</div>
            </div>
          </div>

          {/* Diff tablosu */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">SKU</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Urun Adi</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Varyant</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Eski Fiyat</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Yeni Fiyat</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Eski Stok</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Yeni Stok</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.diffs.map((diff, i) => (
                  <tr
                    key={i}
                    className={
                      !diff.matched
                        ? "bg-red-50"
                        : diff.hasChange
                          ? "bg-yellow-50"
                          : "opacity-50"
                    }
                  >
                    <td className="px-3 py-2 font-mono text-xs">{diff.sku || diff.barcode}</td>
                    <td className="px-3 py-2 max-w-[200px] truncate">{diff.name || "-"}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {diff.isVariant ? diff.variantInfo : "-"}
                    </td>
                    <td className="px-3 py-2 text-right">{diff.matched ? `${diff.oldPrice.toFixed(2)} TL` : "-"}</td>
                    <td className="px-3 py-2 text-right">
                      {diff.newPrice !== null ? (
                        <span
                          className={
                            diff.matched && diff.newPrice > diff.oldPrice
                              ? "text-green-600 font-medium"
                              : diff.matched && diff.newPrice < diff.oldPrice
                                ? "text-red-600 font-medium"
                                : ""
                          }
                        >
                          {diff.newPrice.toFixed(2)} TL
                          {diff.matched && diff.newPrice !== diff.oldPrice && (
                            <span className="text-xs ml-1">
                              ({diff.newPrice > diff.oldPrice ? "+" : ""}
                              {(diff.newPrice - diff.oldPrice).toFixed(2)})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">{diff.matched ? diff.oldStock : "-"}</td>
                    <td className="px-3 py-2 text-right">
                      {diff.newStock !== null ? (
                        <span
                          className={
                            diff.matched && diff.newStock !== diff.oldStock
                              ? "font-medium text-blue-600"
                              : ""
                          }
                        >
                          {diff.newStock}
                          {diff.matched && diff.newStock !== diff.oldStock && (
                            <span className="text-xs ml-1">
                              ({diff.newStock > diff.oldStock ? "+" : ""}
                              {diff.newStock - diff.oldStock})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {!diff.matched ? (
                        <span className="text-xs text-red-600 font-medium">Bulunamadi</span>
                      ) : diff.hasChange ? (
                        <span className="text-xs text-yellow-600 font-medium">Degisecek</span>
                      ) : (
                        <span className="text-xs text-gray-400">Ayni</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Butonlar */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Iptal
            </button>
            <button
              onClick={handleApply}
              disabled={preview.changedCount === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {preview.changedCount} Degisikligi Uygula
            </button>
          </div>
        </div>
      )}

      {/* ADIM 2.5: Uygulanıyor */}
      {step === "applying" && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p className="text-gray-600">Degisiklikler uygulanıyor...</p>
        </div>
      )}

      {/* ADIM 3: Sonuc */}
      {step === "result" && result && (
        <div className="space-y-4">
          <div className={`text-center py-8 rounded-lg ${result.errors.length === 0 ? "bg-green-50" : "bg-yellow-50"}`}>
            <div className="text-5xl mb-3">{result.errors.length === 0 ? "✅" : "⚠️"}</div>
            <h3 className="text-lg font-semibold mb-2">
              {result.updated} kayit basariyla guncellendi
            </h3>
            {result.errors.length > 0 && (
              <p className="text-red-600">{result.errors.length} hata olustu</p>
            )}
          </div>

          {result.errors.length > 0 && (
            <div className="border border-red-200 rounded-lg overflow-hidden">
              <div className="bg-red-50 px-4 py-2 font-medium text-red-700">Hatalar</div>
              <div className="divide-y divide-red-100">
                {result.errors.map((err, i) => (
                  <div key={i} className="px-4 py-2 text-sm">
                    <span className="font-mono text-red-600">{err.sku}</span>
                    <span className="text-gray-500 ml-2">{err.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Yeni Guncelleme
            </button>
            <a
              href="/admin/urunler"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
            >
              Urun Listesine Don
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
