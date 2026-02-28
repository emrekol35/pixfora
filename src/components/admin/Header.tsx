"use client";

interface AdminHeaderProps {
  onMenuToggle?: () => void;
}

export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  return (
    <header className="h-14 md:h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobil hamburger menu */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-1.5 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Menu"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <h2 className="text-base md:text-lg font-semibold text-card-foreground">
          Yonetim Paneli
        </h2>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
          Bildirimler
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
            A
          </div>
          <span className="text-sm font-medium hidden sm:block">Admin</span>
        </div>
      </div>
    </header>
  );
}
