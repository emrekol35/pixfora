"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Integration {
  id: string;
  service: string;
  isActive: boolean;
  config: Record<string, string> | null;
}

interface ConfigRow {
  key: string;
  value: string;
}

const EMPTY_FORM = {
  service: "",
  isActive: true,
};

export default function IntegrationManager({
  integrations,
}: {
  integrations: Integration[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [configRows, setConfigRows] = useState<ConfigRow[]>([]);

  function openCreate() {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setConfigRows([]);
    setShowForm(true);
  }

  function openEdit(integration: Integration) {
    setEditingId(integration.id);
    setFormData({
      service: integration.service,
      isActive: integration.isActive,
    });
    setConfigRows(
      integration.config
        ? Object.entries(integration.config).map(([key, value]) => ({
            key,
            value,
          }))
        : []
    );
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  function addConfigRow() {
    setConfigRows([...configRows, { key: "", value: "" }]);
  }

  function updateConfigRow(
    index: number,
    field: "key" | "value",
    val: string
  ) {
    const updated = [...configRows];
    updated[index][field] = val;
    setConfigRows(updated);
  }

  function removeConfigRow(index: number) {
    setConfigRows(configRows.filter((_, i) => i !== index));
  }

  function buildConfig(): Record<string, string> | null {
    const validRows = configRows.filter(
      (r) => r.key.trim() !== "" && r.value.trim() !== ""
    );
    if (validRows.length === 0) return null;
    const config: Record<string, string> = {};
    for (const row of validRows) {
      config[row.key.trim()] = row.value.trim();
    }
    return config;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingId
        ? `/api/integrations/${editingId}`
        : "/api/integrations";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: formData.service.trim(),
          isActive: formData.isActive,
          config: buildConfig(),
        }),
      });

      if (res.ok) {
        closeForm();
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

  async function handleDelete(integration: Integration) {
    if (
      !confirm(
        `"${integration.service}" entegrasyonunu silmek istediginize emin misiniz?`
      )
    ) {
      return;
    }

    const res = await fetch(`/api/integrations/${integration.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Silme islemi basarisiz.");
    }
  }

  async function handleToggleActive(integration: Integration) {
    const res = await fetch(`/api/integrations/${integration.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !integration.isActive }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Durum degistirilemedi.");
    }
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {integrations.length} entegrasyon
        </p>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm transition-colors"
        >
          Yeni Entegrasyon
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? "Entegrasyonu Duzenle" : "Yeni Entegrasyon"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Servis *
                </label>
                <input
                  type="text"
                  value={formData.service}
                  onChange={(e) =>
                    setFormData({ ...formData, service: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="ornek: iyzico, aras-kargo, google-analytics"
                  required
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="formIsActive" className="text-sm">
                  Aktif
                </label>
              </div>
            </div>

            {/* Config key-value rows */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Ayarlar</label>
                <button
                  type="button"
                  onClick={addConfigRow}
                  className="px-3 py-1 text-xs bg-muted rounded hover:bg-muted/80 transition-colors"
                >
                  Ayar Ekle
                </button>
              </div>
              {configRows.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Henuz ayar eklenmedi.
                </p>
              )}
              <div className="space-y-2">
                {configRows.map((row, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={row.key}
                      onChange={(e) =>
                        updateConfigRow(index, "key", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="Anahtar"
                    />
                    <input
                      type="text"
                      value={row.value}
                      onChange={(e) =>
                        updateConfigRow(index, "value", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="Deger"
                    />
                    <button
                      type="button"
                      onClick={() => removeConfigRow(index)}
                      className="px-2 py-2 text-sm text-danger hover:bg-danger/10 rounded transition-colors"
                    >
                      Kaldir
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Form actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading
                  ? "Kaydediliyor..."
                  : editingId
                  ? "Guncelle"
                  : "Olustur"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Iptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Card grid */}
      {integrations.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">
            Henuz entegrasyon eklenmemis.
          </p>
          <button
            onClick={openCreate}
            className="text-primary hover:underline text-sm mt-2 inline-block"
          >
            Ilk entegrasyonu olusturun
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="bg-card border border-border rounded-xl p-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-foreground">
                    {integration.service}
                  </h3>
                </div>
                <button
                  onClick={() => handleToggleActive(integration)}
                  className={`px-3 py-1 rounded-full text-xs font-medium text-white transition-colors ${
                    integration.isActive
                      ? "bg-success hover:bg-success/80"
                      : "bg-danger hover:bg-danger/80"
                  }`}
                >
                  {integration.isActive ? "Aktif" : "Pasif"}
                </button>
              </div>

              {/* Config */}
              {integration.config &&
                Object.keys(integration.config).length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Ayarlar
                    </p>
                    <ul className="space-y-1">
                      {Object.entries(integration.config).map(
                        ([key, value]) => (
                          <li
                            key={key}
                            className="text-xs bg-muted rounded px-2 py-1 flex justify-between"
                          >
                            <span className="font-medium">{key}</span>
                            <span className="text-muted-foreground truncate ml-2 max-w-[120px]">
                              {value}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => openEdit(integration)}
                  className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 transition-colors"
                >
                  Duzenle
                </button>
                <button
                  onClick={() => handleDelete(integration)}
                  className="px-3 py-1 text-sm bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
