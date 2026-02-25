"use client";

export default function AdminHeader() {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold text-card-foreground">
          Yonetim Paneli
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Bildirimler
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
            A
          </div>
          <span className="text-sm font-medium">Admin</span>
        </div>
      </div>
    </header>
  );
}
