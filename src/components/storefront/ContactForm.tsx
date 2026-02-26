"use client";

import { useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Genel",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          subject: form.subject,
          message: form.message,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Mesaj gonderilemedi");
      }

      setSuccess(true);
      setForm({ name: "", email: "", phone: "", subject: "Genel", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mesaj gonderilemedi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">Bize Yazin</h2>

      {success && (
        <div className="bg-success/10 text-success border border-success/20 rounded-lg p-4 mb-4 text-sm">
          Mesajiniz basariyla gonderildi. En kisa surede donus yapacagiz.
        </div>
      )}

      {error && (
        <div className="bg-danger/10 text-danger border border-danger/20 rounded-lg p-4 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Ad Soyad <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border border-border rounded-lg px-3 py-2 bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            E-posta <span className="text-danger">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border border-border rounded-lg px-3 py-2 bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            Telefon
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border border-border rounded-lg px-3 py-2 bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-1">
            Konu <span className="text-danger">*</span>
          </label>
          <select
            id="subject"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            required
            className="w-full border border-border rounded-lg px-3 py-2 bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="Genel">Genel</option>
            <option value="Siparis Hakkinda">Siparis Hakkinda</option>
            <option value="Iade/Degisim">Iade/Degisim</option>
            <option value="Oneri/Sikayet">Oneri/Sikayet</option>
            <option value="Diger">Diger</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            Mesaj <span className="text-danger">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={form.message}
            onChange={handleChange}
            required
            rows={6}
            className="w-full border border-border rounded-lg px-3 py-2 bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-vertical"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white font-medium py-2.5 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Gonderiliyor..." : "Mesaj Gonder"}
        </button>
      </form>
    </div>
  );
}
