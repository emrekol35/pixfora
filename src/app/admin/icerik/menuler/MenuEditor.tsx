"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MenuItem {
  label: string;
  href: string;
  children: { label: string; href: string }[];
}

interface MenuData {
  id?: string;
  name: string;
  location: string;
  items: MenuItem[];
}

export default function MenuEditor({ menu }: { menu?: MenuData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(menu?.name || "");
  const [location, setLocation] = useState(menu?.location || "header");
  const [items, setItems] = useState<MenuItem[]>(menu?.items || []);

  function addItem() {
    setItems([...items, { label: "", href: "", children: [] }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: "label" | "href", value: string) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  }

  function addChild(parentIndex: number) {
    const newItems = [...items];
    newItems[parentIndex] = {
      ...newItems[parentIndex],
      children: [...newItems[parentIndex].children, { label: "", href: "" }],
    };
    setItems(newItems);
  }

  function removeChild(parentIndex: number, childIndex: number) {
    const newItems = [...items];
    newItems[parentIndex] = {
      ...newItems[parentIndex],
      children: newItems[parentIndex].children.filter((_, i) => i !== childIndex),
    };
    setItems(newItems);
  }

  function updateChild(parentIndex: number, childIndex: number, field: "label" | "href", value: string) {
    const newItems = [...items];
    const children = [...newItems[parentIndex].children];
    children[childIndex] = { ...children[childIndex], [field]: value };
    newItems[parentIndex] = { ...newItems[parentIndex], children };
    setItems(newItems);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { alert("Menu adi zorunlu"); return; }
    setLoading(true);

    try {
      const url = menu?.id ? `/api/menus/${menu.id}` : "/api/menus";
      const method = menu?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location, items }),
      });

      if (res.ok) {
        router.push("/admin/icerik/menuler");
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
        <h2 className="text-lg font-semibold mb-4">Menu Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Menu Adi *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Ana Menu" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Konum</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="header">Ust Menu (Header)</option>
              <option value="footer">Alt Menu (Footer)</option>
              <option value="mobile">Mobil Menu</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Menu Ogeleri</h2>
          <button type="button" onClick={addItem} className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
            + Oge Ekle
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Henuz menu ogesi yok. &quot;Oge Ekle&quot; butonuna tiklayin.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border border-border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
                  <input type="text" value={item.label} onChange={(e) => updateItem(index, "label", e.target.value)} className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Etiket" />
                  <input type="text" value={item.href} onChange={(e) => updateItem(index, "href", e.target.value)} className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" placeholder="/yol" />
                  <button type="button" onClick={() => addChild(index)} className="px-2 py-1 text-xs bg-muted rounded hover:bg-muted/80 transition-colors">+ Alt</button>
                  <button type="button" onClick={() => removeItem(index)} className="px-2 py-1 text-xs bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors">Sil</button>
                </div>

                {item.children.length > 0 && (
                  <div className="ml-9 space-y-2">
                    {item.children.map((child, ci) => (
                      <div key={ci} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">↳</span>
                        <input type="text" value={child.label} onChange={(e) => updateChild(index, ci, "label", e.target.value)} className="flex-1 px-2 py-1 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Alt etiket" />
                        <input type="text" value={child.href} onChange={(e) => updateChild(index, ci, "href", e.target.value)} className="flex-1 px-2 py-1 border border-border rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" placeholder="/alt-yol" />
                        <button type="button" onClick={() => removeChild(index, ci)} className="px-2 py-1 text-xs bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors">Sil</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50">
          {loading ? "Kaydediliyor..." : menu?.id ? "Guncelle" : "Olustur"}
        </button>
        <button type="button" onClick={() => router.back()} className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors">Iptal</button>
      </div>
    </form>
  );
}
