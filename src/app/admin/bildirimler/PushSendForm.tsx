"use client";

import { useState, useCallback } from "react";

interface PushStats {
  total: number;
  withUser: number;
  guest: number;
}

export default function PushSendForm({ stats }: { stats: PushStats }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim() || !message.trim()) return;

      setSending(true);
      setResult(null);

      try {
        const res = await fetch("/api/admin/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, message, url: url || undefined }),
        });

        const data = await res.json();

        if (res.ok) {
          setResult({ type: "success", text: data.message });
          setTitle("");
          setMessage("");
          setUrl("");
        } else {
          setResult({ type: "error", text: data.error || "Bir hata olustu" });
        }
      } catch {
        setResult({ type: "error", text: "Baglanti hatasi olustu" });
      } finally {
        setSending(false);
      }
    },
    [title, message, url]
  );

  return (
    <div className="space-y-6">
      {/* Istatistikler */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground mt-1">Toplam Abone</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{stats.withUser}</p>
          <p className="text-xs text-muted-foreground mt-1">Kayitli Kullanici</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-muted-foreground">{stats.guest}</p>
          <p className="text-xs text-muted-foreground mt-1">Misafir</p>
        </div>
      </div>

      {/* Gonderim Formu */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Push Bildirim Gonder</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Baslik *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bildirim basligi"
              className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={100}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Mesaj *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Bildirim mesaji"
              className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
              maxLength={300}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Link (opsiyonel)
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/kampanya veya https://..."
              className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {result && (
            <div
              className={`p-3 rounded-lg text-sm ${
                result.type === "success"
                  ? "bg-success/10 text-success"
                  : "bg-danger/10 text-danger"
              }`}
            >
              {result.text}
            </div>
          )}

          <button
            type="submit"
            disabled={sending || !title.trim() || !message.trim()}
            className="w-full px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {sending ? "Gonderiliyor..." : `Tum Abonelere Gonder (${stats.total})`}
          </button>
        </form>
      </div>
    </div>
  );
}
