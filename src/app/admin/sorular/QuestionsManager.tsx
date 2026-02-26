"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Question {
  id: string;
  question: string;
  answer: string | null;
  isPublished: boolean;
  createdAt: string | Date;
  answeredAt: string | Date | null;
  user: { name: string; email: string };
  product: {
    name: string;
    slug: string;
    images: { url: string }[];
  };
  answeredBy: { name: string } | null;
}

interface Props {
  initialQuestions: Question[];
}

export default function QuestionsManager({ initialQuestions }: Props) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [filter, setFilter] = useState<"all" | "pending" | "answered" | "published">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = questions.filter((q) => {
    if (filter === "pending") return !q.answer && !q.isPublished;
    if (filter === "answered") return !!q.answer;
    if (filter === "published") return q.isPublished;
    return true;
  });

  const handleAnswer = async (id: string) => {
    if (!answerText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answerText.trim(), isPublished: true }),
      });
      if (res.ok) {
        setEditingId(null);
        setAnswerText("");
        router.refresh();
        // Yerel state guncelle
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === id
              ? { ...q, answer: answerText.trim(), isPublished: true, answeredAt: new Date().toISOString() }
              : q
          )
        );
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id: string, publish: boolean) => {
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: publish }),
      });
      if (res.ok) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === id ? { ...q, isPublished: publish } : q))
        );
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu soruyu silmek istediginize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
      }
    } catch {
      // ignore
    }
  };

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { value: "all" as const, label: "Tumu" },
          { value: "pending" as const, label: "Bekleyen" },
          { value: "answered" as const, label: "Cevaplanan" },
          { value: "published" as const, label: "Yayinda" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              filter === tab.value
                ? "bg-primary text-white"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Bu kategoride soru bulunamadi.</p>
          </div>
        ) : (
          filtered.map((q) => (
            <div
              key={q.id}
              className="bg-card border border-border rounded-xl p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {q.product.images[0]?.url ? (
                    <Image
                      src={q.product.images[0].url}
                      alt=""
                      width={40}
                      height={40}
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded-lg" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{q.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.user.name} ({q.user.email}) -{" "}
                      {new Date(q.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {q.isPublished ? (
                    <span className="px-2 py-0.5 bg-success/10 text-success text-xs rounded-full">
                      Yayinda
                    </span>
                  ) : q.answer ? (
                    <span className="px-2 py-0.5 bg-info/10 text-info text-xs rounded-full">
                      Cevaplandi
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-warning/10 text-warning text-xs rounded-full">
                      Bekliyor
                    </span>
                  )}
                </div>
              </div>

              {/* Question */}
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium mb-1">Soru:</p>
                <p className="text-sm">{q.question}</p>
              </div>

              {/* Answer */}
              {q.answer && editingId !== q.id && (
                <div className="bg-primary/5 rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">Cevap:</p>
                  <p className="text-sm">{q.answer}</p>
                  {q.answeredBy && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Cevaplayan: {q.answeredBy.name}
                    </p>
                  )}
                </div>
              )}

              {/* Answer Form */}
              {editingId === q.id && (
                <div className="space-y-2">
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Cevabinizi yazin..."
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAnswer(q.id)}
                      disabled={loading || !answerText.trim()}
                      className="px-4 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark disabled:opacity-50"
                    >
                      {loading ? "Kaydediliyor..." : "Cevapla ve Yayinla"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setAnswerText("");
                      }}
                      className="px-4 py-1.5 border border-border text-sm rounded-lg hover:bg-muted"
                    >
                      Iptal
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              {editingId !== q.id && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setEditingId(q.id);
                      setAnswerText(q.answer || "");
                    }}
                    className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
                  >
                    {q.answer ? "Duzenle" : "Cevapla"}
                  </button>
                  {q.answer && (
                    <button
                      onClick={() => handleTogglePublish(q.id, !q.isPublished)}
                      className="px-3 py-1 text-xs bg-muted rounded-lg hover:bg-muted/80"
                    >
                      {q.isPublished ? "Gizle" : "Yayinla"}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="px-3 py-1 text-xs bg-danger/10 text-danger rounded-lg hover:bg-danger/20"
                  >
                    Sil
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
