"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface VariantData {
  id?: string;
  name: string;
  description: string;
  isControl: boolean;
  trafficWeight: number;
  config: string;
}

interface ABTestDetail {
  id: string;
  name: string;
  description: string | null;
  testType: string;
  targetPage: string | null;
  trafficPercent: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  uniqueVisitors: number;
  variants: Array<{
    id: string;
    name: string;
    isControl: boolean;
    config: unknown;
    trafficWeight: number;
    _count: { assignments: number };
  }>;
  _count: { assignments: number };
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  DRAFT: {
    label: "Taslak",
    className: "bg-gray-100 text-gray-700 border-gray-300",
  },
  RUNNING: {
    label: "Calisiyor",
    className: "bg-green-100 text-green-700 border-green-300",
  },
  PAUSED: {
    label: "Duraklatildi",
    className: "bg-yellow-100 text-yellow-700 border-yellow-300",
  },
  COMPLETED: {
    label: "Tamamlandi",
    className: "bg-blue-100 text-blue-700 border-blue-300",
  },
};

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

function createDefaultVariant(isControl: boolean, index: number): VariantData {
  return {
    name: isControl ? "Kontrol" : `Varyant ${index}`,
    description: "",
    isControl,
    trafficWeight: 50,
    config: "{}",
  };
}

export default function ABTestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;

  const [test, setTest] = useState<ABTestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [testType, setTestType] = useState("UI_VARIANT");
  const [targetPage, setTargetPage] = useState("");
  const [trafficPercent, setTrafficPercent] = useState(100);
  const [variants, setVariants] = useState<VariantData[]>([]);

  const fetchTest = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/ab-tests/${testId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Test bulunamadi");
        }
        throw new Error("Test yuklenemedi");
      }
      const data: ABTestDetail = await res.json();
      setTest(data);

      // Form alanlarini doldur
      setName(data.name);
      setDescription(data.description || "");
      setTestType(data.testType);
      setTargetPage(data.targetPage || "");
      setTrafficPercent(data.trafficPercent);
      setVariants(
        data.variants.map((v) => ({
          id: v.id,
          name: v.name,
          description: "",
          isControl: v.isControl,
          trafficWeight: v.trafficWeight,
          config: JSON.stringify(v.config || {}, null, 2),
        }))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Bilinmeyen bir hata olustu"
      );
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchTest();
  }, [fetchTest]);

  const isEditable = test?.status === "DRAFT" || test?.status === "PAUSED";

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
      if (!updated.some((v) => v.isControl) && updated.length > 0) {
        updated[0].isControl = true;
      }
      return updated;
    });
  };

  const updateVariant = (
    index: number,
    field: keyof VariantData,
    value: string | number | boolean
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== index) {
          if (field === "isControl" && value === true) {
            return { ...v, isControl: false };
          }
          return v;
        }
        return { ...v, [field]: value };
      })
    );
  };

  const handleStatusChange = async (newStatus: string) => {
    if (actionLoading) return;
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/ab-tests/${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Durum guncellenemedi");
      }
      await fetchTest();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Durum guncellenirken hata olustu"
      );
    } finally {
      setActionLoading(false);
    }
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
      setError(validationError);
      return;
    }

    setSaving(true);
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

      const res = await fetch(`/api/admin/ab-tests/${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Test guncellenemedi");
      }

      router.push("/admin/ab-testleri");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Test guncellenirken hata olustu"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Yukleniyor...</span>
      </div>
    );
  }

  if (error && !test) {
    return (
      <div className="text-center py-20">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg inline-block">
          {error}
        </div>
        <div className="mt-4">
          <Link
            href="/admin/ab-testleri"
            className="text-primary hover:underline"
          >
            &larr; Listeye don
          </Link>
        </div>
      </div>
    );
  }

  if (!test) return null;

  const badge = STATUS_BADGE[test.status] || {
    label: test.status,
    className: "bg-gray-100 text-gray-700",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/ab-testleri"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Geri
          </Link>
          <h1 className="text-2xl font-bold">
            {isEditable ? "Testi Duzenle" : "Test Detayi"}
          </h1>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>

        {/* Status Action Buttons */}
        <div className="flex items-center gap-2">
          {actionLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          ) : (
            <>
              {test.status === "DRAFT" && (
                <button
                  onClick={() => handleStatusChange("RUNNING")}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Baslat
                </button>
              )}
              {test.status === "RUNNING" && (
                <>
                  <button
                    onClick={() => handleStatusChange("PAUSED")}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    Duraklat
                  </button>
                  <Link
                    href={`/admin/ab-testleri/${testId}/sonuclar`}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Sonuclar
                  </Link>
                </>
              )}
              {test.status === "PAUSED" && (
                <>
                  <button
                    onClick={() => handleStatusChange("RUNNING")}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Devam Et
                  </button>
                  <button
                    onClick={() => handleStatusChange("COMPLETED")}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Tamamla
                  </button>
                  <Link
                    href={`/admin/ab-testleri/${testId}/sonuclar`}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Sonuclar
                  </Link>
                </>
              )}
              {test.status === "COMPLETED" && (
                <Link
                  href={`/admin/ab-testleri/${testId}/sonuclar`}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sonuclar
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Info bar for non-editable */}
      {!isEditable && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6 text-sm">
          Bu test su anda{" "}
          <strong>
            {test.status === "RUNNING" ? "calisiyor" : "tamamlandi"}
          </strong>
          . Duzenlemek icin testi durdurun.
          {(test.status === "RUNNING" || test.status === "COMPLETED") && (
            <>
              {" "}
              <Link
                href={`/admin/ab-testleri/${testId}/sonuclar`}
                className="underline font-medium"
              >
                Sonuclari goruntuleyebilirsiniz.
              </Link>
            </>
          )}
        </div>
      )}

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
                disabled={!isEditable}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:cursor-not-allowed"
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
                disabled={!isEditable}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:cursor-not-allowed"
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
                disabled={!isEditable}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:cursor-not-allowed"
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
                disabled={!isEditable}
                className="w-full accent-primary disabled:opacity-50"
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
                disabled={!isEditable}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:bg-muted disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Test Istatistikleri */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-border">
            <div>
              <span className="text-xs text-muted-foreground">Durum</span>
              <p className="text-sm font-medium text-foreground">
                {badge.label}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                Toplam Atama
              </span>
              <p className="text-sm font-medium text-foreground">
                {test._count.assignments}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                Benzersiz Ziyaretci
              </span>
              <p className="text-sm font-medium text-foreground">
                {test.uniqueVisitors}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                Olusturulma
              </span>
              <p className="text-sm font-medium text-foreground">
                {new Date(test.createdAt).toLocaleDateString("tr-TR")}
              </p>
            </div>
          </div>
        </div>

        {/* Varyant Yonetimi */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Varyant Yonetimi</h2>
            {isEditable && (
              <button
                type="button"
                onClick={addVariant}
                className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                + Varyant Ekle
              </button>
            )}
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
                  {isEditable && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-red-500 hover:text-red-700 text-sm transition-colors"
                    >
                      Sil
                    </button>
                  )}
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
                      disabled={!isEditable}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:cursor-not-allowed"
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
                      disabled={!isEditable}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:cursor-not-allowed"
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
                      disabled={!isEditable}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:cursor-not-allowed"
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
                        disabled={!isEditable}
                        className="rounded border-border text-primary focus:ring-primary disabled:opacity-50"
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
                    disabled={!isEditable}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none disabled:bg-muted disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            ))}
          </div>

          {isEditable && (
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
              {variants.reduce((sum, v) => sum + v.trafficWeight, 0) !==
                100 && (
                <span className="text-xs text-yellow-600">
                  (100 olmasi onerilir)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        {isEditable && (
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Kaydediliyor..." : "Degisiklikleri Kaydet"}
            </button>
            <Link
              href="/admin/ab-testleri"
              className="px-6 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Iptal
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}
