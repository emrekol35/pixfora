"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface Receipt {
  id: string;
  mediaUrl: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

interface DekontUploadFormProps {
  orderId: string;
  orderNumber: string;
  existingReceipts: Receipt[];
}

export default function DekontUploadForm({
  orderId,
  orderNumber,
  existingReceipts: initialReceipts,
}: DekontUploadFormProps) {
  const t = useTranslations("order");
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const latestReceipt = receipts[0];
  const hasApproved = receipts.some((r) => r.status === "APPROVED");
  const hasPending = receipts.some((r) => r.status === "PENDING");
  const canUpload = !hasApproved && !hasPending;

  const handleUpload = async (file: File) => {
    setError("");
    setSuccess("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orderId", orderId);

      const res = await fetch("/api/payment/bank-transfer/receipt", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yukleme hatasi");

      setReceipts((prev) => [data.receipt, ...prev]);
      setSuccess(t("receiptUploaded"));
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yukleme hatasi");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  // Odeme onaylandi
  if (hasApproved) {
    return (
      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-green-800 dark:text-green-200">{t("paymentCompleted")}</p>
            <p className="text-sm text-green-600 dark:text-green-400">{t("receiptApproved")}</p>
          </div>
        </div>
      </div>
    );
  }

  // Dekont inceleniyor
  if (hasPending) {
    return (
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <p className="font-semibold text-blue-800 dark:text-blue-200">{t("receiptUploaded")}</p>
            <p className="text-sm text-blue-600 dark:text-blue-400">{t("paymentPending")}</p>
          </div>
        </div>
        {latestReceipt && (
          <div className="mt-3 flex items-center gap-2">
            <a
              href={latestReceipt.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Yuklenen dekont
            </a>
            <span className="text-xs text-muted-foreground">
              {new Date(latestReceipt.createdAt).toLocaleString("tr-TR")}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Reddedilen dekont varsa
  const rejectedReceipt = receipts.find((r) => r.status === "REJECTED");

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold text-foreground mb-2">{t("uploadReceipt")}</h3>
      <p className="text-sm text-muted-foreground mb-4">{t("uploadReceiptDesc")}</p>

      {/* Reddedilen dekont uyarisi */}
      {rejectedReceipt && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">{t("receiptRejected")}</p>
          {rejectedReceipt.adminNote && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              <span className="font-medium">{t("rejectionReason")}:</span> {rejectedReceipt.adminNote}
            </p>
          )}
        </div>
      )}

      {/* Yukleme alani */}
      {canUpload && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={onFileSelect}
            className="hidden"
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Yukleniyor...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground">
                {rejectedReceipt ? t("reuploadReceipt") : t("uploadReceipt")}
              </p>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP, PDF (max 5MB)
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-3">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-600 mt-3">{success}</p>
      )}
    </div>
  );
}
