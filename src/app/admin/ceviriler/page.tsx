"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface TranslationStat {
  type: string;
  label: string;
  total: number;
  translated: number;
}

export default function TranslationsPage() {
  const [stats, setStats] = useState<TranslationStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/translations?locale=en")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Çeviri Yönetimi</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Çeviri Yönetimi</h1>
        <span className="text-sm text-muted-foreground">
          Hedef Dil: İngilizce (EN)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const percentage = stat.total > 0 ? Math.round((stat.translated / stat.total) * 100) : 0;
          return (
            <Link
              key={stat.type}
              href={`/admin/ceviriler/${stat.type}`}
              className="block p-6 bg-card border border-border rounded-xl hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{stat.label}</h3>
                <span className="text-2xl font-bold text-primary">{percentage}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {stat.translated} / {stat.total} çevrildi
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-medium mb-2">Bilgi</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Çevirisi yapılmamış alanlar orijinal Türkçe içerikle gösterilir.</li>
          <li>• Bir alan çevrilmişse, İngilizce sitede çevrilen versiyon gösterilir.</li>
          <li>• Çeviri slug tanımlanırsa, İngilizce URL'de o slug kullanılır.</li>
        </ul>
      </div>
    </div>
  );
}
