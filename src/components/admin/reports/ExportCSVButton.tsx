"use client";

import { downloadCsv } from "@/lib/csv-utils";

interface ExportCSVButtonProps {
  headers: string[];
  rows: (string | number)[][];
  filename: string;
  disabled?: boolean;
}

export default function ExportCSVButton({
  headers,
  rows,
  filename,
  disabled,
}: ExportCSVButtonProps) {
  function handleExport() {
    const BOM = "\uFEFF";
    const headerLine = headers.join(";");
    const dataLines = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(";")
      )
      .join("\n");
    const csvContent = BOM + headerLine + "\n" + dataLines;
    downloadCsv(csvContent, filename);
  }

  return (
    <button
      onClick={handleExport}
      disabled={disabled || rows.length === 0}
      className="inline-flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="CSV olarak indir"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      CSV Indir
    </button>
  );
}
