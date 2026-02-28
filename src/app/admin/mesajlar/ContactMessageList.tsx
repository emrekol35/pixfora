"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

type FilterTab = "all" | "unread" | "read";

export default function ContactMessageList({
  messages,
}: {
  messages: ContactMessage[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredMessages = messages.filter((m) => {
    if (filter === "unread") return !m.isRead;
    if (filter === "read") return m.isRead;
    return true;
  });

  const toggleRead = async (id: string, currentIsRead: boolean) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/contact/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: !currentIsRead }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Toggle read error:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Bu mesaji silmek istediginizden emin misiniz?")) return;

    setLoadingId(id);
    try {
      const res = await fetch(`/api/contact/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "Tumu" },
    { key: "unread", label: "Okunmamis" },
    { key: "read", label: "Okunmus" },
  ];

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === tab.key
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {filteredMessages.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          Mesaj bulunamadi.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left px-4 py-3 font-medium">Gonderen</th>
                  <th className="text-left px-4 py-3 font-medium">E-posta</th>
                  <th className="text-left px-4 py-3 font-medium">Konu</th>
                  <th className="text-left px-4 py-3 font-medium">Tarih</th>
                  <th className="text-left px-4 py-3 font-medium">Durum</th>
                  <th className="text-left px-4 py-3 font-medium">Islemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((msg) => (
                  <>
                    <tr
                      key={msg.id}
                      onClick={() =>
                        setExpandedId(expandedId === msg.id ? null : msg.id)
                      }
                      className={`border-b border-border cursor-pointer transition-colors hover:bg-muted ${
                        !msg.isRead ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className={`px-4 py-3 ${!msg.isRead ? "font-bold" : ""}`}>
                        {msg.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {msg.email}
                      </td>
                      <td className="px-4 py-3">{msg.subject}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-4 py-3">
                        {msg.isRead ? (
                          <span className="inline-block text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            Okundu
                          </span>
                        ) : (
                          <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            Yeni
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleRead(msg.id, msg.isRead)}
                            disabled={loadingId === msg.id}
                            className="text-xs px-3 py-1 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            {msg.isRead ? "Okunmadi" : "Okundu"}
                          </button>
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            disabled={loadingId === msg.id}
                            className="text-xs px-3 py-1 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === msg.id && (
                      <tr key={`${msg.id}-detail`} className="border-b border-border">
                        <td colSpan={6} className="px-4 py-4 bg-muted/50">
                          <div className="space-y-2">
                            {msg.phone && (
                              <p className="text-sm">
                                <span className="font-medium">Telefon:</span>{" "}
                                <span className="text-muted-foreground">{msg.phone}</span>
                              </p>
                            )}
                            <p className="text-sm">
                              <span className="font-medium">Mesaj:</span>
                            </p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {msg.message}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-border">
            {filteredMessages.map((msg) => (
              <div key={msg.id}>
                <div
                  onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                  className={`p-4 space-y-2 cursor-pointer ${!msg.isRead ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${!msg.isRead ? "font-bold" : "font-medium"}`}>
                        {msg.name}
                      </p>
                      {!msg.isRead && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                          Yeni
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                  <p className="text-sm">{msg.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">{msg.email}</p>
                </div>
                {expandedId === msg.id && (
                  <div className="px-4 pb-4 space-y-3 bg-muted/30">
                    {msg.phone && (
                      <p className="text-xs">
                        <span className="font-medium">Telefon:</span>{" "}
                        <span className="text-muted-foreground">{msg.phone}</span>
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {msg.message}
                    </p>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleRead(msg.id, msg.isRead)}
                        disabled={loadingId === msg.id}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
                      >
                        {msg.isRead ? "Okunmadi" : "Okundu"}
                      </button>
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        disabled={loadingId === msg.id}
                        className="text-xs px-3 py-1.5 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
