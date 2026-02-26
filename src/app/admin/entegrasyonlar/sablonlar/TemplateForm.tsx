"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[] | null;
}

export default function TemplateForm({
  template,
}: {
  template?: EmailTemplate;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: template?.name || "",
    subject: template?.subject || "",
    body: template?.body || "",
    variables: template?.variables ? template.variables.join(", ") : "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = template
        ? `/api/email-templates/${template.id}`
        : "/api/email-templates";
      const method = template ? "PUT" : "POST";

      const variablesArray = formData.variables
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          subject: formData.subject.trim(),
          body: formData.body,
          variables: variablesArray.length > 0 ? variablesArray : null,
        }),
      });

      if (res.ok) {
        router.push("/admin/entegrasyonlar/sablonlar");
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Sablon Bilgileri</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Sablon Adi *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="ornek: Siparis Onay E-postasi"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Konu *</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="ornek: Siparissiniz onaylandi!"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Govde *</label>
            <textarea
              value={formData.body}
              onChange={(e) =>
                setFormData({ ...formData, body: e.target.value })
              }
              rows={15}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              placeholder="E-posta icerigini buraya yazin..."
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              HTML desteklenir
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Degiskenler
            </label>
            <input
              type="text"
              value={formData.variables}
              onChange={(e) =>
                setFormData({ ...formData, variables: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="{ad}, {email}, {siparis_no}"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Virgulle ayirin: {"{ad}"}, {"{email}"}, {"{siparis_no}"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Kaydediliyor..." : template ? "Guncelle" : "Olustur"}
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
