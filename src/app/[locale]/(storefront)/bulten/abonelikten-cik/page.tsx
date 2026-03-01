"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NewsletterUnsubscribePage() {
  const t = useTranslations("newsletter");
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleUnsubscribe = useCallback(async () => {
    if (!email) {
      setStatus("error");
      setMessage(t("emailNotFound"));
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message || t("defaultUnsubscribeSuccess"));
      } else {
        setStatus("error");
        setMessage(data.error || t("defaultError"));
      }
    } catch {
      setStatus("error");
      setMessage(t("defaultConnectionError"));
    }
  }, [email, t]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {status === "success" ? (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-3">{t("unsubscribedHeading")}</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              {t("returnHome")}
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-3">{t("unsubscribeTitle")}</h1>
            <p className="text-muted-foreground mb-2">
              {t("unsubscribeConfirm")}
            </p>
            {email && (
              <p className="text-sm text-foreground font-medium mb-6">{email}</p>
            )}

            {status === "error" && (
              <p className="text-sm text-danger mb-4">{message}</p>
            )}

            <div className="flex gap-3 justify-center">
              <Link
                href="/"
                className="px-6 py-2.5 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                {t("cancelButton")}
              </Link>
              <button
                onClick={handleUnsubscribe}
                disabled={status === "loading"}
                className="px-6 py-2.5 bg-danger text-white rounded-lg text-sm font-medium hover:bg-danger/90 transition-colors disabled:opacity-50"
              >
                {status === "loading" ? t("processing") : t("cancelSubscription")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
