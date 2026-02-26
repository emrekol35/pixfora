import Sidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/Header";
import AdminQueryProvider from "@/components/admin/AdminQueryProvider";

export const metadata = {
  title: "Admin Paneli",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 p-6 bg-muted/30">
          <AdminQueryProvider>{children}</AdminQueryProvider>
        </main>
      </div>
    </div>
  );
}
