"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

interface Address {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string | null;
  address: string;
  zipCode: string | null;
  type: string;
  isDefault: boolean;
}

interface AddressFormData {
  title: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string;
  address: string;
  zipCode: string;
  isDefault: boolean;
}

const emptyForm: AddressFormData = {
  title: "",
  firstName: "",
  lastName: "",
  phone: "",
  city: "",
  district: "",
  neighborhood: "",
  address: "",
  zipCode: "",
  isDefault: false,
};

export default function AddressManager({
  addresses: initialAddresses,
}: {
  addresses: Address[];
}) {
  const t = useTranslations("account");
  const common = useTranslations("common");
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError(null);
  }

  function openEditForm(addr: Address) {
    setEditingId(addr.id);
    setForm({
      title: addr.title,
      firstName: addr.firstName,
      lastName: addr.lastName,
      phone: addr.phone,
      city: addr.city,
      district: addr.district,
      neighborhood: addr.neighborhood || "",
      address: addr.address,
      zipCode: addr.zipCode || "",
      isDefault: addr.isDefault,
    });
    setShowForm(true);
    setError(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = editingId
        ? `/api/account/addresses/${editingId}`
        : "/api/account/addresses";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          neighborhood: form.neighborhood || undefined,
          zipCode: form.zipCode || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Bir hata olustu");
      }

      closeForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata olustu");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetDefault(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Bir hata olustu");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata olustu");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("confirmDeleteAddress"))) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Bir hata olustu");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata olustu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="bg-danger/10 text-danger px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Address Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {initialAddresses.map((addr) => (
          <div
            key={addr.id}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-foreground">{addr.title}</h3>
              {addr.isDefault && (
                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                  {t("defaultAddress")}
                </span>
              )}
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="text-foreground">
                {addr.firstName} {addr.lastName}
              </p>
              <p>{addr.address}</p>
              <p>
                {addr.neighborhood && `${addr.neighborhood}, `}
                {addr.district} / {addr.city}
                {addr.zipCode && ` - ${addr.zipCode}`}
              </p>
              <p>{addr.phone}</p>
            </div>
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border">
              <button
                onClick={() => openEditForm(addr)}
                className="text-sm text-primary hover:underline"
                disabled={loading}
              >
                {common("edit")}
              </button>
              {!addr.isDefault && (
                <button
                  onClick={() => handleSetDefault(addr.id)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {t("makeDefault")}
                </button>
              )}
              <button
                onClick={() => handleDelete(addr.id)}
                className="text-sm text-danger hover:underline ml-auto"
                disabled={loading}
              >
                {common("delete")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Address Button */}
      {!showForm && (
        <button
          onClick={openNewForm}
          className="w-full border-2 border-dashed border-border rounded-xl p-6 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          + {t("newAddress")}
        </button>
      )}

      {/* Address Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {editingId ? t("editAddress") : t("newAddress")}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Adres Basligi */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("addressTitle")}
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t("addressTitlePlaceholder")}
                />
              </div>

              {/* Ad */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("firstName")}
                </label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Soyad */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("lastName")}
                </label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Telefon */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("phone")}
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="05XX XXX XX XX"
                />
              </div>

              {/* Il */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("city")}
                </label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Ilce */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("district")}
                </label>
                <input
                  type="text"
                  required
                  value={form.district}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, district: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Mahalle */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("neighborhood")}
                </label>
                <input
                  type="text"
                  value={form.neighborhood}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, neighborhood: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Posta Kodu */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("postalCode")}
                </label>
                <input
                  type="text"
                  value={form.zipCode}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, zipCode: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Adres */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("addressLine")}
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Sokak, cadde, bina no, daire no..."
                />
              </div>

              {/* Varsayilan */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, isDefault: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">
                    {t("makeDefault")}
                  </span>
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading
                  ? t("updating")
                  : editingId
                  ? t("update")
                  : common("add")}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-6 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                {common("cancel")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
