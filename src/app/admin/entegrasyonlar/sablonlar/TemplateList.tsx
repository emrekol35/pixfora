"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[] | null;
}

export default function TemplateList({
  templates,
}: {
  templates: EmailTemplate[];
}) {
  const router = useRouter();

  async function handleDelete(template: EmailTemplate) {
    if (
      !confirm(
        `"${template.name}" sablonunu silmek istediginize emin misiniz?`
      )
    ) {
      return;
    }

    const res = await fetch(`/api/email-templates/${template.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Silme islemi basarisiz.");
    }
  }

  if (templates.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">
          Henuz e-posta sablonu eklenmemis.
        </p>
        <Link
          href="/admin/entegrasyonlar/sablonlar/yeni"
          className="text-primary hover:underline text-sm mt-2 inline-block"
        >
          Ilk sablonu olusturun
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Ad
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Konu
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Degiskenler
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
              Islemler
            </th>
          </tr>
        </thead>
        <tbody>
          {templates.map((template) => (
            <tr
              key={template.id}
              className="border-b border-border hover:bg-muted/50"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/admin/entegrasyonlar/sablonlar/${template.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {template.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {template.subject}
              </td>
              <td className="px-4 py-3">
                {template.variables && template.variables.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((v, i) => (
                      <span
                        key={i}
                        className="inline-block bg-muted px-2 py-0.5 rounded text-xs text-muted-foreground"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/entegrasyonlar/sablonlar/${template.id}`}
                    className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 transition-colors"
                  >
                    Duzenle
                  </Link>
                  <button
                    onClick={() => handleDelete(template)}
                    className="px-3 py-1 text-sm bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors"
                  >
                    Sil
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
