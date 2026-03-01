"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const t = useTranslations("profile");
  // Personal info state
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState("");
  const [infoError, setInfoError] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState("");
  const [passError, setPassError] = useState("");

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoError("");
    setInfoSuccess("");
    setInfoLoading(true);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: phone || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInfoError(data.error || t("updateError"));
      } else {
        setInfoSuccess(t("updateSuccess"));
        setTimeout(() => setInfoSuccess(""), 3000);
      }
    } catch {
      setInfoError(t("updateError"));
    } finally {
      setInfoLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (newPassword.length < 6) {
      setPassError("Yeni sifre en az 6 karakter olmalidir.");
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setPassError("Yeni sifreler eslesmiyor.");
      return;
    }

    setPassLoading(true);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPassError(data.error || t("passwordError"));
      } else {
        setPassSuccess(t("passwordSuccess"));
        setCurrentPassword("");
        setNewPassword("");
        setNewPasswordConfirm("");
        setTimeout(() => setPassSuccess(""), 3000);
      }
    } catch {
      setPassError(t("passwordError"));
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Personal Info Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">{t("personalInfo")}</h2>
        <form onSubmit={handleInfoSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1.5">
              {t("fullName")}
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="profile-email"
              className="block text-sm font-medium mb-1.5"
            >
              {t("email")}
            </label>
            <input
              id="profile-email"
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("emailReadOnly")}
            </p>
          </div>

          <div>
            <label
              htmlFor="profile-phone"
              className="block text-sm font-medium mb-1.5"
            >
              {t("phone")}
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XX XXX XX XX"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          {infoError && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
              {infoError}
            </p>
          )}

          {infoSuccess && (
            <p className="text-sm text-green-600 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg">
              {infoSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={infoLoading}
            className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {infoLoading ? t("updating") : t("updateInfo")}
          </button>
        </form>
      </div>

      {/* Password Change Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">{t("changePassword")}</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium mb-1.5"
            >
              {t("currentPassword")}
            </label>
            <input
              id="currentPassword"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Mevcut sifreniz"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium mb-1.5"
            >
              {t("newPassword")}
            </label>
            <input
              id="newPassword"
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="En az 6 karakter"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="newPasswordConfirm"
              className="block text-sm font-medium mb-1.5"
            >
              {t("confirmNewPassword")}
            </label>
            <input
              id="newPasswordConfirm"
              type="password"
              required
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              placeholder="Yeni sifrenizi tekrar girin"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          {passError && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
              {passError}
            </p>
          )}

          {passSuccess && (
            <p className="text-sm text-green-600 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg">
              {passSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={passLoading}
            className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {passLoading ? t("changingPassword") : t("changePasswordBtn")}
          </button>
        </form>
      </div>
    </div>
  );
}
