"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProductImage {
  id?: string;
  url: string;
  alt?: string | null;
}

interface VariantType {
  name: string;
  options: string[];
}

interface Variant {
  sku?: string | null;
  barcode?: string | null;
  price?: number | null;
  stock?: number;
  isActive?: boolean;
  options: Record<string, string>;
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description?: string | null;
  shortDesc?: string | null;
  sku?: string | null;
  barcode?: string | null;
  price: number;
  comparePrice?: number | null;
  costPrice?: number | null;
  stock: number;
  minQty: number;
  maxQty?: number | null;
  weight?: number | null;
  isActive: boolean;
  isFeatured: boolean;
  membersOnly: boolean;
  categoryId?: string | null;
  brandId?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  images: ProductImage[];
  variantTypes: { name: string; options: { value: string }[] }[];
  variants: Variant[];
  tags: { tag: string }[];
}

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  brands: Brand[];
}

export default function ProductForm({
  product,
  categories,
  brands,
}: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    shortDesc: product?.shortDesc || "",
    sku: product?.sku || "",
    barcode: product?.barcode || "",
    price: product?.price?.toString() || "",
    comparePrice: product?.comparePrice?.toString() || "",
    costPrice: product?.costPrice?.toString() || "",
    stock: product?.stock?.toString() || "0",
    minQty: product?.minQty?.toString() || "1",
    maxQty: product?.maxQty?.toString() || "",
    weight: product?.weight?.toString() || "",
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    membersOnly: product?.membersOnly ?? false,
    categoryId: product?.categoryId || "",
    brandId: product?.brandId || "",
    seoTitle: product?.seoTitle || "",
    seoDescription: product?.seoDescription || "",
    seoKeywords: product?.seoKeywords || "",
    tags: product?.tags?.map((t) => t.tag).join(", ") || "",
  });

  const [images, setImages] = useState<ProductImage[]>(product?.images || []);
  const [variantTypes, setVariantTypes] = useState<VariantType[]>(
    product?.variantTypes?.map((vt) => ({
      name: vt.name,
      options: vt.options.map((o) => o.value),
    })) || []
  );
  const [variants, setVariants] = useState<Variant[]>(product?.variants || []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "products");

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setImages((prev) => [...prev, { url: data.url, alt: "" }]);
      }
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function addVariantType() {
    setVariantTypes((prev) => [...prev, { name: "", options: [] }]);
  }

  function removeVariantType(index: number) {
    setVariantTypes((prev) => prev.filter((_, i) => i !== index));
    setVariants([]);
  }

  function generateVariants() {
    if (variantTypes.length === 0) return;

    const combos: Record<string, string>[] = [{}];

    for (const vt of variantTypes) {
      const newCombos: Record<string, string>[] = [];
      for (const combo of combos) {
        for (const option of vt.options) {
          newCombos.push({ ...combo, [vt.name]: option });
        }
      }
      combos.length = 0;
      combos.push(...newCombos);
    }

    setVariants(
      combos.map((options) => ({
        options,
        stock: 0,
        price: undefined,
        sku: undefined,
      }))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = product
        ? `/api/products/${product.id}`
        : "/api/products";
      const method = product ? "PUT" : "POST";

      const payload = {
        ...formData,
        images,
        variantTypes,
        variants,
        tags: formData.tags
          ? formData.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
          : [],
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/admin/urunler");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Islem basarisiz.");
      }
    } catch {
      alert("Bir hata olustu.");
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: "general", label: "Genel" },
    { id: "pricing", label: "Fiyat & Stok" },
    { id: "images", label: "Resimler" },
    { id: "variants", label: "Varyantlar" },
    { id: "seo", label: "SEO" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "general" && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Urun Adi *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Kategori</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Kategori Sec</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Marka</label>
              <select
                value={formData.brandId}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Marka Sec</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kisa Aciklama</label>
            <textarea
              value={formData.shortDesc}
              onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Detayli Aciklama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Barkod</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Etiketler</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Virgul ile ayirin"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Aktif</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">One Cikan</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.membersOnly}
                onChange={(e) => setFormData({ ...formData, membersOnly: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Sadece Uyeler</span>
            </label>
          </div>
        </div>
      )}

      {activeTab === "pricing" && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Satis Fiyati (TL) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Karsilastirma Fiyati (TL)</label>
              <input
                type="number"
                step="0.01"
                value={formData.comparePrice}
                onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Maliyet Fiyati (TL)</label>
              <input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stok Adedi</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min. Siparis Adedi</label>
              <input
                type="number"
                value={formData.minQty}
                onChange={(e) => setFormData({ ...formData, minQty: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max. Siparis Adedi</label>
              <input
                type="number"
                value={formData.maxQty}
                onChange={(e) => setFormData({ ...formData, maxQty: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Agirlik (kg)</label>
              <input
                type="number"
                step="0.01"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "images" && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Resim Yukle</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-primary file:text-white hover:file:bg-primary-dark"
            />
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img.url}
                    alt={img.alt || ""}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-danger text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "variants" && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Varyant Tipleri</h3>
            <button
              type="button"
              onClick={addVariantType}
              className="px-3 py-1 text-sm bg-primary text-white rounded-lg"
            >
              + Varyant Tipi Ekle
            </button>
          </div>

          {variantTypes.map((vt, vtIndex) => (
            <div key={vtIndex} className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="text"
                  value={vt.name}
                  onChange={(e) => {
                    const updated = [...variantTypes];
                    updated[vtIndex].name = e.target.value;
                    setVariantTypes(updated);
                  }}
                  placeholder="Tip adi (ornek: Renk, Beden)"
                  className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => removeVariantType(vtIndex)}
                  className="px-3 py-2 text-danger text-sm"
                >
                  Kaldir
                </button>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Secenekler (virgul ile ayirin: Kirmizi, Mavi, Yesil)"
                  defaultValue={vt.options.join(", ")}
                  onBlur={(e) => {
                    const updated = [...variantTypes];
                    updated[vtIndex].options = e.target.value
                      .split(",")
                      .map((o) => o.trim())
                      .filter(Boolean);
                    setVariantTypes(updated);
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>
          ))}

          {variantTypes.length > 0 && (
            <button
              type="button"
              onClick={generateVariants}
              className="px-4 py-2 bg-secondary text-white rounded-lg text-sm"
            >
              Varyantlari Olustur
            </button>
          )}

          {variants.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left">Varyant</th>
                    <th className="px-3 py-2 text-left">SKU</th>
                    <th className="px-3 py-2 text-right">Fiyat</th>
                    <th className="px-3 py-2 text-right">Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, vIndex) => (
                    <tr key={vIndex} className="border-b">
                      <td className="px-3 py-2">
                        {Object.entries(v.options)
                          .map(([k, val]) => `${k}: ${val}`)
                          .join(" / ")}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={v.sku || ""}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[vIndex].sku = e.target.value;
                            setVariants(updated);
                          }}
                          className="w-full px-2 py-1 border border-border rounded"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={v.price ?? ""}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[vIndex].price = e.target.value
                              ? parseFloat(e.target.value)
                              : undefined;
                            setVariants(updated);
                          }}
                          className="w-24 px-2 py-1 border border-border rounded text-right"
                          placeholder="Ana fiyat"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={v.stock ?? 0}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[vIndex].stock = parseInt(e.target.value) || 0;
                            setVariants(updated);
                          }}
                          className="w-20 px-2 py-1 border border-border rounded text-right"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "seo" && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">SEO Baslik</label>
            <input
              type="text"
              value={formData.seoTitle}
              onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SEO Aciklama</label>
            <textarea
              value={formData.seoDescription}
              onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Anahtar Kelimeler</label>
            <input
              type="text"
              value={formData.seoKeywords}
              onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Virgul ile ayirin"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Kaydediliyor..." : product ? "Guncelle" : "Olustur"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
        >
          Iptal
        </button>
      </div>
    </form>
  );
}
