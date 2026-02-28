"use client";

import { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/Header";

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 md:p-6 bg-muted/30 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
