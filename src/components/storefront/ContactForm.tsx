"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ContactForm() {
  const t = useTranslations("contact");
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
      <h2 className="text-lg font-semibold mb-4">{t("formTitle")}</h2>

      {success && (
        <div className="bg-success/10 text-success border border-success/20 rounded-lg p-4 mb-4 text-sm">
          {t("success")}
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
            {t("name")} <span className="text-danger">*</span>
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
            {t("email")} <span className="text-danger">*</span>
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
            {t("phone")}
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
            {t("subject")} <span className="text-danger">*</span>
          </label>
          <select
            id="subject"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            required
            className="w-full border border-border rounded-lg px-3 py-2 bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="Genel">{t("subjects.general")}</option>
            <option value="Siparis Hakkinda">{t("subjects.order")}</option>
            <option value="Iade/Degisim">{t("subjects.return")}</option>
            <option value="Oneri/Sikayet">{t("subjects.complaint")}</option>
            <option value="Diger">{t("subjects.other")}</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            {t("message")} <span className="text-danger">*</span>
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
          {loading ? t("sending") : t("sendMessage")}
        </button>
      </form>
    </div>
  );
}
