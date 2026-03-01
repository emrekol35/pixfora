"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Variant {
  name: string;
  description: string;
  isControl: boolean;
  trafficWeight: number;
  config: string;
}

const TEST_TYPES = [
  { value: "UI_VARIANT", label: "UI Varyant" },
  { value: "FEATURE_FLAG", label: "Ozellik Flagi" },
  { value: "CONTENT", label: "Icerik" },
  { value: "LAYOUT", label: "Yerlesim" },
];

const TARGET_PAGES = [
  { value: "", label: "Secin..." },
  { value: "/anasayfa", label: "Anasayfa" },
  { value: "/urun", label: "Urun Sayfasi" },
  { value: "/sepet", label: "Sepet" },
  { value: "/odeme", label: "Odeme" },
  { value: "*", label: "Tumu" },
];

function createDefaultVariant(isControl: boolean, index: number): Variant {
  return {
    name: isControl ? "Kontrol" : `Varyant ${index}`,
    description: "",
    isControl,
    trafficWeight: 50,
    config: "{}",
  };
}

export default function NewABTestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [testType, setTestType] = useState("UI_VARIANT");
  const [targetPage, setTargetPage] = useState("");
  const [trafficPercent, setTrafficPercent] = useState(100);

  const [variants, setVariants] = useState<Variant[]>([
    createDefaultVariant(true, 0),
    createDefaultVariant(false, 1),
  ]);

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      createDefaultVariant(false, prev.length),
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 2) {
      alert("En az 2 varyant gereklidir.");
      return;
    }
    setVariants((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Eger kontrol grubu silindiyse ilkini kontrol yap
      if (!updated.some((v) => v.isControl) && updated.length > 0) {
        updated[0].isControl = true;
      }
      return updated;
    });
  };

  const updateVariant = (
    index: number,
    field: keyof Variant,
    value: string | number | boolean
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== index) {
          // Eger kontrol grubu degisiyorsa, digerlerini kapat
          if (field === "isControl" && value === true) {
            return { ...v, isControl: false };
          }
          return v;
        }
        return { ...v, [field]: value };
      })
    );
  };

  const validate = (): string | null => {
    if (!name.trim()) return "Test adi zorunludur.";
    if (variants.length < 2) return "En az 2 varyant gereklidir.";
    for (let i = 0; i < variants.length; i++) {
      if (!variants[i].name.trim()) {
        return `Varyant ${i + 1} icin isim zorunludur.`;
      }
    }
    if (!variants.some((v) => v.isControl)) {
      return "En az bir kontrol grubu secilmelidir.";
    }
    const totalWeight = variants.reduce(
      (sum, v) => sum + v.trafficWeight,
      0
    );
    if (totalWeight !== 100) {
      return `Varyant agirliklari toplami 100 olmali (su an: ${totalWeight}). Devam etmek istiyor musunuz?`;
    }
    // Config JSON gecerliligi
    for (let i = 0; i < variants.length; i++) {
      if (variants[i].config.trim()) {
        try {
          JSON.parse(variants[i].config);
        } catch {
          return `Varyant ${i + 1} icin gecersiz JSON konfigurasyon.`;
        }
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      // Eger agirlik uyarisi ise confirm ile sor
      if (validationError.includes("Devam etmek istiyor musunuz?")) {
        const confirmed = window.confirm(validationError);
        if (!confirmed) return;
      } else {
        setError(validationError);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        testType,
        targetPage: targetPage || null,
        trafficPercent,
        variants: variants.map((v) => ({
          name: v.name.trim(),
          isControl: v.isControl,
          trafficWeight: v.trafficWeight,
          config: v.config.trim() ? JSON.parse(v.config) : {},
        })),
      };

      const res = await fetch("/api/admin/ab-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Test olusturulamadi");
      }

      router.push("/admin/ab-testleri");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Test olusturulurken hata olustu"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/ab-testleri"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Geri
        </Link>
        <h1 className="text-2xl font-bold">Yeni A/B Test Olustur</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Temel Bilgiler */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Temel Bilgiler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Test Adi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="orn. Anasayfa Banner Testi"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Test Turu
              </label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TEST_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Hedef Sayfa
              </label>
              <select
                value={targetPage}
                onChange={(e) => setTargetPage(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TARGET_PAGES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Traffic Yuzdesi: %{trafficPercent}
              </label>
              <input
                type="range"
                min={1}
                max={100}
                value={trafficPercent}
                onChange={(e) => setTrafficPercent(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>%1</span>
                <span>%50</span>
                <span>%100</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                Aciklama
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Test hakkinda aciklama (istege bagli)"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>
        </div>

        {/* Varyant Yonetimi */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Varyant Yonetimi</h2>
            <button
              type="button"
              onClick={addVariant}
              className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              + Varyant Ekle
            </button>
          </div>

          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${
                  variant.isControl
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {variant.isControl
                        ? "Kontrol Grubu"
                        : `Varyant ${index}`}
                    </span>
                    {variant.isControl && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Kontrol
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="text-red-500 hover:text-red-700 text-sm transition-colors"
                  >
                    Sil
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Isim <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={variant.name}
                      onChange={(e) =>
                        updateVariant(index, "name", e.target.value)
                      }
                      placeholder="Varyant ismi"
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Aciklama
                    </label>
                    <input
                      type="text"
                      value={variant.description}
                      onChange={(e) =>
                        updateVariant(index, "description", e.target.value)
                      }
                      placeholder="Varyant aciklamasi"
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Agirlik (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={variant.trafficWeight}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "trafficWeight",
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={variant.isControl}
                        onChange={(e) =>
                          updateVariant(index, "isControl", e.target.checked)
                        }
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">
                        Kontrol Grubu
                      </span>
                    </label>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Konfigurasyon (JSON)
                  </label>
                  <textarea
                    value={variant.config}
                    onChange={(e) =>
                      updateVariant(index, "config", e.target.value)
                    }
                    rows={2}
                    placeholder='{"buttonColor": "#ff0000"}'
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Agirlik Toplam Gostergesi */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Toplam agirlik:
            </span>
            <span
              className={`text-sm font-medium ${
                variants.reduce((sum, v) => sum + v.trafficWeight, 0) === 100
                  ? "text-green-600"
                  : "text-yellow-600"
              }`}
            >
              %{variants.reduce((sum, v) => sum + v.trafficWeight, 0)}
            </span>
            {variants.reduce((sum, v) => sum + v.trafficWeight, 0) !== 100 && (
              <span className="text-xs text-yellow-600">
                (100 olmasi onerilir)
              </span>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Olusturuluyor..." : "Test Olustur"}
          </button>
          <Link
            href="/admin/ab-testleri"
            className="px-6 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Iptal
          </Link>
        </div>
      </form>
    </div>
  );
}
