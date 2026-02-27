"use client";

interface ReportDateRangeProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onApply: () => void;
  isLoading: boolean;
}

const QUICK_RANGES = [
  { label: "Son 7 Gun", days: 7 },
  { label: "Son 30 Gun", days: 30 },
  { label: "Bu Ay", days: 0 },
];

export default function ReportDateRange({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  isLoading,
}: ReportDateRangeProps) {
  function applyRange(range: (typeof QUICK_RANGES)[number]) {
    const end = new Date();
    const start = new Date();

    if (range.days === 0) {
      start.setDate(1);
    } else {
      start.setDate(start.getDate() - range.days);
    }

    onStartDateChange(start.toISOString().split("T")[0]);
    onEndDateChange(end.toISOString().split("T")[0]);
    setTimeout(() => onApply(), 100);
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex flex-wrap items-end gap-4">
        {/* Hizli butonlar */}
        <div className="flex gap-2">
          {QUICK_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => applyRange(range)}
              className="bg-muted hover:bg-muted/80 text-foreground rounded-lg px-3 py-2 text-xs font-medium transition-colors"
            >
              {range.label}
            </button>
          ))}
        </div>
        <div className="h-8 w-px bg-border hidden sm:block" />
        <div>
          <label className="block text-sm text-muted-foreground mb-1">
            Baslangic
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 bg-muted text-foreground text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1">
            Bitis
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 bg-muted text-foreground text-sm"
          />
        </div>
        <button
          onClick={() => onApply()}
          disabled={isLoading}
          className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isLoading ? "Yukleniyor..." : "Raporu Getir"}
        </button>
      </div>
    </div>
  );
}
